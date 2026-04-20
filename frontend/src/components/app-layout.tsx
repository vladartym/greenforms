import { useEffect, useState, type ReactNode } from "react"
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom"

import { AppHeader } from "@/components/app-header"
import { FormTabs } from "@/components/form-tabs"
import {
  HeaderActionContext,
  HeaderNavContext,
  useHeaderNav,
} from "@/components/header-action"
import Home from "@/pages/Home"
import { getJSON } from "@/lib/api"

export function AppLayout() {
  const location = useLocation()
  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">("loading")
  const [action, setAction] = useState<ReactNode>(null)
  const [nav, setNav] = useState<ReactNode>(null)

  useEffect(() => {
    let cancelled = false
    getJSON("/api/me").then((res) => {
      if (cancelled) return
      setAuthState(res.ok ? "authed" : "guest")
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (authState === "loading") return null
  if (authState === "guest") {
    if (location.pathname === "/") return <Home />
    return <Navigate to="/login" replace />
  }

  return (
    <HeaderActionContext.Provider value={setAction}>
      <HeaderNavContext.Provider value={setNav}>
        <div className="min-h-dvh bg-[#f6f4f1] text-brand-ink">
          <AppHeader action={action ?? undefined} nav={nav ?? undefined} />
          <Outlet />
        </div>
      </HeaderNavContext.Provider>
    </HeaderActionContext.Provider>
  )
}

export function FormDetailLayout() {
  const { formId } = useParams<{ formId: string }>()
  const location = useLocation()
  const active = location.pathname.endsWith("/preview")
    ? "preview"
    : location.pathname.endsWith("/responses")
    ? "responses"
    : location.pathname.endsWith("/share")
    ? "share"
    : "form"

  useHeaderNav(
    () => (formId ? <FormTabs formId={formId} active={active} /> : null),
    [formId, active],
  )

  return <Outlet />
}
