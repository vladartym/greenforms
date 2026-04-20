import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Copy, ExternalLink } from "lucide-react"

import {
  BrandCard,
  BrandInput,
  BrandLabel,
  Body,
  H1,
  PillButton,
} from "@/components/brand"
import { getJSON } from "@/lib/api"

type FormDetail = {
  id: string
  title: string
  status: "draft" | "published"
}

export default function FormsShare() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormDetail | null>(null)

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
      setForm((await res.json()) as FormDetail)
    })()
    return () => {
      cancelled = true
    }
  }, [formId, navigate])

  if (!form) {
    return null
  }

  const publicUrl = `${window.location.origin}/f/${form.id}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success("Link copied")
    } catch {
      toast.error("Couldn't copy link")
    }
  }

  return (
    <section className="w-full px-6 pb-24 pt-6 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 min-w-0">
          <H1 className="text-[clamp(1.75rem,5vw,32px)] leading-[1.15] truncate">
            {form.title || "Untitled form"}
          </H1>
          <Body className="mt-1 text-sm text-brand-ink/60">
            Share this link with respondents to collect answers.
          </Body>
        </div>

        <BrandCard>
          <BrandLabel htmlFor="share-link">Shareable link</BrandLabel>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <BrandInput
              id="share-link"
              readOnly
              value={publicUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <PillButton type="button" onClick={copyLink}>
                <Copy className="mr-1 size-4" />
                Copy link
              </PillButton>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in new tab"
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-green text-white outline-none transition-colors hover:bg-brand-green/90 focus-visible:ring-2 focus-visible:ring-brand-green/40"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
          {form.status === "draft" ? (
            <Body className="mt-3 text-sm text-brand-ink/60">
              This form is still a draft. Publish it so respondents can open the link.
            </Body>
          ) : null}
        </BrandCard>
      </div>
    </section>
  )
}
