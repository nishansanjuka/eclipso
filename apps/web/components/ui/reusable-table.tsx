"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InboxIcon } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  className?: string;
  cell?: (item: T) => React.ReactNode;
}

interface ReusableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onToggleSelectAll?: () => void;
  onToggleSelectOne?: (id: string) => void;
  getRowId?: (item: T) => string;
  expandedRowRender?: (item: T) => React.ReactNode;
  expandedId?: string | null;
  onRowClick?: (item: T) => void;
}

export function ReusableTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found.",
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  getRowId,
  expandedRowRender,
  expandedId,
  onRowClick,
}: ReusableTableProps<T>) {
  const allSelected =
    data.length > 0 &&
    selectedIds &&
    data.every((item) => selectedIds.has(getRowId?.(item) ?? ""));
  const someSelected =
    data.some((item) => selectedIds?.has(getRowId?.(item) ?? "")) &&
    !allSelected;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {selectedIds && onToggleSelectAll && (
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !!someSelected;
                    }}
                    onChange={onToggleSelectAll}
                    className="size-4 cursor-pointer rounded accent-primary border-input bg-background text-foreground focus:ring-offset-0"
                  />
                </TableHead>
              )}
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3",
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // SKELETON LOADING STATE
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow
                  key={`skeleton-${idx}`}
                  className="hover:bg-transparent"
                >
                  {selectedIds && (
                    <TableCell className="pl-4">
                      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  )}
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx} className="py-4">
                      <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // EMPTY STATE
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (selectedIds ? 1 : 0)}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted border border-border">
                      <InboxIcon className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {emptyMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try refining your filter criteria.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // DATA ROWS
              data.map((item, idx) => {
                const id = getRowId?.(item) ?? "";
                const isSelected = selectedIds?.has(id) ?? false;
                const isExpanded = expandedId === id;

                return (
                  <React.Fragment key={id ? `${id}-${idx}` : `row-${idx}`}>
                    <TableRow
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        "group cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-0",
                        isSelected && "bg-muted/30",
                        isExpanded && "border-b-0",
                      )}
                    >
                      {selectedIds && onToggleSelectOne && (
                        <TableCell
                          className="pl-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectOne(id)}
                            className="size-4 cursor-pointer rounded accent-primary border-input bg-background focus:ring-offset-0"
                          />
                        </TableCell>
                      )}
                      {columns.map((col, colIdx) => (
                        <TableCell
                          key={colIdx}
                          className={cn(
                            "text-sm font-medium text-foreground py-3.5",
                            col.className,
                          )}
                        >
                          {col.cell
                            ? col.cell(item)
                            : (item[col.accessorKey as keyof T] as React.ReactNode)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expanding detail view if enabled */}
                    {expandedRowRender && isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length + (selectedIds ? 1 : 0)}
                          className="p-0 border-b border-border"
                        >
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            {expandedRowRender(item)}
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
