import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Copy, ExternalLink, MoreHorizontal, Send } from "lucide-react"
import { toast } from "sonner"

import {
  BrandCard,
  BrandInput,
  Body,
  H1,
  PillButton,
  StatusBadge,
  type BadgeStatus,
} from "@/components/brand"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useHeaderAction } from "@/components/header-action"
import { deleteJSON, getJSON, patchJSON, postJSON } from "@/lib/api"

type FormRow = {
  id: string
  title: string
  status: BadgeStatus
  responses_completed: number
  responses_draft: number
  updated_at_label: string
}

export default function FormsIndex() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[] | null>(null)

  const refetch = useCallback(async () => {
    const res = await getJSON("/api/forms")
    if (res.status === 401 || res.status === 403) {
      navigate("/login", { replace: true })
      return
    }
    if (!res.ok) {
      toast.error("Couldn't load forms.")
      return
    }
    setForms((await res.json()) as FormRow[])
  }, [navigate])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useHeaderAction(
    () => (
      <PillButton
        type="button"
        size="sm"
        variant="ghost"
        onClick={async () => {
          await postJSON("/api/auth/logout", {})
          window.location.assign("/")
        }}
        className="text-brand-ink/70 hover:bg-brand-ink/5 hover:text-brand-ink"
      >
        Log out
      </PillButton>
    ),
    [],
  )

  if (forms === null) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-16 sm:px-10">
      <div className="flex items-center justify-between gap-4 py-6">
        <H1 className="text-[clamp(1.75rem,5vw,32px)] leading-[1.15]">
          Your forms
        </H1>
        <PillButton asChild>
          <Link to="/form/new">+ New form</Link>
        </PillButton>
      </div>

      {forms.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {forms.map((form) => (
            <li key={form.id}>
              <FormCard form={form} onChanged={refetch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FormCard({ form, onChanged }: { form: FormRow; onChanged: () => void }) {
  const { id, title, status, responses_completed, responses_draft, updated_at_label } = form
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleDuplicate() {
    if (busy) return
    setBusy(true)
    try {
      const res = await postJSON(`/api/forms/${id}/duplicate`)
      if (!res.ok) {
        toast.error("Could not duplicate form")
        return
      }
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <BrandCard className="relative p-5 transition-colors hover:bg-white/70 sm:p-6">
        <Link
          to={`/form/${id}`}
          aria-label={`Edit ${title || "form"}`}
          className="absolute inset-0 z-0 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-brand-green/40 outline-none"
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-medium sm:text-lg">
                {title || "Untitled form"}
              </h2>
              <StatusBadge status={status} />
            </div>
            <Body className="mt-1 text-sm text-brand-ink/60">
              {responses_completed} {responses_completed === 1 ? "response" : "responses"}
              {" · "}
              {responses_draft} {responses_draft === 1 ? "draft" : "drafts"}
            </Body>
            <Body className="mt-0.5 text-xs text-brand-ink/50">
              Updated {updated_at_label}
            </Body>
          </div>
          <div className="flex items-center gap-1 pointer-events-auto">
            {status === "published" && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-brand-ink hover:bg-brand-ink/5"
              >
                <Send className="size-3.5" />
                Share
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand-ink hover:bg-brand-ink/5 focus-visible:ring-2 focus-visible:ring-brand-green/40 outline-none"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link to={`/form/${id}`} className="cursor-pointer">
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/form/${id}/responses`} className="cursor-pointer">
                    Responses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={busy}
                  onSelect={(e) => {
                    e.preventDefault()
                    handleDuplicate()
                  }}
                >
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </BrandCard>

      <RenameModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        id={id}
        currentTitle={title}
        onChanged={onChanged}
      />
      <DeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        id={id}
        title={title}
        onChanged={onChanged}
      />
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        id={id}
      />
    </>
  )
}

function RenameModal({
  open,
  onOpenChange,
  id,
  currentTitle,
  onChanged,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  id: string
  currentTitle: string
  onChanged: () => void
}) {
  const [value, setValue] = useState(currentTitle)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValue(currentTitle)
  }, [open, currentTitle])

  const trimmed = value.trim()
  const canSave = !!trimmed && trimmed !== currentTitle.trim() && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await patchJSON(`/api/forms/${id}/rename`, { title: trimmed })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          errors?: Record<string, string>
        }
        toast.error(Object.values(data.errors ?? {})[0] ?? "Could not rename form")
        return
      }
      onOpenChange(false)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <DialogTitle>Rename form</DialogTitle>
          <BrandInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Form title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) handleSave()
            }}
            className="h-12 text-base"
          />
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <PillButton variant="outline">Cancel</PillButton>
            </DialogClose>
            <PillButton onClick={handleSave} disabled={!canSave}>
              {saving ? "Saving…" : "Save"}
            </PillButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteModal({
  open,
  onOpenChange,
  id,
  title,
  onChanged,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  id: string
  title: string
  onChanged: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await deleteJSON(`/api/forms/${id}`)
      if (!res.ok) {
        toast.error("Could not delete form")
        return
      }
      onOpenChange(false)
      onChanged()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>Delete this form?</DialogTitle>
            <DialogDescription>
              {title ? (
                <>
                  <span className="font-medium text-brand-ink">“{title}”</span>{" "}
                  and all of its responses will be permanently deleted.
                </>
              ) : (
                "This form and all of its responses will be permanently deleted."
              )}
            </DialogDescription>
          </div>
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <PillButton variant="outline">Cancel</PillButton>
            </DialogClose>
            <PillButton
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 text-white hover:bg-rose-600/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </PillButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShareModal({
  open,
  onOpenChange,
  id,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  id: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${id}`
      : `/f/${id}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copied")
    } catch {
      inputRef.current?.select()
      toast.error("Copy failed — link selected")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>Share this form</DialogTitle>
            <DialogDescription>
              Anyone with this link can respond.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <BrandInput
              ref={inputRef}
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 text-sm"
            />
            <PillButton onClick={copy} className="h-11">
              <Copy className="mr-1 size-4" />
              Copy
            </PillButton>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-green text-white transition-colors hover:bg-brand-green/90 focus-visible:ring-2 focus-visible:ring-brand-green/40 outline-none"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState() {
  return (
    <BrandCard className="flex flex-col items-center gap-4 py-14 text-center">
      <Body className="text-brand-ink/60">
        No forms yet. Create your first form.
      </Body>
      <PillButton asChild>
        <Link to="/form/new">+ New form</Link>
      </PillButton>
    </BrandCard>
  )
}
