import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-brand-green" />,
        info: <InfoIcon className="size-4 text-brand-green" />,
        warning: <TriangleAlertIcon className="size-4 text-brand-green" />,
        error: <OctagonXIcon className="size-4 text-brand-green" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--radius-card)] !shadow-[var(--brand-shadow-card)] !border font-sans",
          title: "font-sans text-[14px]",
          description: "font-sans text-[13px] opacity-80",
          actionButton:
            "!rounded-[var(--radius-pill)] !bg-brand-green !text-white !px-3 !py-1.5",
          cancelButton:
            "!rounded-[var(--radius-pill)] !bg-white !text-brand-ink !px-3 !py-1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
