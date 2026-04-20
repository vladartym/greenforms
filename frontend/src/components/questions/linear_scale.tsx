import { MoreHorizontal } from "lucide-react"

import { BrandInput } from "@/components/brand"
import { cn } from "@/lib/utils"
import type { EditorProps, QuestionTypeDef, RendererProps } from "./types"

type Config = {
  min: number
  max: number
  min_label?: string
  max_label?: string
}

type Value = number | null

type Preset = "1-5" | "1-10" | "0-10"

const PRESETS: Record<Preset, { min: number; max: number; label: string }> = {
  "1-5": { min: 1, max: 5, label: "1 to 5" },
  "1-10": { min: 1, max: 10, label: "1 to 10" },
  "0-10": { min: 0, max: 10, label: "0 to 10" },
}

const PRESET_KEYS = Object.keys(PRESETS) as Preset[]

function detectPreset(min: number, max: number): Preset {
  for (const key of PRESET_KEYS) {
    const range = PRESETS[key]
    if (range.min === min && range.max === max) return key
  }
  return "1-5"
}

function Renderer({ question, value, onChange }: RendererProps<Value, Config>) {
  const { min, max, min_label, max_label } = question.config
  const values: number[] = []
  for (let i = min; i <= max; i++) values.push(i)

  return (
    <div className="flex w-fit flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {values.map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(selected ? null : n)}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full bg-white text-sm font-medium text-brand-ink ring-1 ring-brand-ink/15 transition hover:ring-brand-ink/30 focus-visible:ring-2 focus-visible:ring-brand-green/40",
                selected && "bg-brand-green text-white ring-brand-green hover:ring-brand-green",
              )}
              aria-pressed={selected}
            >
              {n}
            </button>
          )
        })}
      </div>
      {(min_label || max_label) && (
        <div className="flex justify-between text-xs text-brand-ink/50">
          <span>{min_label}</span>
          <span>{max_label}</span>
        </div>
      )}
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-brand-ink/60">
      {label}
      {children}
    </label>
  )
}

function Editor({ config, onChange }: EditorProps<Config>) {
  const preset = detectPreset(config.min, config.max)

  return (
    <div className="flex flex-col gap-3 pl-1">
      <FieldLabel label="Scale">
        <select
          value={preset}
          onChange={(e) => {
            const next = e.target.value as Preset
            const range = PRESETS[next]
            onChange({ min: range.min, max: range.max })
          }}
          className="h-9 w-full appearance-none rounded-[var(--radius-pill)] border-0 bg-white px-4 text-sm text-brand-ink outline-none ring-1 ring-brand-ink/15 focus-visible:ring-2 focus-visible:ring-brand-green/30 font-sans"
        >
          {PRESET_KEYS.map((key) => (
            <option key={key} value={key}>
              {PRESETS[key].label}
            </option>
          ))}
        </select>
      </FieldLabel>

      <div className="grid grid-cols-2 gap-2">
        <FieldLabel label="Label for min">
          <BrandInput
            value={config.min_label ?? ""}
            onChange={(e) => onChange({ min_label: e.target.value || undefined })}
            placeholder="e.g. Not at all"
            className="h-9 text-sm"
          />
        </FieldLabel>
        <FieldLabel label="Label for max">
          <BrandInput
            value={config.max_label ?? ""}
            onChange={(e) => onChange({ max_label: e.target.value || undefined })}
            placeholder="e.g. Extremely"
            className="h-9 text-sm"
          />
        </FieldLabel>
      </div>
    </div>
  )
}

export const linearScaleType: QuestionTypeDef<Config, Value> = {
  key: "linear_scale",
  label: "Linear scale",
  icon: MoreHorizontal,
  defaultConfig: {
    min: 1,
    max: 5,
    min_label: "Not likely",
    max_label: "Very likely",
  },
  emptyValue: null,
  Renderer,
  Editor,
}
