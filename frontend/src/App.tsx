import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import Auth from "@/pages/Auth/Auth"
import FormsIndex from "@/pages/Forms/Index"
import FormsEdit from "@/pages/Forms/Edit"
import FormsPreview from "@/pages/Forms/Preview"
import FormsResponses from "@/pages/Forms/Responses"
import FormsShare from "@/pages/Forms/Share"
import RespondForm from "@/pages/Respond/Form"
import { AppLayout, FormDetailLayout } from "@/components/app-layout"
import { getJSON, postJSON } from "@/lib/api"

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<FormsIndex />} />
        <Route element={<FormDetailLayout />}>
          <Route path="/form/:formId" element={<FormsEdit />} />
          <Route path="/form/:formId/preview" element={<FormsPreview />} />
          <Route path="/form/:formId/responses" element={<FormsResponses />} />
          <Route path="/form/:formId/share" element={<FormsShare />} />
        </Route>
      </Route>
      <Route path="/login" element={<AuthedRedirect><Auth mode="login" /></AuthedRedirect>} />
      <Route path="/signup" element={<AuthedRedirect><Auth mode="signup" /></AuthedRedirect>} />
      <Route path="/form/new" element={<NewFormRedirect />} />
      <Route path="/f/:formId" element={<RespondForm />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function AuthedRedirect({ children }: { children: React.ReactElement }) {
  const [state, setState] = useState<"loading" | "guest" | "authed">("loading")

  useEffect(() => {
    let cancelled = false
    getJSON("/api/me").then((res) => {
      if (cancelled) return
      setState(res.ok ? "authed" : "guest")
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === "loading") return null
  if (state === "authed") return <Navigate to="/" replace />
  return children
}

function NewFormRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await postJSON("/api/forms", {
        title: "",
        status: "draft",
        questions: [
          {
            type: "short_text",
            label: "",
            required: false,
            position: 0,
            config: {},
          },
        ],
      })
      if (cancelled) return
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true })
        return
      }
      if (!res.ok) {
        toast.error("Couldn't create form.")
        navigate("/", { replace: true })
        return
      }
      const data = (await res.json()) as { id: string }
      navigate(`/form/${data.id}`, { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return null
}

function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f4f1] text-brand-ink">
      <div className="text-center">
        <h1 className="text-2xl font-medium">Page not found</h1>
        <p className="mt-2 text-brand-ink/60">The page you're looking for doesn't exist.</p>
      </div>
    </main>
  )
}
