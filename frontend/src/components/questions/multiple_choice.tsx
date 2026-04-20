import { Check, CircleCheck, Plus, X } from "lucide-react"

import { BrandInput } from "@/components/brand"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { EditorProps, QuestionTypeDef, RendererProps } from "./types"

type Config = {
  choices: string[]
  allow_multiple: boolean
}

type Value = string | string[] | null

function Renderer({ question, value, onChange }: RendererProps<Value, Config>) {
  const choices = question.config.choices ?? []
  const allowMultiple = question.config.allow_multiple === true

  if (allowMultiple) {
    const selected = Array.isArray(value) ? value : []
    const toggle = (choice: string) => {
      const next = selected.includes(choice)
        ? selected.filter((c) => c !== choice)
        : [...selected, choice]
      onChange(next.length > 0 ? next : null)
    }
    return (
      <ul className="flex flex-col gap-2.5">
        {choices.map((choice) => (
          <ChoiceRow
            key={choice}
            multi
            label={choice}
            selected={selected.includes(choice)}
            onClick={() => toggle(choice)}
          />
        ))}
      </ul>
    )
  }

  const current = typeof value === "string" ? value : null
  return (
    <ul className="flex flex-col gap-2.5">
      {choices.map((choice) => (
        <ChoiceRow
          key={choice}
          multi={false}
          label={choice}
          selected={current === choice}
          onClick={() => onChange(current === choice ? null : choice)}
        />
      ))}
    </ul>
  )
}

function ChoiceRow({
  multi,
  label,
  selected,
  onClick,
}: {
  multi: boolean
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-pill)] bg-white px-5 py-3 text-left text-[15px] text-brand-ink outline-none ring-1 ring-brand-ink/15 transition hover:ring-brand-ink/30 focus-visible:ring-2 focus-visible:ring-brand-green/40",
          selected && "ring-2 ring-brand-green hover:ring-brand-green",
        )}
        aria-pressed={selected}
      >
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center transition",
            multi ? "rounded-md" : "rounded-full",
            selected
              ? "bg-brand-green text-white ring-1 ring-brand-green"
              : "bg-white text-transparent ring-1 ring-brand-ink/25",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
        <span className="truncate">{label}</span>
      </button>
    </li>
  )
}

function Editor({ config, onChange }: EditorProps<Config>) {
  const choices = config.choices ?? []
  const updateChoice = (i: number, value: string) =>
    onChange({ choices: choices.map((c, idx) => (idx === i ? value : c)) })
  const addChoice = () => onChange({ choices: [...choices, ""] })
  const removeChoice = (i: number) =>
    onChange({ choices: choices.filter((_, idx) => idx !== i) })

  return (
    <div className="flex flex-col gap-3 pl-1">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/70">
        <Checkbox
          checked={config.allow_multiple === true}
          onCheckedChange={(c) => onChange({ allow_multiple: c === true })}
          className="size-4 data-checked:border-brand-green data-checked:bg-brand-green data-checked:text-white"
        />
        Allow multiple answers
      </label>
      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-brand-ink/40 w-6">{i + 1}.</span>
            <BrandInput
              value={choice}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`Choice ${i + 1}`}
              aria-label={`Choice ${i + 1}`}
              className="h-9 text-sm"
            />
            {choices.length > 2 && (
              <button
                type="button"
                onClick={() => removeChoice(i)}
                aria-label="Remove choice"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addChoice}
          className="inline-flex w-fit items-center gap-1 pl-8 text-sm text-brand-green hover:underline"
        >
          <Plus className="size-3.5" />
          Add choice
        </button>
      </div>
    </div>
  )
}

export const multipleChoiceType: QuestionTypeDef<Config, Value> = {
  key: "multiple_choice",
  label: "Multiple choice",
  icon: CircleCheck,
  defaultConfig: { choices: ["", ""], allow_multiple: false },
  emptyValue: null,
  Renderer,
  Editor,
}
