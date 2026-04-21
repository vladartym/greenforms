import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { BrandLogo, Body, H1 } from "@/components/brand"
import {
  FormFlow,
  type AnswerValue,
  type Question,
} from "@/components/form-flow"
import { RespondContext } from "@/components/questions/context"
import { getJSON, postJSON, putJSON } from "@/lib/api"

type Data = {
  form: { id: string; title: string }
  questions: Question[]
}

export default function RespondForm() {
  const { formId } = useParams<{ formId: string }>()
  const [data, setData] = useState<Data | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    ;(async () => {
      const res = await getJSON(`/api/public/forms/${formId}`)
      if (cancelled) return
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) {
        toast.error("Couldn't load this form.")
        return
      }
      setData((await res.json()) as Data)
    })()
    return () => {
      cancelled = true
    }
  }, [formId])

  if (notFound) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f4f1] text-brand-ink">
        <Body className="text-brand-ink/60">This form isn't available.</Body>
      </main>
    )
  }

  if (!data) {
    return <main className="min-h-dvh bg-[#f6f4f1]" />
  }

  return <RespondFormInner key={data.form.id} form={data.form} questions={data.questions} />
}

function RespondFormInner({
  form,
  questions,
}: {
  form: { id: string; title: string }
  questions: Question[]
}) {
  const [responseId, setResponseId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await postJSON("/api/responses", { form_id: form.id })
      if (cancelled) return
      if (!res.ok) {
        toast.error("Couldn't start this form. Please refresh.")
        return
      }
      const data = (await res.json()) as { response_id: string }
      setResponseId(data.response_id)
    })()
    return () => {
      cancelled = true
    }
  }, [form.id])

  const toastBackendError = async (res: Response, fallback: string) => {
    try {
      const data = (await res.json()) as { errors?: Record<string, string> }
      const first = Object.values(data.errors ?? {})[0]
      toast.error(first ?? fallback)
    } catch {
      toast.error(fallback)
    }
  }

  const persistAnswer = async (
    questionId: string,
    value: AnswerValue,
  ): Promise<boolean> => {
    if (!responseId) return false
    if (value === null || value === undefined) return true
    const res = await putJSON(
      `/api/responses/${responseId}/answers/${questionId}`,
      { value },
    )
    if (!res.ok) {
      await toastBackendError(res, "Couldn't save that answer. Try again.")
      return false
    }
    return true
  }

  const submitResponse = async (path: string[]): Promise<boolean> => {
    if (!responseId) return false
    const url = `/api/responses/${responseId}/submit`
    const backoffsMs = [0, 600, 1800, 3600]
    for (let attempt = 0; attempt < backoffsMs.length; attempt++) {
      if (backoffsMs[attempt] > 0) {
        await new Promise((r) => setTimeout(r, backoffsMs[attempt]))
      }
      try {
        const res = await postJSON(url, { path })
        if (res.ok) return true
        if (res.status >= 400 && res.status < 500) {
          await toastBackendError(res, "Couldn't submit. Try again.")
          return false
        }
      } catch {
        // network error, fall through to retry
      }
    }
    toast.error("Couldn't submit. Check your connection and try again.")
    return false
  }

  return (
    <RespondContext.Provider value={{ responseId }}>
      <FormFlow
        questions={questions}
        onAdvance={persistAnswer}
        onComplete={submitResponse}
        disabled={!responseId}
        header={<RespondHeader />}
        completion={
          <div className="mx-auto w-full max-w-2xl space-y-3 text-center">
            <H1 className="text-[clamp(1.75rem,4vw,36px)] leading-[1.2]">
              Thanks for your response.
            </H1>
            <Body className="text-brand-ink/60">
              Your answers have been recorded.
            </Body>
          </div>
        }
      />
    </RespondContext.Provider>
  )
}

function RespondHeader() {
  return (
    <header className="flex items-center px-4 py-5 sm:px-10">
      <Link to="/" aria-label="Greenforms home">
        <BrandLogo variant="black" className="h-6" />
      </Link>
    </header>
  )
}
