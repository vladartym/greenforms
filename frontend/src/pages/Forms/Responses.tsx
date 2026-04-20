import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { ColumnDef, Row } from "@tanstack/react-table"

import { BrandCard, BrandInput, Body, H1, PillButton } from "@/components/brand"
import { DataTable } from "@/components/ui/data-table"
import { getJSON } from "@/lib/api"

type AnswerRow = {
  question_id: string | null
  label: string
  type: string
  position: number
  value: unknown
}

type ResponseRow = {
  id: string
  completed_at_label: string
  answers: AnswerRow[]
}

type Data = {
  form: { id: string; title: string }
  responses: ResponseRow[]
}

type View = "card" | "table"

type AnswerColumn = { key: string; label: string; position: number }

export default function FormsResponses() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Data | null>(null)
  const [view, setView] = useState<View>("card")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    ;(async () => {
      const res = await getJSON(`/api/forms/${formId}/responses`)
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
        toast.error("Couldn't load responses.")
        return
      }
      setData((await res.json()) as Data)
    })()
    return () => {
      cancelled = true
    }
  }, [formId, navigate])

  const answerColumns = useMemo(
    () => (data ? collectAnswerColumns(data.responses) : []),
    [data],
  )

  const selectedResponse = useMemo(
    () =>
      data && selectedId
        ? data.responses.find((r) => r.id === selectedId) ?? null
        : null,
    [data, selectedId],
  )

  const filteredCardResponses = useMemo(() => {
    if (!data) return []
    return filterResponses(data.responses, query)
  }, [data, query])

  if (!data) return null

  const { form, responses } = data
  const isEmpty = responses.length === 0

  const showSearch = !isEmpty && !selectedResponse

  return (
    <section className="w-full px-6 pb-16 pt-6 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <H1 className="truncate text-[clamp(1.75rem,5vw,32px)] leading-[1.15]">
              {form.title || "Untitled form"}
            </H1>
            <Body className="mt-1 text-sm text-brand-ink/60">
              {responses.length}{" "}
              {responses.length === 1 ? "response" : "responses"}
            </Body>
          </div>
          {!isEmpty && !selectedResponse && (
            <ViewToggle value={view} onChange={setView} />
          )}
        </div>

        {showSearch && (
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40" />
            <BrandInput
              type="search"
              placeholder="Search responses"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              aria-label="Search responses"
            />
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="mx-auto w-full max-w-3xl">
          <EmptyState />
        </div>
      ) : view === "card" ? (
        <div className="mx-auto w-full max-w-3xl">
          {selectedResponse ? (
            <ResponseDetail
              response={selectedResponse}
              index={responses.findIndex((r) => r.id === selectedResponse.id)}
              total={responses.length}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <ResponseList
              responses={filteredCardResponses}
              total={responses.length}
              indexOf={(id) => responses.findIndex((r) => r.id === id)}
              onSelect={(id) => setSelectedId(id)}
              query={query}
            />
          )}
        </div>
      ) : (
        <BrandCard className="overflow-hidden p-0">
          <ResponseTable
            responses={responses}
            columns={answerColumns}
            query={query}
          />
        </BrandCard>
      )}
    </section>
  )
}

function ViewToggle({
  value,
  onChange,
}: {
  value: View
  onChange: (v: View) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Responses view"
      className="inline-flex items-center gap-1 rounded-full bg-brand-ink/5 p-1"
    >
      <ToggleButton
        isActive={value === "card"}
        onClick={() => onChange("card")}
        label="Card"
      />
      <ToggleButton
        isActive={value === "table"}
        onClick={() => onChange("table")}
        label="Table"
      />
    </div>
  )
}

function ToggleButton({
  isActive,
  onClick,
  label,
}: {
  isActive: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={
        isActive
          ? "inline-flex h-8 items-center rounded-full bg-white px-3 text-[14px] font-medium text-brand-ink shadow-sm"
          : "inline-flex h-8 items-center rounded-full px-3 text-[14px] font-medium text-brand-ink/60 hover:text-brand-ink"
      }
    >
      {label}
    </button>
  )
}

function ResponseList({
  responses,
  total,
  indexOf,
  onSelect,
  query,
}: {
  responses: ResponseRow[]
  total: number
  indexOf: (id: string) => number
  onSelect: (id: string) => void
  query: string
}) {
  if (responses.length === 0) {
    return (
      <BrandCard className="flex flex-col items-center gap-2 py-14 text-center">
        <Body className="text-brand-ink/60">
          {query ? "No responses match your search." : "No responses yet."}
        </Body>
      </BrandCard>
    )
  }
  return (
    <BrandCard className="divide-y divide-brand-ink/10 overflow-hidden p-0">
      {responses.map((r) => {
        const i = indexOf(r.id)
        const displayNumber = i >= 0 ? total - i : 0
        const firstAnswer = formatAnswer(firstAnswerByPosition(r)?.value)
        const primary = firstAnswer || `Response #${displayNumber}`
        const isFallback = !firstAnswer
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-ink/[0.03] focus-visible:bg-brand-ink/[0.03] focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <div
                className={
                  isFallback
                    ? "truncate text-[15px] font-medium text-brand-ink/50"
                    : "truncate text-[15px] font-medium text-brand-ink"
                }
              >
                {primary}
              </div>
              <div className="mt-0.5 text-xs text-brand-ink/60">
                {r.completed_at_label}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-brand-ink/40" />
          </button>
        )
      })}
    </BrandCard>
  )
}

