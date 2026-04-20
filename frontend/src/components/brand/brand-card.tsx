import * as React from "react"

import { cn } from "@/lib/utils"

function BrandCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="brand-card"
      className={cn(
        "rounded-[var(--radius-card)] bg-white p-6 text-brand-ink",
        className
      )}
      {...props}
    />
  )
}

export { BrandCard }
