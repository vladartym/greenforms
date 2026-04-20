import { useEffect, useRef } from "react"
import { Hash } from "lucide-react"

import { BrandInput } from "@/components/brand"
import { Checkbox } from "@/components/ui/checkbox"
import type { EditorProps, QuestionTypeDef, RendererProps } from "./types"

type Config = {
  integer?: boolean
}

type Value = number | null

function Renderer({ question, value, onChange }: RendererProps<Value, Config>) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const integer = question.config.integer === true
  return (
    <BrandInput
      ref={ref}
      type="number"
      value={value ?? ""}
      step={integer ? 1 : "any"}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === "") {
          onChange(null)
          return
        }
        const n = Number(raw)
        onChange(Number.isNaN(n) ? null : n)
      }}
      placeholder="Type a number…"
      className="h-12 sm:h-12 text-base"
    />
  )
}

function Editor({ config, onChange }: EditorProps<Config>) {
  return (
    <div className="pl-1">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/70">
        <Checkbox
          checked={config.integer === true}
          onCheckedChange={(c) => onChange({ integer: c === true })}
          className="size-4 data-checked:border-brand-green data-checked:bg-brand-green data-checked:text-white"
        />
        Whole numbers only
      </label>
    </div>
  )
}

export const numberType: QuestionTypeDef<Config, Value> = {
  key: "number",
  label: "Number",
  icon: Hash,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor,
}
