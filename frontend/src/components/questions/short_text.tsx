import { useEffect, useRef } from "react"
import { Type } from "lucide-react"

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
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="Type your answer here…"
      className="h-12 sm:h-12 text-base"
    />
  )
}

export const shortTextType: QuestionTypeDef<Config, string | null> = {
  key: "short_text",
  label: "Short text",
  icon: Type,
  defaultConfig: {} as Config,
  emptyValue: null,
  Renderer,
  Editor: null,
}
