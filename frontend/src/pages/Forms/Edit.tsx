import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import {
  BrandCard,
  BrandInput,
  H2,
  PillButton,
} from "@/components/brand"
import { useHeaderAction } from "@/components/header-action"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getJSON, postJSON, putJSON, putJSONKeepalive } from "@/lib/api"
import {
  QUESTION_TYPES,
  QUESTION_TYPE_ORDER,
} from "@/components/questions/registry"
import type {
  JsonObject,
  Logic,
  Question,
  QuestionType,
} from "@/components/questions/types"
import { LogicSection } from "@/components/logic/logic-section"

const LOGIC_SUPPORTED_TYPES: QuestionType[] = ["short_text", "multiple_choice"]

type DraftQuestion = {
  uid: string
  type: QuestionType
  label: string
  required: boolean
  hidden: boolean
  config: JsonObject
  logic: Logic | null
}

type InitialQuestion = {
  id: string
  type: QuestionType
  label: string
  required: boolean
  hidden?: boolean
  position: number
  config: JsonObject
  logic?: Logic | null
}

type FormDetail = {
  id: string
  title: string
  status: "draft" | "published"
  has_unpublished_changes: boolean
  published_at: string | null
  questions: InitialQuestion[]
}

const AUTOSAVE_DELAY_MS = 800
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function newUid() {
  return Math.random().toString(36).slice(2, 10)
}

function defaultConfigFor(type: QuestionType): JsonObject {
  return { ...(QUESTION_TYPES[type].defaultConfig as JsonObject) }
}

function fromInitial(q: InitialQuestion): DraftQuestion {
  return {
    uid: q.id,
    type: q.type,
    label: q.label,
    required: q.required,
    hidden: q.hidden ?? false,
    config: { ...defaultConfigFor(q.type), ...q.config },
    logic: q.logic ?? null,
  }
}

function putPayload(title: string, questions: DraftQuestion[]) {
  return {
    title,
    questions: questions.map((q, idx) => ({
      id: UUID_RE.test(q.uid) ? q.uid : null,
      type: q.type,
      label: q.label,
      required: q.required,
      hidden: q.hidden,
      position: idx,
      config: q.config,
      logic: q.logic ?? null,
    })),
  }
}

// Rewrites temporary client uids to the real server UUIDs after a successful
// autosave. Match by position (response is shorter than draft if the user
// added a question between send and response). Only `uid` and
// `logic.target_question_id` are touched; never overwrite user edits to
// `label`, `config`, `required`, or `position`.
function reconcileIds(
  prevDraft: DraftQuestion[],
  serverQuestions: { id: string; position: number }[],
): DraftQuestion[] {
  const byPosition = new Map<number, string>()
  for (const sq of serverQuestions) byPosition.set(sq.position, sq.id)

  const mapping: Record<string, string> = {}
  prevDraft.forEach((q, idx) => {
    const serverId = byPosition.get(idx)
    if (!serverId) return
    if (!UUID_RE.test(q.uid) && q.uid !== serverId) {
      mapping[q.uid] = serverId
    }
  })

  if (Object.keys(mapping).length === 0) return prevDraft

  return prevDraft.map((q) => {
    const nextUid = mapping[q.uid] ?? q.uid
    const nextTarget =
      q.logic && q.logic.target_question_id && mapping[q.logic.target_question_id]
        ? mapping[q.logic.target_question_id]
        : null
    if (nextUid === q.uid && nextTarget === null) return q
    return {
      ...q,
      uid: nextUid,
      logic:
        nextTarget !== null && q.logic
          ? { ...q.logic, target_question_id: nextTarget }
          : q.logic,
    }
  })
}

function toQuestion(q: DraftQuestion, idx: number): Question {
  return {
    id: q.uid,
    type: q.type,
    label: q.label,
    required: q.required,
    hidden: q.hidden,
    position: idx,
    config: q.config,
    logic: q.logic,
  }
}

