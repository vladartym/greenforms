import * as React from "react"

import { cn } from "@/lib/utils"

function BrandInput({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="brand-input"
      type={type}
      className={cn(
        "h-11 w-full rounded-[var(--radius-pill)] border-0 bg-white px-[18px] text-[14.4px] text-brand-ink outline-none ring-1 ring-brand-ink/15 placeholder:text-black/50 focus-visible:ring-2 focus-visible:ring-brand-green/30 sm:h-10",
        "font-sans",
        className
      )}
      {...props}
    />
  )
}

function BrandTextarea({
  className,
  rows = 4,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="brand-textarea"
      rows={rows}
      className={cn(
        "w-full rounded-[20px] border-0 bg-white px-[18px] py-[13.5px] text-[14.4px] text-brand-ink outline-none ring-1 ring-brand-ink/15 placeholder:text-black/50 focus-visible:ring-2 focus-visible:ring-brand-green/30",
        "font-sans",
        className
      )}
      {...props}
    />
  )
}

export { BrandInput, BrandTextarea }
