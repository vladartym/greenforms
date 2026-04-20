import * as React from "react"

import { cn } from "@/lib/utils"

type SectionBg =
  | "white"
  | "primary"
  | "indigo"
  | "wine"
  | "deep-red"
  | "chartreuse"
  | "periwinkle"
  | "cream"
  | "sage"
  | "blue-light"
  | "blush"

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  primary: "bg-brand-green",
  indigo: "bg-brand-indigo",
  wine: "bg-brand-wine",
  "deep-red": "bg-brand-deep-red",
  chartreuse: "bg-brand-chartreuse",
  periwinkle: "bg-brand-periwinkle",
  cream: "bg-brand-cream",
  sage: "bg-brand-sage",
  "blue-light": "bg-brand-blue-light",
  blush: "bg-brand-blush",
}

const INVERTED_BGS: SectionBg[] = [
  "primary",
  "indigo",
  "wine",
  "deep-red",
  "periwinkle",
]

function Section({
  className,
  bg = "white",
  inverted,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  bg?: SectionBg
  inverted?: boolean
  containerClassName?: string
}) {
  const isInverted = inverted ?? INVERTED_BGS.includes(bg)
  return (
    <section
      data-slot="brand-section"
      data-bg={bg}
      className={cn(
        "w-full py-[49.5px]",
        BG_CLASS[bg],
        isInverted ? "text-white" : "text-brand-ink",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-6",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}

export { Section }
export type { SectionBg }
