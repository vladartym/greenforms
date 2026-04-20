import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ColumnMeta = {
  className?: string
  headClassName?: string
}

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  globalFilter?: string
  globalFilterFn?: TableOptions<TData>["globalFilterFn"]
  initialSorting?: SortingState
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  globalFilterFn,
  initialSorting,
  emptyMessage = "No matching rows.",
}: Props<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: globalFilter ?? "" },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn ?? "auto",
  })

  const rows = table.getRowModel().rows

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => {
              const meta = h.column.columnDef.meta as ColumnMeta | undefined
              const canSort = h.column.getCanSort()
              const sorted = h.column.getIsSorted()
              return (
                <TableHead
                  key={h.id}
                  className={cn(meta?.headClassName ?? meta?.className)}
                >
                  {h.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      onClick={h.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 text-left text-xs font-medium text-brand-ink/60 transition-colors hover:text-brand-ink"
                    >
                      <span className="line-clamp-1">
                        {flexRender(
                          h.column.columnDef.header,
                          h.getContext(),
                        )}
                      </span>
                      <SortIcon sorted={sorted} />
                    </button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="py-10 text-center text-sm text-brand-ink/50"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | ColumnMeta
                  | undefined
                return (
                  <TableCell key={cell.id} className={meta?.className}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" />
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" />
  return <ChevronsUpDown className="h-3 w-3 opacity-50" />
}

export type { Row }