// Keeps logic coherent across edits: drops rules pointing at deleted/unsupported
// targets, clears partial value when a multiple_choice choice is removed,
// and strips rules from questions whose type no longer supports logic.
function normalizeLogic(qs: DraftQuestion[]): DraftQuestion[] {
  const ids = new Set(qs.map((q) => q.uid))
  let changed = false
  const next = qs.map((q) => {
    if (!q.logic) return q
    if (!LOGIC_SUPPORTED_TYPES.includes(q.type)) {
      changed = true
      return { ...q, logic: null }
    }
    let nextLogic: Logic = q.logic
    if (!ids.has(nextLogic.target_question_id)) {
      nextLogic = { ...nextLogic, target_question_id: "" }
      changed = true
    }
    if (q.type === "multiple_choice" && nextLogic.value != null) {
      const choices = Array.isArray((q.config as { choices?: unknown }).choices)
        ? ((q.config as { choices: unknown[] }).choices.filter(
            (c): c is string => typeof c === "string",
          ))
        : []
      if (!choices.includes(String(nextLogic.value))) {
        nextLogic = { ...nextLogic, value: null }
        changed = true
      }
    }
    return nextLogic === q.logic ? q : { ...q, logic: nextLogic }
  })
  return changed ? next : qs
}

export default function FormsEdit() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<FormDetail | null>(null)

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    ;(async () => {
      const res = await getJSON(`/api/forms/${formId}`)
      if (cancelled) return
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true })
        return
      }
      if (res.status === 404) {
        navigate("/", { replace: true })
        return
      }
      if (!res.ok) {
        toast.error("Couldn't load form.")
        return
      }
      setDetail((await res.json()) as FormDetail)
    })()
    return () => {
      cancelled = true
    }
  }, [formId, navigate])

  if (!detail) {
    return null
  }

  return <FormsEditInner key={detail.id} detail={detail} />
}

