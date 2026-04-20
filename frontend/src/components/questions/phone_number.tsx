import { useEffect, useRef } from "react"
import { Phone } from "lucide-react"
import { IMaskInput } from "react-imask"

import { cn } from "@/lib/utils"
import type { QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

const MASK = "(000) 000-0000"

const INPUT_CLASS =
  "h-12 w-full rounded-[var(--radius-pill)] border-0 bg-white px-[18px] text-base text-brand-ink outline-none ring-1 ring-brand-ink/15 placeholder:text-black/50 focus-visible:ring-2 focus-visible:ring-brand-green/30 font-sans"

function Renderer({ value, onChange }: RendererProps<string | null, Config>) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <IMaskInput
      inputRef={ref}
      mask={MASK}
      value={value ?? ""}
      unmask={false}
      onAccept={(v: string) => onChange(v || null)}
      inputMode="tel"
      placeholder="(___) ___-____"
      className={cn(INPUT_CLASS)}
    />
  )
}

export const phoneNumberType: QuestionTypeDef<Config, string | null> = {
  key: "phone_number",
  label: "Phone number",
  icon: Phone,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor: null,
}
