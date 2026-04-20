import { useEffect, useRef } from "react"
import { Calendar } from "lucide-react"

import { BrandInput } from "@/components/brand"
import type { QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

function Renderer({ value, onChange }: RendererProps<string | null, Config>) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <BrandInput
      ref={ref}
      type="date"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-12 sm:h-12 text-base"
    />
  )
}

export const dateType: QuestionTypeDef<Config, string | null> = {
  key: "date",
  label: "Date",
  icon: Calendar,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor: null,
}
