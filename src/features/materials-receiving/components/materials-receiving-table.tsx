"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  MoreVertical,
  Pencil,
  QrCode,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ListMaterialsReceivingParams,
  MaterialsReceiving,
  MaterialsReceivingStatus,
} from "../api/materials-receiving-api";

type SortBy = NonNullable<ListMaterialsReceivingParams["sortBy"]>;
type SortOrder = NonNullable<ListMaterialsReceivingParams["sortOrder"]>;

export interface MaterialsReceivingTableProps {
  receivings: MaterialsReceiving[];
  page: number;
  pageSize: number;
  totalItems: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (receiving: MaterialsReceiving) => void;
  onDelete?: (receiving: MaterialsReceiving) => void;
  onView?: (receiving: MaterialsReceiving) => void;
  onConfirm?: (receiving: MaterialsReceiving) => void;
  onCancel?: (receiving: MaterialsReceiving) => void;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function SortableHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSortChange,
}: {
  label: string;
  field: SortBy;
  currentSortBy?: SortBy;
  currentSortOrder?: SortOrder;
  onSortChange: (field: SortBy, order: SortOrder) => void;
}) {
  const isActive = currentSortBy === field;
  const nextOrder: SortOrder =
    isActive && currentSortOrder === "asc" ? "desc" : "asc";
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => onSortChange(field, nextOrder)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ChevronsUpDown
          className={
            isActive
              ? "h-4 w-4"
              : "h-4 w-4 text-muted-foreground/40"
          }
        />
      </div>
    </TableHead>
  );
}

function StatusBadge({ status }: { status: MaterialsReceivingStatus }) {
  const config = {
    draft: { label: "ฉบับร่าง", variant: "secondary" as const },
    confirmed: { label: "ยืนยันแล้ว", variant: "default" as const },
    cancelled: { label: "ยกเลิก", variant: "destructive" as const },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function MaterialsReceivingTable({
  receivings,
  page,
  pageSize,
  totalItems,
  sortBy,
  sortOrder,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onConfirm,
  onCancel,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: MaterialsReceivingTableProps) {
  if (isError) {
    return (
      <EmptyState
        title="โหลดข้อมูลไม่สำเร็จ"
        description="กรุณาลองใหม่อีกครั้ง"
        action={
          onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              ลองใหม่
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <SortableHeader
              label="Internal Lot No."
              field="internalLotNo"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="วันที่รับ"
              field="receiveDate"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead>ผู้จัดจำหน่าย</TableHead>
            <TableHead>วัสดุ</TableHead>
            <TableHead className="text-right">จำนวนรับ</TableHead>
            <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
            <SortableHeader
              label="Supplier Lot"
              field="supplierLotNo"
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">การจัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : receivings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <EmptyState
                  icon={<QrCode className="h-12 w-12" />}
                  title="ยังไม่มีรายการรับเข้า"
                  description="เริ่มรับเข้าวัตถุดิบใบแรกของคุณ"
                  action={
                    onCreate ? (
                      <Button size="sm" onClick={onCreate}>
                        สร้างรายการรับเข้า
                      </Button>
                    ) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            receivings.map((receiving) => (
              <TableRow key={receiving.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  {receiving.internalLotNo}
                </TableCell>
                <TableCell>{formatDate(receiving.receiveDate)}</TableCell>
                <TableCell>
                  {receiving.supplier?.nameTh ?? "—"}
                </TableCell>
                <TableCell>
                  {receiving.material
                    ? `${receiving.material.code} — ${receiving.material.name}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(receiving.receiveQuantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {receiving.packageCount} ใบ
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {receiving.supplierLotNo ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={receiving.status} />
                </TableCell>
                <TableCell className="text-right">
                  {/* Desktop (md+): inline icon buttons */}
                  <div className="hidden md:flex items-center justify-end gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onView(receiving)}
                        title="ดูรายละเอียด"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && receiving.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(receiving)}
                        title="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onConfirm && receiving.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() => onConfirm(receiving)}
                        title="ยืนยันรับเข้า"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {onCancel && receiving.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-warning hover:text-warning"
                        onClick={() => onCancel(receiving)}
                        title="ยกเลิก"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && receiving.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger hover:text-danger"
                        onClick={() => onDelete(receiving)}
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Mobile (<md): compact dropdown */}
                  <div className="flex justify-end md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="เปิดเมนูการจัดการ"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(receiving)}>
                            <Eye className="h-4 w-4 mr-2" /> ดูรายละเอียด
                          </DropdownMenuItem>
                        )}
                        {onEdit && receiving.status === "draft" && (
                          <DropdownMenuItem onClick={() => onEdit(receiving)}>
                            <Pencil className="h-4 w-4 mr-2" /> แก้ไข
                          </DropdownMenuItem>
                        )}
                        {onConfirm && receiving.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => onConfirm(receiving)}
                            className="text-success focus:text-success"
                          >
                            <Check className="h-4 w-4 mr-2" /> ยืนยันรับเข้า
                          </DropdownMenuItem>
                        )}
                        {onCancel && receiving.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => onCancel(receiving)}
                            className="text-warning focus:text-warning"
                          >
                            <XCircle className="h-4 w-4 mr-2" /> ยกเลิก
                          </DropdownMenuItem>
                        )}
                        {(onDelete && receiving.status === "draft") &&
                          (onEdit || onConfirm || onCancel) && (
                            <DropdownMenuSeparator />
                          )}
                        {onDelete && receiving.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => onDelete(receiving)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> ลบ
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && receivings.length > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border bg-background px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>รายการต่อหน้า</span>
            <span className="hidden sm:inline">·</span>
            <span>
              {totalItems} รายการ
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-sm text-muted-foreground">
              หน้า {page} / {Math.max(1, Math.ceil(totalItems / pageSize))}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= Math.ceil(totalItems / pageSize)}
                aria-label="หน้าถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