function FormsEditInner({ detail }: { detail: FormDetail }) {
  const [title, setTitle] = useState(detail.title)
  const [status, setStatus] = useState<"draft" | "published">(detail.status)
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    detail.questions.length > 0
      ? normalizeLogic(detail.questions.map(fromInitial))
      : [],
  )
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(
    detail.has_unpublished_changes,
  )
  const form = { id: detail.id }
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [publishErrors, setPublishErrors] = useState<Record<string, string>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const dirty = useRef(false)
  const timer = useRef<number | null>(null)
  const skipNextAutosave = useRef(false)
  const titleRef = useRef(title)
  const questionsRef = useRef(questions)

  useEffect(() => {
    titleRef.current = title
  }, [title])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  useEffect(() => {
    if (!dirty.current) {
      dirty.current = true
      return
    }
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      timer.current = null
      const res = await putJSON(
        `/api/forms/${form.id}`,
        putPayload(title, questions),
      )
      if (!res.ok) return
      const data = (await res.json().catch(() => null)) as
        | {
            has_unpublished_changes?: boolean
            questions?: { id: string; position: number }[]
          }
        | null
      if (data && typeof data.has_unpublished_changes === "boolean") {
        setHasUnpublishedChanges(data.has_unpublished_changes)
      }
      if (data && Array.isArray(data.questions)) {
        const serverQuestions = data.questions
        setQuestions((prev) => {
          const next = reconcileIds(prev, serverQuestions)
          if (next !== prev) {
            let targetRewritten = false
            for (let i = 0; i < next.length; i++) {
              const prevTarget = prev[i]?.logic?.target_question_id ?? null
              const nextTarget = next[i]?.logic?.target_question_id ?? null
              if (prevTarget !== nextTarget) {
                targetRewritten = true
                break
              }
            }
            if (!targetRewritten) skipNextAutosave.current = true
          }
          return next
        })
      }
    }, AUTOSAVE_DELAY_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [title, questions, form.id])

  useEffect(() => {
    const flush = () => {
      if (!timer.current) return
      window.clearTimeout(timer.current)
      timer.current = null
      putJSONKeepalive(
        `/api/forms/${form.id}`,
        putPayload(titleRef.current, questionsRef.current),
      )
    }
    window.addEventListener("beforeunload", flush)
    return () => {
      window.removeEventListener("beforeunload", flush)
      flush()
    }
  }, [form.id])

  function updateQuestion(uid: string, patch: Partial<DraftQuestion>) {
    setQuestions((qs) =>
      normalizeLogic(qs.map((q) => (q.uid === uid ? { ...q, ...patch } : q))),
    )
  }

  function updateQuestionConfig(uid: string, patch: JsonObject) {
    setQuestions((qs) =>
      normalizeLogic(
        qs.map((q) =>
          q.uid === uid ? { ...q, config: { ...q.config, ...patch } } : q,
        ),
      ),
    )
  }

  function updateQuestionLogic(uid: string, logic: Logic | null) {
    setQuestions((qs) =>
      qs.map((q) => (q.uid === uid ? { ...q, logic } : q)),
    )
    setPublishErrors((errs) => {
      const idx = questionsRef.current.findIndex((q) => q.uid === uid)
      if (idx < 0) return errs
      const key = `questions.${idx}.logic`
      if (!(key in errs)) return errs
      const rest = { ...errs }
      delete rest[key]
      return rest
    })
  }

  function changeQuestionType(uid: string, type: QuestionType) {
    setQuestions((qs) =>
      normalizeLogic(
        qs.map((q) =>
          q.uid === uid
            ? {
                ...q,
                type,
                config: defaultConfigFor(type),
                logic: LOGIC_SUPPORTED_TYPES.includes(type) ? q.logic : null,
              }
            : q,
        ),
      ),
    )
  }

  function removeQuestion(uid: string) {
    setQuestions((qs) => normalizeLogic(qs.filter((q) => q.uid !== uid)))
  }

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      {
        uid: newUid(),
        type: "short_text",
        label: "",
        required: false,
        hidden: false,
        config: defaultConfigFor("short_text"),
        logic: null,
      },
    ])
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setQuestions((qs) => {
      const from = qs.findIndex((q) => q.uid === active.id)
      const to = qs.findIndex((q) => q.uid === over.id)
      if (from < 0 || to < 0) return qs
      return normalizeLogic(arrayMove(qs, from, to))
    })
  }

  async function handlePublish() {
    if (!title.trim()) {
      toast.error("Enter a title before publishing.")
      return
    }
    for (const q of questions) {
      if (!q.label.trim()) {
        toast.error("Fill in every question label.")
        return
      }
    }
    if (timer.current) window.clearTimeout(timer.current)
    setPublishing(true)
    try {
      const res = await postJSON(`/api/forms/${form.id}/publish`)
      if (res.ok) {
        setStatus("published")
        setHasUnpublishedChanges(false)
        setPublishErrors({})
        toast.success("Form published")
        return
      }
      const data = (await res.json().catch(() => ({}))) as {
        errors?: Record<string, string>
      }
      const errors = data.errors ?? {}
      setPublishErrors(errors)
      const first = Object.values(errors)[0]
      toast.error(first ?? "Could not publish form")
    } finally {
      setPublishing(false)
    }
  }

  async function handleDiscard() {
    if (timer.current) window.clearTimeout(timer.current)
    setDiscarding(true)
    try {
      const res = await postJSON(`/api/forms/${form.id}/discard`)
      if (!res.ok) {
        toast.error("Could not discard changes")
        return
      }
      const data = (await res.json()) as FormDetail
      skipNextAutosave.current = true
      setTitle(data.title)
      setQuestions(
        data.questions.length > 0 ? data.questions.map(fromInitial) : [],
      )
      setHasUnpublishedChanges(false)
      setPublishErrors({})
      toast.success("Changes discarded")
    } finally {
      setDiscarding(false)
    }
  }

  const publishDisabled =
    publishing || (status === "published" && !hasUnpublishedChanges)
  const publishLabel = publishing
    ? "Publishing…"
    : status === "published" && !hasUnpublishedChanges
      ? "Published"
      : "Publish"

  useHeaderAction(
    () => (
      <div className="flex items-center gap-3">
        {status === "published" && hasUnpublishedChanges && (
          <ChangesPill onClick={handleDiscard} disabled={discarding} />
        )}
        <PillButton
          type="button"
          size="sm"
          disabled={publishDisabled}
          onClick={handlePublish}
        >
          {publishLabel}
        </PillButton>
      </div>
    ),
    [
      status,
      hasUnpublishedChanges,
      publishing,
      discarding,
      title,
      questions,
    ],
  )

  return (
    <section className="w-full px-6 pb-24 pt-6 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <H2 className="mb-4 text-[20px] leading-[1.2]">Title</H2>

        <div className="mb-8">
          <BrandInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Form title"
            aria-label="Form title"
            autoFocus
            className="h-12 text-base"
          />
        </div>

        <H2 className="mb-4 text-[20px] leading-[1.2]">Questions</H2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.uid)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-3">
              {(() => {
                const allQuestionsView = questions.map(toQuestion)
                return questions.map((q, i) => (
                  <li key={q.uid}>
                    <SortableQuestion
                      index={i}
                      question={q}
                      questionView={allQuestionsView[i]}
                      allQuestions={allQuestionsView}
                      logicError={publishErrors[`questions.${i}.logic`]}
                      onPatch={(patch) => updateQuestion(q.uid, patch)}
                      onConfigPatch={(patch) => updateQuestionConfig(q.uid, patch)}
                      onTypeChange={(t) => changeQuestionType(q.uid, t)}
                      onLogicChange={(logic) => updateQuestionLogic(q.uid, logic)}
                      onRemove={() => removeQuestion(q.uid)}
                    />
                  </li>
                ))
              })()}
            </ul>
          </SortableContext>
        </DndContext>

        {questions.length === 0 && (
          <BrandCard className="py-10 text-center text-brand-ink/50 text-sm">
            No questions yet. Add the first one below.
          </BrandCard>
        )}

        <div className="mt-4">
          <PillButton variant="outline" onClick={addQuestion}>
            <Plus className="mr-1 size-4" />
            Add question
          </PillButton>
        </div>
      </div>
    </section>
  )
}

