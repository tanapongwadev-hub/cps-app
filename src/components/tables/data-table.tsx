"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { PAGE_SIZE_OPTIONS } from "@/constants/app";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  totalItems?: number;

  // Search
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  globalSearch?: boolean;

  // Selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;

  // Column visibility
  enableColumnVisibility?: boolean;
  defaultHiddenColumns?: string[];

  // Toolbar
  toolbar?: React.ReactNode;

  // Empty state
  emptyState?: {
    title: string;
    description?: string;
    action?: React.ReactNode;
  };

  // Pagination
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;

  // Sorting
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Styling
  className?: string;
  size?: "sm" | "default";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  totalItems,
  searchPlaceholder = "ค้นหา...",
  searchValue,
  onSearchChange,
  globalSearch = true,
  enableRowSelection = false,
  onRowSelectionChange,
  bulkActions,
  enableColumnVisibility = true,
  defaultHiddenColumns = [],
  toolbar,
  emptyState,
  manualPagination = false,
  pageCount,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  onPaginationChange,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  className,
  size = "default",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(controlledSorting ?? []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() =>
    defaultHiddenColumns.reduce<VisibilityState>((acc, id) => ({ ...acc, [id]: false }), {}),
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: controlledPageIndex ?? 0,
    pageSize: controlledPageSize ?? 10,
  });

  // Sync external page index/size
  React.useEffect(() => {
    if (controlledPageIndex !== undefined || controlledPageSize !== undefined) {
      setPagination((p) => ({
        pageIndex: controlledPageIndex ?? p.pageIndex,
        pageSize: controlledPageSize ?? p.pageSize,
      }));
    }
  }, [controlledPageIndex, controlledPageSize]);

  // Add selection column
  const finalColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "_select",
      size: 40,
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="เลือกทั้งหมด"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="เลือกแถว"
        />
      ),
    };
    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting: manualSorting ? (controlledSorting ?? []) : sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination: manualPagination
        ? {
            pageIndex: controlledPageIndex ?? 0,
            pageSize: controlledPageSize ?? 10,
          }
        : pagination,
    },
    pageCount: manualPagination ? pageCount : undefined,
    enableRowSelection,
    manualPagination,
    manualSorting,
    onSortingChange: (updater) => {
      if (manualSorting) {
        const next = typeof updater === "function" ? updater(controlledSorting ?? []) : updater;
        onSortingChange?.(next);
      } else {
        setSorting(updater);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (manualPagination) {
        const next = typeof updater === "function" ? updater(pagination) : updater;
        onPaginationChange?.(next);
      } else {
        setPagination(updater);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return;
    const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
    onRowSelectionChange(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const selectedCount = Object.keys(rowSelection).length;
  const isSm = size === "sm";
  const effectivePageSize = manualPagination ? (controlledPageSize ?? 10) : pagination.pageSize;
  const effectivePageIndex = manualPagination ? (controlledPageIndex ?? 0) : pagination.pageIndex;
  const totalRows = manualPagination ? (totalItems ?? data.length) : data.length;
  const totalPageCount = manualPagination
    ? (pageCount ?? 1)
    : Math.max(1, Math.ceil(totalRows / effectivePageSize));

  const startRow = totalRows === 0 ? 0 : effectivePageIndex * effectivePageSize + 1;
  const endRow = Math.min(totalRows, (effectivePageIndex + 1) * effectivePageSize);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {globalSearch && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={searchValue ?? globalFilter}
                onChange={(e) => {
                  if (onSearchChange) onSearchChange(e.target.value);
                  else setGlobalFilter(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="h-9 pr-8 pl-8"
                aria-label={searchPlaceholder}
              />
              {(searchValue || globalFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSearchChange) onSearchChange("");
                    else setGlobalFilter("");
                  }}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label="ล้างการค้นหา"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {toolbar}
        </div>

        <div className="flex items-center gap-2">
          {enableRowSelection && selectedCount > 0 && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
              <span className="font-medium">เลือก {selectedCount} รายการ</span>
              {bulkActions?.(table.getFilteredSelectedRowModel().rows.map((r) => r.original))}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => table.resetRowSelection()}
                aria-label="ล้างการเลือก"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">คอลัมน์</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((c) => c.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                      className="capitalize"
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10 [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isActionColumn = header.column.id === "actions";
                    return (
                      <th
                        key={header.id}
                        style={{ width: isActionColumn ? 56 : header.getSize() }}
                        className={cn(
                          "text-muted-foreground px-3 text-left align-middle text-xs font-medium tracking-wide uppercase",
                          isSm ? "h-8" : "h-10",
                          isActionColumn && "text-right",
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              canSort && "cursor-pointer select-none",
                              isActionColumn && "justify-end",
                            )}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="text-muted-foreground/60">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array.from({ length: effectivePageSize }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="border-b">
                    {finalColumns.map((_, cidx) => (
                      <td key={`sk-${idx}-${cidx}`} className={cn("p-3", isSm && "p-2")}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={finalColumns.length} className="p-0">
                    <ErrorState
                      title="ไม่สามารถโหลดข้อมูลได้"
                      description="กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง"
                      onRetry={onRetry}
                    />
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={finalColumns.length} className="p-0">
                    <EmptyState
                      title={emptyState?.title ?? "ไม่พบข้อมูล"}
                      description={
                        emptyState?.description ?? "ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มข้อมูลใหม่"
                      }
                      action={emptyState?.action}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/40 border-b transition-colors",
                      row.getIsSelected() && "bg-muted/60",
                    )}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActionColumn = cell.column.id === "actions";
                      return (
                        <td
                          key={cell.id}
                          style={{ width: isActionColumn ? 56 : cell.column.getSize() }}
                          className={cn(
                            "p-3 align-middle",
                            isSm && "p-2",
                            isActionColumn && "text-right",
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>
              แสดง <span className="text-foreground font-medium">{startRow}</span>-
              <span className="text-foreground font-medium">{endRow}</span> จาก{" "}
              <span className="text-foreground font-medium">{totalRows}</span> รายการ
            </span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">จำนวนต่อหน้า</span>
              <Select
                value={String(effectivePageSize)}
                onValueChange={(v) => {
                  const nextSize = Number(v);
                  if (manualPagination) {
                    onPaginationChange?.({ pageIndex: 0, pageSize: nextSize });
                  } else {
                    setPagination((p) => ({ ...p, pageSize: nextSize, pageIndex: 0 }));
                  }
                }}
              >
                <SelectTrigger size="sm" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (manualPagination)
                  onPaginationChange?.({ pageIndex: 0, pageSize: effectivePageSize });
                else setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              disabled={effectivePageIndex === 0 || isLoading}
              aria-label="หน้าแรก"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (manualPagination)
                  onPaginationChange?.({
                    pageIndex: effectivePageIndex - 1,
                    pageSize: effectivePageSize,
                  });
                else setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }));
              }}
              disabled={effectivePageIndex === 0 || isLoading}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-sm">
              หน้า {effectivePageIndex + 1} / {totalPageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (manualPagination)
                  onPaginationChange?.({
                    pageIndex: effectivePageIndex + 1,
                    pageSize: effectivePageSize,
                  });
                else setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }));
              }}
              disabled={effectivePageIndex >= totalPageCount - 1 || isLoading}
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                if (manualPagination)
                  onPaginationChange?.({
                    pageIndex: totalPageCount - 1,
                    pageSize: effectivePageSize,
                  });
                else setPagination((p) => ({ ...p, pageIndex: totalPageCount - 1 }));
              }}
              disabled={effectivePageIndex >= totalPageCount - 1 || isLoading}
              aria-label="หน้าสุดท้าย"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable loading spinner wrapper */
export function TableLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn("text-muted-foreground flex items-center justify-center gap-2 py-8", className)}
    >
      <Spinner size="lg" />
      <span>กำลังโหลด...</span>
    </div>
  );
}
