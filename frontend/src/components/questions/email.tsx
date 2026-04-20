import { useEffect, useRef } from "react"
import { AtSign } from "lucide-react"

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
      type="email"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder="you@example.com"
      className="h-12 sm:h-12 text-base"
    />
  )
}

export const emailType: QuestionTypeDef<Config, string | null> = {
  key: "email",
  label: "Email",
  icon: AtSign,
  defaultConfig: {} as Config,
  emptyValue: null,
  Renderer,
  Editor: null,
}