function ChangesPill({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="inline-flex cursor-pointer items-center rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-medium text-brand-green transition-colors hover:bg-brand-green/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Changes
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="flex flex-col items-center gap-0.5 rounded-lg bg-brand-ink px-3 py-2 text-xs text-white"
      >
        <span className="font-semibold">Click to discard changes</span>
        <span className="text-white/60">
          Changes are auto-saved, but not published yet
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function SortableQuestion({
  index,
  question,
  questionView,
  allQuestions,
  logicError,
  onPatch,
  onConfigPatch,
  onTypeChange,
  onLogicChange,
  onRemove,
}: {
  index: number
  question: DraftQuestion
  questionView: Question
  allQuestions: Question[]
  logicError?: string
  onPatch: (patch: Partial<DraftQuestion>) => void
  onConfigPatch: (patch: JsonObject) => void
  onTypeChange: (type: QuestionType) => void
  onLogicChange: (logic: Logic | null) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.uid })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const def = QUESTION_TYPES[question.type]
  const Editor = def.Editor
  const TypeIcon = def.icon

  return (
    <BrandCard ref={setNodeRef} style={style} className="p-5 sm:p-6">
      <div className="flex items-start gap-1 sm:gap-3">
        <button
          type="button"
          className="-mt-1 -ml-2 inline-flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-brand-ink/40 hover:bg-brand-ink/5 hover:text-brand-ink/70 active:cursor-grabbing sm:-ml-1"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium tabular-nums text-brand-ink/60">
              Q{index + 1}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-brand-ink/5 px-3 text-sm text-brand-ink outline-none ring-1 ring-transparent hover:ring-brand-ink/15 focus-visible:ring-brand-green/40"
                aria-label="Question type"
              >
                <TypeIcon className="size-3.5 text-brand-ink/60" />
                {def.label}
                <ChevronDown className="size-3.5 text-brand-ink/50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[220px] rounded-2xl p-1.5"
              >
                {QUESTION_TYPE_ORDER.map((key) => {
                  const item = QUESTION_TYPES[key]
                  const Icon = item.icon
                  return (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={question.type === key}
                      onCheckedChange={() => onTypeChange(key)}
                      className="cursor-pointer rounded-full px-3 py-1.5 pl-8 text-sm"
                    >
                      <Icon className="absolute left-2 size-3.5 text-brand-ink/60" />
                      {item.label}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/70">
              <Checkbox
                checked={question.required}
                onCheckedChange={(c) => onPatch({ required: c === true })}
                className="size-4 data-checked:border-brand-green data-checked:bg-brand-green data-checked:text-white"
              />
              Required
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/70">
              <Checkbox
                checked={question.hidden}
                onCheckedChange={(c) => onPatch({ hidden: c === true })}
                className="size-4 data-checked:border-brand-green data-checked:bg-brand-green data-checked:text-white"
              />
              Hidden
            </label>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Delete question"
              className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand-ink/60 hover:bg-brand-ink/5 hover:text-brand-ink"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <BrandInput
            value={question.label}
            onChange={(e) => onPatch({ label: e.target.value })}
            placeholder="Question label"
            aria-label={`Question ${index + 1} label`}
          />

          {Editor && (
            <Editor
              config={question.config}
              onChange={(patch) => onConfigPatch(patch as JsonObject)}
            />
          )}

          <LogicSection
            question={questionView}
            allQuestions={allQuestions}
            onChange={onLogicChange}
            error={logicError}
          />
        </div>
      </div>
    </BrandCard>
  )
}
