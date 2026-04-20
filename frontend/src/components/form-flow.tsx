import {
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
  Question,
  QuestionType,
} from "@/components/questions/types"

export type { AnswerValue, Question, QuestionType }

type Props = {
  questions: Question[]
  className?: string
  skipValidation?: boolean
  onAdvance?: (questionId: string, value: AnswerValue) => Promise<boolean>
  onComplete?: () => Promise<boolean>
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
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)

  if (total === 0) {
    return (
      <main className={cn(className, "items-center justify-center")}>
        <Body className="text-brand-ink/60">This form has no questions yet.</Body>
      </main>
    )
  }

  const question = questions[index]
  const isFirst = index === 0
  const isLast = index === total - 1
  const progress = ((index + 1) / total) * 100

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
    if (isLast) {
      if (onComplete) {
        const ok = await onComplete()
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
    setIndex((i) => Math.min(i + 1, total - 1))
    setBusy(false)
  }

  const goBack = async () => {
    if (busy || disabled || isFirst || completed) return
    setBusy(true)
    if (onAdvance) {
      await onAdvance(question.id, answers[question.id] ?? null)
    }
    setDirection(-1)
    setIndex((i) => Math.max(i - 1, 0))
    setBusy(false)
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
                  {index + 1}
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
                  {isLast ? "Submit" : "Next"}
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
            {index + 1} of {total}
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
