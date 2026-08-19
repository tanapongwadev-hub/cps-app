"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Pencil,
  Scissors,
  Trash2,
  XCircle,
} from "lucide-react";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DisbursementStatus,
  DisbursementType,
  ListMaterialsDisbursementParams,
  MaterialsDisbursement,
} from "../api/materials-disbursement-api";

type SortBy = NonNullable<ListMaterialsDisbursementParams["sortBy"]>;
type SortOrder = NonNullable<ListMaterialsDisbursementParams["sortOrder"]>;

export interface MaterialsDisbursementTableProps {
  disbursements: MaterialsDisbursement[];
  page: number;
  pageSize: number;
  totalItems: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (disbursement: MaterialsDisbursement) => void;
  onDelete?: (disbursement: MaterialsDisbursement) => void;
  onView?: (disbursement: MaterialsDisbursement) => void;
  onConfirm?: (disbursement: MaterialsDisbursement) => void;
  onCancel?: (disbursement: MaterialsDisbursement) => void;
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
      className="hover:bg-muted/50 cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSortChange(field, nextOrder)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ChevronsUpDown className={isActive ? "h-4 w-4" : "text-muted-foreground/40 h-4 w-4"} />
      </div>
    </TableHead>
  );
}

const STATUS_VARIANTS: Record<DisbursementStatus, "secondary" | "success" | "destructive" | "outline"> = {
  draft: "secondary",
  confirmed: "success",
  cancelled: "destructive",
};

const STATUS_LABELS: Record<DisbursementStatus, string> = {
  draft: "ฉบับร่าง",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
};

const TYPE_LABELS: Record<DisbursementType, string> = {
  stock_cut: "ตัดสต็อก",
  production: "เบิกเพื่อผลิต",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function CardField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function DisbursementActions({
  disbursement,
  onView,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
}: {
  disbursement: MaterialsDisbursement;
  onView?: (d: MaterialsDisbursement) => void;
  onEdit?: (d: MaterialsDisbursement) => void;
  onDelete?: (d: MaterialsDisbursement) => void;
  onConfirm?: (d: MaterialsDisbursement) => void;
  onCancel?: (d: MaterialsDisbursement) => void;
}) {
  const items: ActionItem[] = [
    {
      label: "ดูรายละเอียด",
      icon: Eye,
      onClick: () => onView?.(disbursement),
    },
    {
      label: "แก้ไข",
      icon: Pencil,
      onClick: () => onEdit?.(disbursement),
      disabled: disbursement.status !== "draft",
    },
    {
      label: "ยืนยันจ่ายออก",
      icon: Scissors,
      onClick: () => onConfirm?.(disbursement),
      disabled: disbursement.status !== "draft",
      variant: "default" as const,
    },
    {
      label: "ยกเลิก",
      icon: XCircle,
      onClick: () => onCancel?.(disbursement),
      disabled: disbursement.status !== "draft",
      variant: "danger" as const,
    },
    {
      label: "ลบ",
      icon: Trash2,
      onClick: () => onDelete?.(disbursement),
      disabled: disbursement.status !== "draft",
      variant: "danger" as const,
    },
  ];

  return <ActionMenu label={`จัดการ ${disbursement.disbursementNo}`} items={items} />;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </>
  );
}

export function MaterialsDisbursementTable({
  disbursements,
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
}: MaterialsDisbursementTableProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (isError) {
    return (
      <EmptyState
        title="เกิดข้อผิดพลาด"
        description="ไม่สามารถโหลดข้อมูลได้"
        action={onRetry ? <Button onClick={onRetry}>ลองใหม่</Button> : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile: Card view */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <CardSkeleton />
        ) : disbursements.length === 0 ? (
          <EmptyState
            title="ยังไม่มีรายการจ่ายออก"
            description="เริ่มสร้างรายการจ่ายออกวัสดุใหม่"
            action={onCreate ? <Button size="sm" onClick={onCreate}>+ สร้างใบจ่ายออก</Button> : undefined}
          />
        ) : (
          disbursements.map((d) => (
            <article
              key={d.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold break-all">{d.disbursementNo}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(d.disbursementDate)}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[d.status]}>
                  {STATUS_LABELS[d.status] ?? d.status}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <CardField label="ประเภท" value={TYPE_LABELS[d.disbursementType] ?? d.disbursementType} />
                <CardField label="สร้างเมื่อ" value={formatDate(d.createdAt)} />
                <CardField className="col-span-2" label="เหตุผล" value={d.reason ?? "—"} />
              </dl>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[d.disbursementType] ?? d.disbursementType}
                </Badge>
                <DisbursementActions
                  disbursement={d}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
              </div>
            </article>
          ))
        )}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="เลขที่ใบจ่าย"
                field="disbursementNo"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead className="whitespace-nowrap">ประเภท</TableHead>
              <SortableHeader
                label="วันที่จ่ายออก"
                field="disbursementDate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead className="whitespace-nowrap">สถานะ</TableHead>
              <TableHead className="whitespace-nowrap">เหตุผล</TableHead>
              <SortableHeader
                label="สร้างเมื่อ"
                field="createdAt"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : disbursements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  ไม่พบรายการ
                </TableCell>
              </TableRow>
            ) : (
              disbursements.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
                    {d.disbursementNo}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline">{TYPE_LABELS[d.disbursementType] ?? d.disbursementType}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(d.disbursementDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={STATUS_VARIANTS[d.status]}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {d.reason ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(d.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DisbursementActions
                      disbursement={d}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onConfirm={onConfirm}
                      onCancel={onCancel}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card">
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
            <span>{totalItems.toLocaleString()} รายการ</span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-muted-foreground text-sm">
              หน้า {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                aria-label="หน้าแรก"
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
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
                disabled={page >= totalPages}
                aria-label="หน้าถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                aria-label="หน้าสุดท้าย"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
