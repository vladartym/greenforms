import { useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { uploadFile } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useRespondContext } from "./context"
import type { FileValue, QuestionTypeDef, RendererProps } from "./types"

type Config = Record<string, never>

const MAX_MB = 10

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Renderer({ question, value, onChange }: RendererProps<FileValue | null, Config>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { responseId } = useRespondContext()

  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB.`)
      return
    }
    if (!responseId) {
      onChange({
        filename: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        mime_type: file.type,
      })
      return
    }
    setUploading(true)
    const res = await uploadFile(file, {
      responseId,
      questionId: question.id,
    })
    setUploading(false)
    if (!res.ok) {
      try {
        const data = (await res.json()) as { errors?: Record<string, string> }
        const first = Object.values(data.errors ?? {})[0]
        toast.error(first ?? "Upload failed.")
      } catch {
        toast.error("Upload failed.")
      }
      return
    }
    const data = (await res.json()) as FileValue
    onChange(data)
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 ring-1 ring-brand-ink/15">
        <FileText className="size-5 shrink-0 text-brand-ink/50" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] text-brand-ink">{value.filename}</div>
          <div className="text-xs text-brand-ink/50">{formatSize(value.size)}</div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove file"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) void handleFile(f)
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-brand-ink/20 bg-white/50 px-6 py-10 text-center transition",
        dragOver && "border-brand-green bg-brand-green/5",
      )}
    >
      <Upload className="size-6 text-brand-ink/40" />
      <div className="text-sm text-brand-ink/70">
        Drag and drop, or{" "}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer font-medium text-brand-green hover:underline"
          disabled={uploading}
        >
          choose a file
        </button>
      </div>
      <div className="text-xs text-brand-ink/50">
        {uploading ? "Uploading…" : `Up to ${MAX_MB} MB`}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export const fileUploadType: QuestionTypeDef<Config, FileValue | null> = {
  key: "file_upload",
  label: "File upload",
  icon: Upload,
  defaultConfig: {},
  emptyValue: null,
  Renderer,
  Editor: null,
}
