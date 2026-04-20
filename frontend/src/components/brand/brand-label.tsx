import * as React from "react"

import { cn } from "@/lib/utils"

function BrandLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="brand-label"
      className={cn(
        "block font-sans text-[17.1px] font-normal text-brand-ink",
        className
      )}
      {...props}
    />
  )
}

export { BrandLabel }
