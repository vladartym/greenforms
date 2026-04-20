import { useEffect, useMemo } from "react"
import { ArrowUpDown, GripVertical, Plus, X } from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { BrandInput } from "@/components/brand"
import { cn } from "@/lib/utils"
import type { EditorProps, QuestionTypeDef, RendererProps } from "./types"

type Config = {
  choices: string[]
}

type Value = string[] | null

function Renderer({ question, value, onChange }: RendererProps<Value, Config>) {
  const choices = useMemo(() => question.config.choices ?? [], [question.config.choices])
  const ordered = Array.isArray(value) && value.length === choices.length ? value : choices

  useEffect(() => {
    if (!Array.isArray(value) || value.length === 0) {
      onChange(choices)
    }
  }, [choices, value, onChange])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = ordered.indexOf(String(active.id))
    const to = ordered.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onChange(arrayMove(ordered, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2.5">
          {ordered.map((choice, i) => (
            <SortableRow key={choice} id={choice} index={i} label={choice} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ id, index, label }: { id: string; index: number; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-pill)] bg-white px-5 py-3 text-[15px] text-brand-ink ring-1 ring-brand-ink/15",
        )}
      >
        <button
          type="button"
          className="inline-flex size-8 cursor-grab touch-none items-center justify-center rounded-full text-brand-ink/40 hover:bg-brand-ink/5 hover:text-brand-ink/70 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-brand-ink/5 text-xs font-medium text-brand-ink/60">
          {index + 1}
        </span>
        <span className="truncate">{label}</span>
      </div>
    </li>
  )
}

function Editor({ config, onChange }: EditorProps<Config>) {
  const choices = config.choices ?? []
  const updateChoice = (i: number, value: string) =>
    onChange({ choices: choices.map((c, idx) => (idx === i ? value : c)) })
  const addChoice = () => onChange({ choices: [...choices, ""] })
  const removeChoice = (i: number) =>
    onChange({ choices: choices.filter((_, idx) => idx !== i) })

  return (
    <div className="flex flex-col gap-2 pl-1">
      {choices.map((choice, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-sm text-brand-ink/40 w-6">{i + 1}.</span>
          <BrandInput
            value={choice}
            onChange={(e) => updateChoice(i, e.target.value)}
            placeholder={`Choice ${i + 1}`}
            aria-label={`Choice ${i + 1}`}
            className="h-9 text-sm"
          />
          {choices.length > 2 && (
            <button
              type="button"
              onClick={() => removeChoice(i)}
              aria-label="Remove choice"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addChoice}
        className="inline-flex w-fit items-center gap-1 pl-8 text-sm text-brand-green hover:underline"
      >
        <Plus className="size-3.5" />
        Add choice
      </button>
    </div>
  )
}

export const rankingType: QuestionTypeDef<Config, Value> = {
  key: "ranking",
  label: "Ranking",
  icon: ArrowUpDown,
  defaultConfig: { choices: ["", ""] },
  emptyValue: null,
  Renderer,
  Editor,
}
