import * as React from "react"

import { cn } from "@/lib/utils"

const base = "font-sans font-normal tracking-normal text-brand-ink"

function H1({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="brand-h1"
      className={cn(
        base,
        "text-[clamp(28px,6vw,40.5px)] leading-[1.2] sm:leading-[48.6px]",
        className
      )}
      {...props}
    />
  )
}

function H2({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="brand-h2"
      className={cn(
        base,
        "text-[clamp(24px,5vw,34.2px)] leading-[1.2]",
        className
      )}
      {...props}
    />
  )
}

function Body({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="brand-body"
      className={cn(
        "font-sans text-[18px] font-normal leading-[1.55] text-brand-ink",
        className
      )}
      {...props}
    />
  )
}

export { H1, H2, Body }