function ResponseDetail({
  response,
  index,
  total,
  onBack,
}: {
  response: ResponseRow
  index: number
  total: number
  onBack: () => void
}) {
  const ordered = [...response.answers].sort(
    (a, b) => a.position - b.position,
  )

  const displayNumber = index >= 0 ? total - index : null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <PillButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-1 pl-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to responses
        </PillButton>
        <div className="text-right text-xs text-brand-ink/60">
          <div className="text-[15px] font-medium text-brand-ink">
            {displayNumber !== null ? `Response #${displayNumber}` : "Response"}
          </div>
          <div className="mt-0.5">{response.completed_at_label}</div>
        </div>
      </div>

      <BrandCard>
        <div className="space-y-6">
          {ordered.map((item, i) => {
            const file = fileInfo(item.value)
            const text = file ? "" : formatAnswer(item.value)
            return (
              <div key={`${item.position}-${item.label}-${i}`}>
                <div className="text-sm font-medium text-brand-ink/70">
                  {item.label || "Untitled question"}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words text-[15px] text-brand-ink">
                  {file ? (
                    <FileLink {...file} />
                  ) : (
                    text || <span className="text-brand-ink/30">No answer</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </BrandCard>
    </div>
  )
}

function ResponseTable({
  responses,
  columns: answerColumns,
  query,
}: {
  responses: ResponseRow[]
  columns: AnswerColumn[]
  query: string
}) {
  const columns = useMemo<ColumnDef<ResponseRow>[]>(() => {
    const answerColumnDefs: ColumnDef<ResponseRow>[] = answerColumns.map(
      (col) => ({
        id: `a-${col.key}`,
        accessorFn: (row) => {
          const a = row.answers.find((x) => answerKey(x) === col.key)
          return formatAnswer(a?.value)
        },
        header: () => (
          <span className="line-clamp-1" title={col.label}>
            {col.label || "Untitled question"}
          </span>
        ),
        cell: ({ row }) => {
          const a = row.original.answers.find((x) => answerKey(x) === col.key)
          return <AnswerCell value={a?.value} />
        },
        enableSorting: true,
        meta: {
          className: "max-w-[320px] min-w-[200px]",
        },
      }),
    )

    const submitted: ColumnDef<ResponseRow> = {
      id: "submitted",
      accessorFn: (_, index) => index,
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-brand-ink/60">
          {row.original.completed_at_label}
        </span>
      ),
      enableSorting: true,
      enableGlobalFilter: false,
      meta: {
        className: "w-[160px] whitespace-nowrap",
      },
    }

    return [...answerColumnDefs, submitted]
  }, [answerColumns])

  return (
    <DataTable
      columns={columns}
      data={responses}
      globalFilter={query}
      globalFilterFn={tableGlobalFilter}
      emptyMessage={
        query ? "No responses match your search." : "No responses yet."
      }
    />
  )
}

function tableGlobalFilter(
  row: Row<ResponseRow>,
  _columnId: string,
  filterValue: string,
) {
  const q = filterValue.trim().toLowerCase()
  if (!q) return true
  return row.original.answers.some((a) =>
    formatAnswer(a.value).toLowerCase().includes(q),
  )
}

function filterResponses(responses: ResponseRow[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return responses
  return responses.filter((r) =>
    r.answers.some((a) => formatAnswer(a.value).toLowerCase().includes(q)),
  )
}

function answerKey(a: AnswerRow) {
  return `${a.position}::${a.label}`
}

function collectAnswerColumns(responses: ResponseRow[]): AnswerColumn[] {
  const seen = new Map<string, AnswerColumn>()
  for (const r of responses) {
    for (const a of r.answers) {
      const key = answerKey(a)
      if (!seen.has(key)) {
        seen.set(key, { key, label: a.label, position: a.position })
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.position - b.position)
}

function firstAnswerByPosition(response: ResponseRow): AnswerRow | undefined {
  if (response.answers.length === 0) return undefined
  return response.answers.reduce((best, a) =>
    a.position < best.position ? a : best,
  )
}

function AnswerCell({ value }: { value: unknown }) {
  const file = fileInfo(value)
  if (file) return <FileLink {...file} className="line-clamp-2" />
  const text = formatAnswer(value)
  if (!text) return <span className="text-brand-ink/30">-</span>
  return (
    <span className="line-clamp-2 whitespace-pre-wrap break-words">{text}</span>
  )
}

function FileLink({
  url,
  filename,
  className,
}: {
  url: string
  filename: string
  className?: string
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`break-words text-brand-green underline underline-offset-2 hover:opacity-80 ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {filename}
    </a>
  )
}

function fileInfo(value: unknown): { url: string; filename: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const obj = value as Record<string, unknown>
  if (typeof obj.url === "string" && typeof obj.filename === "string") {
    return { url: obj.url, filename: obj.filename }
  }
  return null
}

function formatAnswer(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value))
    return value.map(formatAnswer).filter(Boolean).join(", ")
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.filename === "string") return obj.filename
    return JSON.stringify(value)
  }
  return String(value)
}

function EmptyState() {
  return (
    <BrandCard className="flex flex-col items-center gap-2 py-14 text-center">
      <Body className="text-brand-ink/60">No responses yet.</Body>
      <Body className="text-xs text-brand-ink/50">
        Completed submissions will appear here.
      </Body>
    </BrandCard>
  )
}
