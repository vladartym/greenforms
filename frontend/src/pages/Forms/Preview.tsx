import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Body, H1, PillButton } from "@/components/brand"
import { FormFlow, type Question } from "@/components/form-flow"
import { getJSON } from "@/lib/api"

type FormDetail = {
  id: string
  title: string
  status: "draft" | "published"
  questions: Question[]
}

export default function FormsPreview() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<FormDetail | null>(null)

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    ;(async () => {
      const res = await getJSON(`/api/forms/${formId}`)
      if (cancelled) return
      if (res.status === 401 || res.status === 403) {
        navigate("/login", { replace: true })
        return
      }
      if (res.status === 404) {
        navigate("/", { replace: true })
        return
      }
      if (!res.ok) {
        toast.error("Couldn't load form.")
        return
      }
      setDetail((await res.json()) as FormDetail)
    })()
    return () => {
      cancelled = true
    }
  }, [formId, navigate])

  if (!detail) {
    return null
  }

  return <PreviewInner questions={detail.questions} />
}

function PreviewInner({ questions }: { questions: Question[] }) {
  const [runId, setRunId] = useState(0)

  return (
    <FormFlow
      key={runId}
      questions={questions}
      skipValidation
      className="relative flex min-h-[calc(100dvh-4rem)] flex-col"
      completion={
        <div className="mx-auto w-full max-w-2xl space-y-4 text-center">
          <H1 className="text-[clamp(1.75rem,4vw,36px)] leading-[1.2]">
            End of preview.
          </H1>
          <Body className="text-brand-ink/60">
            This is what respondents see after submitting.
          </Body>
          <div className="pt-2">
            <PillButton
              type="button"
              size="sm"
              onClick={() => setRunId((id) => id + 1)}
            >
              Restart preview
            </PillButton>
          </div>
        </div>
      }
    />
  )
}
