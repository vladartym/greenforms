import { Link } from "react-router-dom"

type Props = {
  formId: string
  active: "form" | "preview" | "responses" | "share"
}

export function FormTabs({ formId, active }: Props) {
  return (
    <nav
      aria-label="Form sections"
      className="-mx-2 flex max-w-full justify-center overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="inline-flex flex-nowrap items-center gap-1 rounded-full bg-brand-ink/5 p-1">
        <TabLink
          to={`/form/${formId}`}
          isActive={active === "form"}
          label="Form Builder"
        />
        <TabLink
          to={`/form/${formId}/preview`}
          isActive={active === "preview"}
          label="Preview"
        />
        <TabLink
          to={`/form/${formId}/responses`}
          isActive={active === "responses"}
          label="Responses"
        />
        <TabLink
          to={`/form/${formId}/share`}
          isActive={active === "share"}
          label="Share"
        />
      </div>
    </nav>
  )
}

function TabLink({
  to,
  isActive,
  label,
}: {
  to: string
  isActive: boolean
  label: string
}) {
  return (
    <Link
      to={to}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-white px-3 text-[13px] font-medium text-brand-ink shadow-sm sm:text-[14px]"
          : "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-brand-ink/60 hover:text-brand-ink sm:text-[14px]"
      }
    >
      {label}
    </Link>
  )
}
