"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  skeletonRows = 8,
  onRowClick,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId,
  });

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/60 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const className = (header.column.columnDef.meta as { className?: string })?.className;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 first:pl-5 last:pr-5",
                        className
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="border-b border-border/30">
                  {columns.map((_, ci) => (
                    <TableCell key={ci} className="px-4 py-3.5 first:pl-5 last:pr-5">
                      <Skeleton className="h-4 w-full max-w-[140px] rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "group border-b border-border/30 transition-colors duration-150",
                    index % 2 === 1 && "bg-muted/20",
                    "hover:bg-accent/50",
                    row.getIsSelected() && "bg-accent/70",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const className = (cell.column.columnDef.meta as { className?: string })?.className;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 first:pl-5 last:pr-5 text-sm transition-colors duration-150",
                          className
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-2xl bg-muted/50 p-4 mb-4">
                      <svg className="h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875L9.75 16.125M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-foreground">No results found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter to find what you&apos;re looking for.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────

type BadgeVariant = "active" | "pending" | "completed" | "cancelled" | "draft" | "archived" | "low-stock" | "out-of-stock" | "inactive";

const badgeStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50",
  pending: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50",
  completed: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/50",
  cancelled: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/50",
  draft: "bg-gray-50 text-gray-600 border-gray-200/80 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800/50",
  archived: "bg-slate-50 text-slate-500 border-slate-200/80 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800/50",
  "low-stock": "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50",
  "out-of-stock": "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/50",
  inactive: "bg-gray-50 text-gray-500 border-gray-200/80 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800/50",
};

const dotColors: Record<BadgeVariant, string> = {
  active: "bg-emerald-500",
  pending: "bg-amber-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
  draft: "bg-gray-400",
  archived: "bg-slate-400",
  "low-stock": "bg-amber-500",
  "out-of-stock": "bg-red-500",
  inactive: "bg-gray-400",
};

export function StatusBadge({
  variant,
  label,
  className,
}: {
  variant: BadgeVariant;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-150",
        badgeStyles[variant],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
      {label}
    </span>
  );
}

// ─── Pagination ──────────────────────────────────────────────────

export function DataTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-3">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> results
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border/60 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors",
                    p === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 text-foreground hover:bg-accent"
                  )}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border/60 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
