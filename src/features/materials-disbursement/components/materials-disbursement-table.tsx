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
import { ActionMenu } from "@/components/tables/action-menu";
import type { ActionItem } from "@/components/tables/action-menu";
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

const STATUS_VARIANTS: Record<DisbursementStatus, "default" | "success" | "destructive" | "secondary" | "warning"> = {
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

  const actionItems: ActionItem<MaterialsDisbursement>[] = [
    ...(onView
      ? [
          {
            label: "ดูรายละเอียด",
            icon: Eye,
            onClick: (row) => onView(row),
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            label: "แก้ไข",
            icon: Pencil,
            onClick: (row) => onEdit(row),
            disabled: (row) => row.status !== "draft",
          },
        ]
      : []),
    ...(onConfirm
      ? [
          {
            label: "ยืนยันจ่ายออก",
            icon: Scissors,
            onClick: (row) => onConfirm(row),
            disabled: (row) => row.status !== "draft",
            variant: "default" as const,
          },
        ]
      : []),
    ...(onCancel
      ? [
          {
            label: "ยกเลิก",
            icon: XCircle,
            onClick: (row) => onCancel(row),
            disabled: (row) => row.status !== "draft",
            variant: "danger" as const,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "ลบ",
            icon: Trash2,
            onClick: (row) => onDelete(row),
            disabled: (row) => row.status !== "draft",
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  if (isError) {
    return (
      <EmptyState
        title="เกิดข้อผิดพลาด"
        description="ไม่สามารถโหลดข้อมูลได้"
        action={onRetry ? <Button onClick={onRetry}>ลองใหม่</Button> : undefined}
      />
    );
  }

  if (!isLoading && disbursements.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีรายการจ่ายออก"
        description="เริ่มสร้างรายการจ่ายออกวัสดุใหม่"
        action={onCreate ? <Button onClick={onCreate}>+ สร้างใบจ่ายออก</Button> : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="เลขที่ใบจ่าย"
                field="disbursementNo"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead>ประเภท</TableHead>
              <SortableHeader
                label="วันที่จ่ายออก"
                field="disbursementDate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead>สถานะ</TableHead>
              <TableHead>เหตุผล</TableHead>
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
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              : disbursements.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {d.disbursementNo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[d.disbursementType] ?? d.disbursementType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(d.disbursementDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[d.status]}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {d.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ActionMenu items={actionItems} row={d} />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>แสดง</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>รายการ จาก {totalItems.toLocaleString()} รายการ</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              หน้า {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
