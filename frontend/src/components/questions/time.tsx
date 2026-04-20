import { useEffect, useRef, useState } from "react"
import { Clock } from "lucide-react"
import { IMaskInput } from "react-imask"

import { cn } from "@/lib/utils"
import type { QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

const MASK = "00:00 aa"
const PLACEHOLDER = "__:__ __"

const INPUT_CLASS =
  "h-12 w-full rounded-[var(--radius-pill)] border-0 bg-white px-[18px] text-base text-brand-ink outline-none ring-1 ring-brand-ink/15 placeholder:text-black/50 focus-visible:ring-2 focus-visible:ring-brand-green/30 font-sans"

function to24h(display: string): string | null {
  const m = display.trim().match(/^(\d{2}):(\d{2}) ([APap])[Mm]$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const period = m[3].toUpperCase()
  if (h < 1 || h > 12 || min < 0 || min > 59) return null
  if (period === "A") {
    h = h === 12 ? 0 : h
  } else {
    h = h === 12 ? 12 : h + 12
  }
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function from24h(stored: string | null): string {
  if (!stored) return ""
  const m = stored.match(/^(\d{2}):(\d{2})$/)
  if (!m) return ""
  const h24 = Number(m[1])
  const min = Number(m[2])
  if (h24 < 0 || h24 > 23 || min < 0 || min > 59) return ""
  const period = h24 >= 12 ? "PM" : "AM"
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`
}

function Renderer({ value, onChange }: RendererProps<string | null, Config>) {
  const ref = useRef<HTMLInputElement>(null)
  const [display, setDisplay] = useState(() => from24h(value))

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <IMaskInput
      inputRef={ref}
      mask={MASK}
      value={display}
      lazy={false}
      placeholderChar="_"
      onAccept={(v: string) => {
        let next = v
        const partial = next.match(/^(\d{2}:\d{2} )([APap])_$/)
        if (partial) {
          next = partial[1] + partial[2].toUpperCase() + "M"
        }
        setDisplay(next)
        const iso = to24h(next)
        if (iso !== null) {
          onChange(iso)
          return
        }
        if (next === "" || next === PLACEHOLDER) {
          onChange(null)
        }
      }}
      inputMode="numeric"
      placeholder={PLACEHOLDER}
      className={cn(INPUT_CLASS)}
    />
  )
}

export const timeType: QuestionTypeDef<Config, string | null> = {
  key: "time",
  label: "Time",
  icon: Clock,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor: null,
}
