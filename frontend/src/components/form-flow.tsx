import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { Body, H1, PillButton } from "@/components/brand"
import { cn } from "@/lib/utils"
import { QUESTION_TYPES } from "@/components/questions/registry"
import type {
  AnswerValue,
  Logic,
  Question,
  QuestionType,
} from "@/components/questions/types"

export type { AnswerValue, Question, QuestionType }

type Props = {
  questions: Question[]
  className?: string
  skipValidation?: boolean
  onAdvance?: (questionId: string, value: AnswerValue) => Promise<boolean>
  onComplete?: (path: string[]) => Promise<boolean>
  disabled?: boolean
  header?: ReactNode
  completion?: ReactNode
}

const DEFAULT_CLASS =
  "relative flex min-h-dvh flex-col bg-[#f6f4f1] text-brand-ink"

function isEmpty(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

// Returns true if `answer` is considered equal to the logic's `value` for the
// purposes of conditional branching. Only short_text and multiple_choice are
// valid trigger types per the PRD.
function answerMatchesLogicValue(
  question: Question,
  answer: AnswerValue,
  logicValue: unknown,
): boolean {
  if (question.type === "short_text") {
    const a = typeof answer === "string" ? answer.trim() : ""
    const b = typeof logicValue === "string" ? logicValue.trim() : ""
    return a === b
  }
  if (question.type === "multiple_choice") {
    if (Array.isArray(answer)) {
      // allow_multiple=true: match when the one selected value equals logicValue.
      return answer.length === 1 && answer[0] === logicValue
    }
    return answer === logicValue
  }
  return false
}

function nextByPosition(
  current: Question,
  snapshot: Question[],
): Question | null {
  const sorted = [...snapshot].sort((a, b) => a.position - b.position)
  const idx = sorted.findIndex((q) => q.id === current.id)
  if (idx === -1) return null
  for (let i = idx + 1; i < sorted.length; i++) {
    if (!sorted[i].hidden) return sorted[i]
  }
  return null
}

function evaluateLogic(
  question: Question,
  answer: AnswerValue,
  snapshot: Question[],
): Question | null {
  const logic: Logic | null | undefined = question.logic
  if (logic && logic.operator && logic.target_question_id) {
    const matches = answerMatchesLogicValue(question, answer, logic.value)
    const shouldJump =
      (logic.operator === "equals" && matches) ||
      (logic.operator === "not_equals" && !matches)
    if (shouldJump) {
      // Explicit jumps override the hidden-skip default, so target.hidden is ignored here.
      const target = snapshot.find((q) => q.id === logic.target_question_id)
      if (target) return target
    }
  }
  return nextByPosition(question, snapshot)
}

export function FormFlow({
  questions,
  className = DEFAULT_CLASS,
  skipValidation = false,
  onAdvance,
  onComplete,
  disabled = false,
  header,
  completion,
}: Props) {
  const total = questions.length

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions],
  )
  const firstVisibleId =
    sortedQuestions.find((q) => !q.hidden)?.id ?? null

  const [stack, setStack] = useState<string[]>(() =>
    firstVisibleId ? [firstVisibleId] : [],
  )
  const [direction, setDirection] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)

  // If every question is hidden, the starting stack is empty. Auto-complete
  // with an empty path so the form doesn't render a broken state.
  const shouldAutoComplete = total > 0 && stack.length === 0 && !completed
  useEffect(() => {
    if (!shouldAutoComplete || busy) return
    let cancelled = false
    const run = async () => {
      setBusy(true)
      if (onComplete) {
        const ok = await onComplete([])
        if (cancelled) return
        if (!ok) {
          setBusy(false)
          return
        }
      }
      if (cancelled) return
      setCompleted(true)
      setBusy(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [shouldAutoComplete, busy, onComplete])

  const questionById = useMemo(() => {
    const map: Record<string, Question> = {}
    for (const q of questions) map[q.id] = q
    return map
  }, [questions])

  if (total === 0) {
    return (
      <main className={cn(className, "items-center justify-center")}>
        <Body className="text-brand-ink/60">This form has no questions yet.</Body>
      </main>
    )
  }

  const currentId = stack[stack.length - 1] ?? firstVisibleId
  const question = currentId ? questionById[currentId] : undefined

  if (!question) {
    // All questions hidden or none visited yet. If a completion slot was provided
    // render it once the auto-complete effect has run; otherwise show a neutral
    // placeholder so the UI doesn't crash.
    return (
      <main className={cn(className, "items-center justify-center")}>
        {completed && completion ? (
          completion
        ) : (
          <Body className="text-brand-ink/60">This form has no questions yet.</Body>
        )}
      </main>
    )
  }

  const isFirst = stack.length <= 1
  const visitedCount = stack.length
  const progress = (visitedCount / total) * 100

  const setAnswer = (value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [question.id]: value }))

  const goNext = async () => {
    if (busy || disabled || completed) return
    const current = answers[question.id] ?? null
    if (!skipValidation && question.required && isEmpty(current)) {
      toast.error("This question is required.")
      return
    }
    setBusy(true)
    if (onAdvance) {
      const ok = await onAdvance(question.id, current)
      if (!ok) {
        setBusy(false)
        return
      }
    }

    const next = evaluateLogic(question, current, questions)

    if (!next) {
      const finalPath = [...stack]
      if (onComplete) {
        const ok = await onComplete(finalPath)
        if (!ok) {
          setBusy(false)
          return
        }
      }
      setCompleted(true)
      setBusy(false)
      return
    }

    setDirection(1)
    // Truncate any forward history past the current question, then push next.
    setStack((prev) => {
      const idx = prev.lastIndexOf(question.id)
      const truncated = idx === -1 ? prev : prev.slice(0, idx + 1)
      return [...truncated, next.id]
    })
    setBusy(false)
  }

  const goBack = async () => {
    if (busy || disabled || isFirst || completed) return
    setDirection(-1)
    setStack((prev) => prev.slice(0, -1))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter") return
    const target = e.target as HTMLElement
    if (target.tagName === "TEXTAREA" && !e.metaKey && !e.ctrlKey) return
    if (target.tagName === "SELECT") return
    e.preventDefault()
    goNext()
  }

  const { Renderer } = QUESTION_TYPES[question.type]
  const value = answers[question.id] ?? QUESTION_TYPES[question.type].emptyValue
  const description =
    typeof question.config.description === "string" ? question.config.description : null

  return (
    <main onKeyDown={handleKeyDown} className={className}>
      {header}

      <section className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 pb-24 sm:px-10">
        {completed && completion ? (
          completion
        ) : (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={question.id}
              custom={direction}
              variants={{
                enter: (d: 1 | -1) => ({ opacity: 0, y: d === 1 ? 24 : -24 }),
                center: { opacity: 1, y: 0 },
                exit: (d: 1 | -1) => ({ opacity: 0, y: d === 1 ? -24 : 24 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                opacity: { duration: 0.22, ease: "easeOut" },
                y: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              }}
              className={cn(
                "mx-auto w-full max-w-2xl space-y-8 transition-opacity",
                disabled && "opacity-60",
              )}
            >
              <div className="space-y-3">
                <div className="text-sm font-sans text-brand-ink/50">
                  {visitedCount}
                </div>
                <H1 className="text-[clamp(1.75rem,4vw,36px)] leading-[1.2]">
                  {question.label}
                  {question.required && (
                    <span className="ml-1 text-brand-green" aria-hidden>
                      *
                    </span>
                  )}
                </H1>
                {description && (
                  <Body className="text-brand-ink/60">{description}</Body>
                )}
              </div>

              <Renderer
                question={question}
                value={value}
                onChange={setAnswer}
                onAdvance={goNext}
              />

              <div className="flex items-center gap-3 pt-2">
                {!isFirst && (
                  <PillButton
                    variant="outline"
                    size="sm"
                    onClick={goBack}
                    disabled={busy || disabled}
                  >
                    Back
                  </PillButton>
                )}
                <PillButton
                  size="sm"
                  onClick={goNext}
                  disabled={busy || disabled}
                >
                  {nextByPosition(question, questions) || question.logic
                    ? "Next"
                    : "Submit"}
                </PillButton>
                <span className="text-xs text-brand-ink/40">
                  press Enter
                  <span className="hidden sm:inline"> ↵</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {!completed && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:left-auto sm:right-10 sm:translate-x-0">
          <span className="text-sm text-brand-ink/60">
            {visitedCount} of {total}
          </span>
          <div
            className="h-1 w-32 overflow-hidden rounded-full bg-brand-ink/10"
            aria-hidden
          >
            <div
              className="h-full bg-brand-green transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </main>
  )
}
