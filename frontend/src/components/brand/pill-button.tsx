import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const pillButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] font-sans font-normal transition-colors outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-green/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        filled:
          "bg-brand-green text-white hover:bg-brand-green/90",
        inverted:
          "bg-white text-brand-ink hover:bg-white/90",
        outline:
          "bg-transparent text-brand-green font-semibold hover:bg-brand-green/10",
        ghost:
          "bg-transparent text-white/80 hover:bg-white/10 hover:text-white",
      },
      size: {
        sm: "h-8 px-3 text-[14px]",
        default: "h-11 px-[18px] text-[14px] sm:h-10",
        lg: "h-12 px-6 text-[18px]",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
)

function PillButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof pillButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="pill-button"
      className={cn(pillButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { PillButton, pillButtonVariants }
