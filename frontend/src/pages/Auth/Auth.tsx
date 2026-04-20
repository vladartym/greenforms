import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import AuthShell from "@/components/auth/AuthShell"
import { BrandInput, PillButton } from "@/components/brand"
import { postJSON } from "@/lib/api"

type Mode = "login" | "signup"
type AuthErrors = Partial<Record<"email" | "password", string>>

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to your GreenForms account.",
    endpoint: "/api/auth/login",
    submitIdle: "Log in",
    submitBusy: "Logging in…",
    passwordAutoComplete: "current-password",
    fallbackError: "Couldn't log in. Please check your details.",
    footerPrompt: "New here?",
    footerCta: "Create an account",
    footerHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Get started in under a minute.",
    endpoint: "/api/auth/signup",
    submitIdle: "Create account",
    submitBusy: "Creating account…",
    passwordAutoComplete: "new-password",
    fallbackError: "Couldn't create your account. Please try again.",
    footerPrompt: "Already have an account?",
    footerCta: "Log in",
    footerHref: "/login",
  },
} as const

export default function Auth({ mode }: { mode: Mode }) {
  const copy = COPY[mode]

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          {copy.footerPrompt}{" "}
          <Link to={copy.footerHref} className="text-brand-green underline">
            {copy.footerCta}
          </Link>
        </>
      }
    >
      <AuthForm key={mode} copy={copy} />
    </AuthShell>
  )
}

function AuthForm({ copy }: { copy: (typeof COPY)[Mode] }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProcessing(true)
    try {
      const res = await postJSON(copy.endpoint, { email, password })
      if (res.ok) {
        navigate("/", { replace: true })
        return
      }
      const data = (await res.json().catch(() => ({}))) as {
        errors?: AuthErrors
      }
      const errs = data.errors ?? {}
      const msg = errs.email ?? errs.password ?? copy.fallbackError
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field
        id="email"
        placeholder="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        autoFocus
      />
      <Field
        id="password"
        placeholder="Password"
        type="password"
        autoComplete={copy.passwordAutoComplete}
        value={password}
        onChange={setPassword}
      />
      <PillButton type="submit" disabled={processing} className="mt-2">
        {processing ? copy.submitBusy : copy.submitIdle}
      </PillButton>
    </form>
  )
}

function Field({
  id,
  placeholder,
  type = "text",
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string
  placeholder: string
  type?: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  autoFocus?: boolean
}) {
  return (
    <BrandInput
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
    />
  )
}
