import { useEffect, useRef } from "react"
import { AlignLeft } from "lucide-react"

import { BrandTextarea } from "@/components/brand"
import type { QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

function Renderer({ value, onChange }: RendererProps<string | null, Config>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <BrandTextarea
      ref={ref}
      rows={5}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="Type your answer here…"
      className="text-base"
    />
  )
}

export const longTextType: QuestionTypeDef<Config, string | null> = {
  key: "long_text",
  label: "Long text",
  icon: AlignLeft,
  defaultConfig: {} as Config,
  emptyValue: null,
  Renderer,
  Editor: null,
}
