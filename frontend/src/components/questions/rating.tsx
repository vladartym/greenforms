import { useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import type { QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

type Value = number | null

const MAX = 5

function Renderer({ value, onChange }: RendererProps<Value, Config>) {
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? value ?? 0

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(null)}>
      {Array.from({ length: MAX }, (_, i) => {
        const n = i + 1
        const filled = n <= active
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} of ${MAX}`}
            className="cursor-pointer p-1 outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-brand-green/40"
          >
            <Star
              className={cn(
                "size-9 transition",
                filled
                  ? "fill-brand-green text-brand-green"
                  : "text-brand-ink/30",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export const ratingType: QuestionTypeDef<Config, Value> = {
  key: "rating",
  label: "Rating",
  icon: Star,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor: null,
}
