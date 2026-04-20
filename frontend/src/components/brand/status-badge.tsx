import * as React from "react"

import { cn } from "@/lib/utils"

type Status = "draft" | "published"

const styles: Record<Status, string> = {
  draft: "bg-brand-ink/5 text-brand-ink/70",
  published: "bg-brand-green/10 text-brand-green",
}

const labels: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
}

function StatusBadge({
  status,
  className,
  ...props
}: { status: Status } & React.ComponentProps<"span">) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
        className
      )}
      {...props}
    >
      {labels[status]}
    </span>
  )
}

export { StatusBadge, type Status as BadgeStatus }
