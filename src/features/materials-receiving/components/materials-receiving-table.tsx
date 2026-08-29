"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Pencil,
  QrCode,
  Trash2,
  XCircle,
} from "lucide-react";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const nextOrder: SortOrder = isActive && currentSortOrder === "asc" ? "desc" : "asc";
  return (
    <TableHead
      className="hover:bg-muted/50 cursor-pointer select-none"
      onClick={() => onSortChange(field, nextOrder)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ChevronsUpDown className={isActive ? "h-4 w-4" : "text-muted-foreground/40 h-4 w-4"} />
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

function CardField({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-sm break-all" : "mt-1 break-words"}>{value}</dd>
    </div>
  );
}

function ReceivingActions({
  receiving,
  onView,
  onEdit,
  onConfirm,
  onCancel,
  onDelete,
}: {
  receiving: MaterialsReceiving;
  onView?: (receiving: MaterialsReceiving) => void;
  onEdit?: (receiving: MaterialsReceiving) => void;
  onConfirm?: (receiving: MaterialsReceiving) => void;
  onCancel?: (receiving: MaterialsReceiving) => void;
  onDelete?: (receiving: MaterialsReceiving) => void;
}) {
  const canEdit = onEdit && receiving.status === "draft";
  const canConfirm = onConfirm && receiving.status === "draft";
  const canCancel = onCancel && receiving.status !== "cancelled";
  const canDelete = onDelete && receiving.status === "draft";
  const items: ActionItem<MaterialsReceiving>[] = [
    {
      label: "ดูรายละเอียด",
      icon: <Eye className="h-4 w-4" />,
      hidden: !onView,
      onClick: (row) => onView?.(row),
    },
    {
      label: "แก้ไข",
      icon: <Pencil className="h-4 w-4" />,
      hidden: !canEdit,
      onClick: (row) => onEdit?.(row),
    },
    {
      label: "ยืนยันรับเข้า",
      icon: <Check className="h-4 w-4" />,
      hidden: !canConfirm,
      onClick: (row) => onConfirm?.(row),
    },
    {
      label: "ยกเลิก",
      icon: <XCircle className="h-4 w-4" />,
      variant: "danger",
      hidden: !canCancel,
      onClick: (row) => onCancel?.(row),
    },
    {
      label: "ลบ",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "danger",
      hidden: !canDelete,
      onClick: (row) => onDelete?.(row),
    },
  ];

  return <ActionMenu row={receiving} label={`จัดการรายการรับเข้า ${receiving.internalLotNo}`} items={items} />;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-background rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-24" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
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
    <div className="bg-card rounded-lg border">
      {!isLoading && receivings.length === 0 ? (
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
      ) : (
        <>
          <div data-testid="materials-receiving-cards" className="space-y-3 p-3 md:hidden">
            {isLoading ? (
              <CardSkeleton />
            ) : (
              receivings.map((receiving) => (
                <article
                  key={receiving.id}
                  aria-label={`รายการรับเข้า ${receiving.internalLotNo}`}
                  className="bg-background min-w-0 rounded-lg border p-4 shadow-sm"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold break-all">
                        {receiving.internalLotNo}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(receiving.receiveDate)}
                      </p>
                    </div>
                    <StatusBadge status={receiving.status} />
                  </div>
                  <dl className="mt-4 grid min-w-0 grid-cols-2 gap-3 text-sm">
                    <CardField
                      className="col-span-2"
                      label="วัสดุ"
                      value={
                        receiving.material
                          ? `${receiving.material.code} — ${receiving.material.name}`
                          : "—"
                      }
                    />
                    <CardField
                      className="col-span-2"
                      label="ผู้จัดจำหน่าย"
                      value={receiving.supplier?.nameTh ?? "—"}
                    />
                    <CardField label="จำนวนรับ" value={formatNumber(receiving.receiveQuantity)} />
                    <CardField label="บรรจุภัณฑ์" value={`${receiving.packageCount} ใบ`} />
                    <CardField
                      className="col-span-2"
                      label="Supplier Lot"
                      mono
                      value={receiving.supplierLotNo ?? "—"}
                    />
                  </dl>
                  <div className="mt-3 flex justify-end border-t pt-2">
                    <ReceivingActions
                      receiving={receiving}
                      onView={onView}
                      onEdit={onEdit}
                      onConfirm={onConfirm}
                      onCancel={onCancel}
                      onDelete={onDelete}
                    />
                  </div>
                </article>
              ))
            )}
          </div>

          <div data-testid="materials-receiving-table" className="hidden overflow-x-auto md:block">
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
                  <TableHead className="w-14 text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  receivings.map((receiving) => (
                    <TableRow key={receiving.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {receiving.internalLotNo}
                      </TableCell>
                      <TableCell>{formatDate(receiving.receiveDate)}</TableCell>
                      <TableCell>{receiving.supplier?.nameTh ?? "—"}</TableCell>
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
                      <TableCell className="w-14 text-right">
                        <ReceivingActions
                          receiving={receiving}
                          onView={onView}
                          onEdit={onEdit}
                          onConfirm={onConfirm}
                          onCancel={onCancel}
                          onDelete={onDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!isLoading && receivings.length > 0 && (
        <div
          data-testid="materials-receiving-pagination"
          className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-background rounded-md border px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>รายการต่อหน้า</span>
            <span className="hidden sm:inline">·</span>
            <span>{totalItems} รายการ</span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-muted-foreground text-sm">
              หน้า {page} / {Math.max(1, Math.ceil(totalItems / pageSize))}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
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
