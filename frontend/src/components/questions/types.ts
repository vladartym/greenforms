import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "email"
  | "dropdown"
  | "number"
  | "phone_number"
  | "file_upload"
  | "date"
  | "time"
  | "linear_scale"
  | "rating"
  | "ranking"

export type FileValue = {
  filename: string
  size: number
  url: string
  mime_type: string
}

export type AnswerValue =
  | string
  | number
  | string[]
  | FileValue
  | null

export type JsonObject = Record<string, unknown>

export type Question<C extends JsonObject = JsonObject> = {
  id: string
  type: QuestionType
  label: string
  required: boolean
  position: number
  config: C
}

export type RendererProps<V extends AnswerValue = AnswerValue, C extends JsonObject = JsonObject> = {
  question: Question<C>
  value: V
  onChange: (value: V) => void
  onAdvance: () => void
}

export type EditorProps<C extends JsonObject = JsonObject> = {
  config: C
  onChange: (patch: Partial<C>) => void
}

export type QuestionTypeDef<C extends JsonObject = JsonObject, V extends AnswerValue = AnswerValue> = {
  key: QuestionType
  label: string
  icon: LucideIcon
  defaultConfig: C
  emptyValue: V
  Renderer: ComponentType<RendererProps<V, C>>
  Editor: ComponentType<EditorProps<C>> | null
}
