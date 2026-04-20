import { ChevronDown, Plus, X } from "lucide-react"

import { BrandInput } from "@/components/brand"
import { cn } from "@/lib/utils"
import type { EditorProps, QuestionTypeDef, RendererProps } from "./types"

type Config = {
  choices: string[]
}

function Renderer({ question, value, onChange }: RendererProps<string | null, Config>) {
  const choices = question.config.choices ?? []
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "h-12 w-full appearance-none rounded-[var(--radius-pill)] border-0 bg-white px-5 pr-12 text-base text-brand-ink outline-none ring-1 ring-brand-ink/15 focus-visible:ring-2 focus-visible:ring-brand-green/30",
          !value && "text-brand-ink/50",
        )}
      >
        <option value="" disabled>
          Select an option
        </option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-brand-ink/40"
        aria-hidden
      />
    </div>
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
    <div className="flex flex-col gap-2 pl-1">
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
  )
}

export const dropdownType: QuestionTypeDef<Config, string | null> = {
  key: "dropdown",
  label: "Dropdown",
  icon: ChevronDown,
  defaultConfig: { choices: ["", ""] },
  emptyValue: null,
  Renderer,
  Editor,
}
