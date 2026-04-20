import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { BrandLogo } from "@/components/brand"

export function AppHeader({
  action,
  nav,
}: {
  action?: ReactNode
  nav?: ReactNode
}) {
  return (
    <header className="px-6 sm:px-10">
      <div className="flex h-16 items-center">
        <div className="flex flex-1 items-center">
          <Link to="/" aria-label="Greenforms">
            <BrandLogo variant="black" className="h-6" />
          </Link>
        </div>
        <div className="hidden flex-1 items-center justify-center sm:flex">
          {nav}
        </div>
        <div className="flex flex-1 items-center justify-end">{action}</div>
      </div>
      {nav && (
        <div className="flex justify-center pb-3 sm:hidden">{nav}</div>
      )}
    </header>
  )
}
