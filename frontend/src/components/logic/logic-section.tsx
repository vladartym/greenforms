import { useMemo, useState } from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronRight, GitBranch } from "lucide-react"

import { BrandInput } from "@/components/brand"
import { QUESTION_TYPES } from "@/components/questions/registry"
import type {
  Logic,
  LogicOperator,
  Question,
  QuestionType,
} from "@/components/questions/types"
import { cn } from "@/lib/utils"

const SUPPORTED_TYPES: QuestionType[] = ["short_text", "multiple_choice"]

type LogicSectionProps = {
  question: Question
  allQuestions: Question[]
  onChange: (logic: Logic | null) => void
  error?: string
}

function truncate(s: string, max = 30) {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + "…"
}

function questionLabel(q: Question) {
  const label = q.label.trim()
  return label.length > 0 ? label : "Untitled question"
}

export function LogicSection({
  question,
  allQuestions,
  onChange,
  error,
}: LogicSectionProps) {
  const isSupported = SUPPORTED_TYPES.includes(question.type)
  const logic = question.logic ?? null

  const laterQuestions = useMemo(
    () =>
      allQuestions.filter(
        (q) => q.id !== question.id && q.position > question.position,
      ),
    [allQuestions, question.id, question.position],
  )

  const targetId = logic?.target_question_id ?? ""
  const target = useMemo(
    () => (targetId ? (allQuestions.find((q) => q.id === targetId) ?? null) : null),
    [allQuestions, targetId],
  )

  const hasRule = logic !== null
  const [open, setOpen] = useState(hasRule)

  const choices = useMemo(() => {
    if (question.type !== "multiple_choice") return [] as string[]
    const raw = (question.config as { choices?: unknown }).choices
    if (!Array.isArray(raw)) return []
    return raw.filter((c): c is string => typeof c === "string" && c.length > 0)
  }, [question.type, question.config])

  const valueIsStaleChoice =
    question.type === "multiple_choice" &&
    logic !== null &&
    logic.value !== null &&
    logic.value !== undefined &&
    !choices.includes(String(logic.value))

  const summary = useMemo(() => {
    if (!hasRule || !logic) {
      return "No logic. Respondents continue to the next question."
    }
    const opLabel = logic.operator === "equals" ? "equals" : "is not"
    const valueText =
      logic.value === null || logic.value === undefined || logic.value === ""
        ? "…"
        : `'${truncate(String(logic.value), 20)}'`
    const targetText = target
      ? `Q${target.position + 1}`
      : logic.target_question_id === ""
        ? "…"
        : "(missing target)"
    return `If ${opLabel} ${valueText}, jump to ${targetText}`
  }, [hasRule, logic, target])

  function updateLogic(patch: Partial<Logic>) {
    const base: Logic = logic ?? {
      operator: "equals",
      value: null,
      target_question_id: "",
    }
    onChange({ ...base, ...patch })
  }

  function clearLogic() {
    onChange(null)
    setOpen(false)
  }

  return (
    <CollapsiblePrimitive.Root
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl bg-brand-ink/[0.03] ring-1 ring-brand-ink/5"
    >
      <CollapsiblePrimitive.Trigger
        className="group flex w-full cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
        aria-label="Toggle logic"
      >
        <GitBranch className="size-3.5 text-brand-ink/60" />
        <span className="text-xs font-medium text-brand-ink/70">Logic</span>
        <span className="truncate text-xs text-brand-ink/50">{summary}</span>
        <ChevronRight className="ml-auto size-3.5 text-brand-ink/50 transition-transform group-data-[state=open]:rotate-90" />
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="flex flex-col gap-3 px-4 pb-3 pt-1">
          {!isSupported ? (
            <p className="text-xs text-brand-ink/60">
              Logic isn't supported on this field type yet.
            </p>
          ) : (
            <SupportedLogicBody
              question={question}
              choices={choices}
              laterQuestions={laterQuestions}
              logic={logic}
              target={target}
              valueIsStaleChoice={valueIsStaleChoice}
              onUpdate={updateLogic}
              onClear={clearLogic}
            />
          )}
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

function SupportedLogicBody({
  question,
  choices,
  laterQuestions,
  logic,
  target,
  valueIsStaleChoice,
  onUpdate,
  onClear,
}: {
  question: Question
  choices: string[]
  laterQuestions: Question[]
  logic: Logic | null
  target: Question | null
  valueIsStaleChoice: boolean
  onUpdate: (patch: Partial<Logic>) => void
  onClear: () => void
}) {
  const operator: LogicOperator = logic?.operator ?? "equals"
  const valueString =
    logic?.value === null || logic?.value === undefined
      ? ""
      : String(logic.value)
  const targetId = logic?.target_question_id ?? ""
  const targetMissing = logic !== null && targetId !== "" && target === null

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
        <FieldLabel label="If answer">
          <SelectControl
            value={operator}
            onChange={(e) =>
              onUpdate({ operator: e.target.value as LogicOperator })
            }
            aria-label="Operator"
          >
            <option value="equals">equals</option>
            <option value="not_equals">is not</option>
          </SelectControl>
        </FieldLabel>

        <FieldLabel label="Value">
          {question.type === "multiple_choice" ? (
            choices.length === 0 ? (
              <SelectControl value="" onChange={() => {}} disabled>
                <option value="">Add choices above first.</option>
              </SelectControl>
            ) : (
              <SelectControl
                value={valueString}
                onChange={(e) =>
                  onUpdate({
                    value: e.target.value === "" ? null : e.target.value,
                  })
                }
                aria-label="Value"
              >
                <option value="">Select a choice</option>
                {choices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectControl>
            )
          ) : (
            <BrandInput
              value={valueString}
              onChange={(e) =>
                onUpdate({ value: e.target.value === "" ? null : e.target.value })
              }
              placeholder="Answer text"
              aria-label="Value"
              className="h-9 text-sm"
            />
          )}
        </FieldLabel>
      </div>

      <FieldLabel label="Then jump to">
        {laterQuestions.length === 0 ? (
          <SelectControl value="" onChange={() => {}} disabled>
            <option value="">Add a later question first.</option>
          </SelectControl>
        ) : (
          <SelectControl
            value={targetId}
            onChange={(e) =>
              onUpdate({ target_question_id: e.target.value })
            }
            aria-label="Target question"
          >
            <option value="">Select a question</option>
            {laterQuestions.map((q) => {
              const icon = QUESTION_TYPES[q.type].label
              const hiddenTag = q.hidden ? ", hidden" : ""
              return (
                <option key={q.id} value={q.id}>
                  Q{q.position + 1}: {questionLabel(q)} ({icon}{hiddenTag})
                </option>
              )
            })}
          </SelectControl>
        )}
      </FieldLabel>

      {valueIsStaleChoice && (
        <p className="text-xs text-amber-700">
          The previously selected choice is no longer available. Pick another
          value.
        </p>
      )}
      {targetMissing && (
        <p className="text-xs text-amber-700">
          The target question no longer exists. Pick another question.
        </p>
      )}
      {logic !== null && !targetMissing && targetId === "" && (
        <p className="text-xs text-amber-700">
          Pick a target question to activate this rule.
        </p>
      )}

      {logic !== null && (
        <div>
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-brand-ink/60 hover:text-brand-ink hover:underline"
          >
            Clear rule
          </button>
        </div>
      )}
    </div>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-brand-ink/60">
      {label}
      {children}
    </label>
  )
}

function SelectControl({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full appearance-none rounded-[var(--radius-pill)] border-0 bg-white px-4 text-sm text-brand-ink outline-none ring-1 ring-brand-ink/15 focus-visible:ring-2 focus-visible:ring-brand-green/30 disabled:cursor-not-allowed disabled:opacity-60 font-sans",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
