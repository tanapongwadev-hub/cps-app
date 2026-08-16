"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  FileCheck,
  FileX,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionMenu } from "@/components/tables/action-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  GoodsReceipt,
  ListGoodsReceiptsParams,
} from "../api/goods-receipts-api";

type SortBy = NonNullable<ListGoodsReceiptsParams["sortBy"]>;
type SortOrder = NonNullable<ListGoodsReceiptsParams["sortOrder"]>;

export interface GoodsReceiptTableProps {
  receipts: GoodsReceipt[];
  page: number;
  pageSize: number;
  totalItems: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (receipt: GoodsReceipt) => void;
  onDelete?: (receipt: GoodsReceipt) => void;
  onPost?: (receipt: GoodsReceipt) => void;
  onCancel?: (receipt: GoodsReceipt) => void;
  onView?: (receipt: GoodsReceipt) => void;
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
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => onSortChange(field, nextOrder)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSortOrder === "asc" ? (
            <ChevronsUpDown className="h-4 w-4" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
    </TableHead>
  );
}

function StatusBadge({ status }: { status: GoodsReceipt["status"] }) {
  const config = {
    draft: { label: "ฉบับร่าง", variant: "secondary" as const },
    posted: { label: "รับแล้ว", variant: "default" as const },
    cancelled: { label: "ยกเลิก", variant: "destructive" as const },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(value: string): string {
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

function formatNumber(value: string): string {
  try {
    return parseFloat(value).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return value;
  }
}

export function GoodsReceiptTable({
  receipts,
  page,
  pageSize,
  totalItems,
  sortBy = "receiptDate",
  sortOrder = "desc",
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
  onPost,
  onCancel,
  onView,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: GoodsReceiptTableProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (isError) {
    return (
      <EmptyState
        title="เกิดข้อผิดพลาด"
        description="ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่"
        action={
          onRetry ? (
            <Button onClick={onRetry} variant="outline">
              ลองใหม่
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีรายการรับวัสดุ"
        description="เริ่มต้นโดยการสร้างรายการรับวัสดุใหม่"
        action={
          onCreate ? (
            <Button onClick={onCreate}>
              + สร้างรายการรับวัสดุ
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="เลขที่"
                field="receiptNo"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead>วันที่รับ</TableHead>
              <SortableHeader
                label="ใบส่งของ"
                field="supplierDocNo"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead>ผู้จัดจำหน่าย</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จำนวนรายการ</TableHead>
              <TableHead className="text-right">น้ำหนักรับ (ตัน)</TableHead>
              <TableHead className="w-12 text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">
                  {receipt.receiptNo ?? (
                    <span className="text-muted-foreground italic">— รออนุมัติ</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                <TableCell>{receipt.supplierDocNo ?? "—"}</TableCell>
                <TableCell>{receipt.supplier?.nameTh ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={receipt.status} />
                </TableCell>
                <TableCell className="text-right">{receipt.itemCount}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(receipt.totalQtyReceived)}
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu
                    label={`จัดการรายการรับสินค้า ${receipt.receiptNo ?? receipt.id}`}
                    items={[
                      {
                        label: "ดูรายละเอียด",
                        icon: <Eye className="h-4 w-4" />,
                        hidden: !onView,
                        onClick: () => onView?.(receipt),
                      },
                      {
                        label: "แก้ไข",
                        icon: <Pencil className="h-4 w-4" />,
                        hidden: !onEdit || receipt.status !== "draft",
                        onClick: () => onEdit?.(receipt),
                      },
                      {
                        label: "รับรองเอกสาร",
                        icon: <FileCheck className="h-4 w-4" />,
                        hidden: !onPost || receipt.status !== "draft",
                        onClick: () => onPost?.(receipt),
                      },
                      {
                        label: "ยกเลิกเอกสาร",
                        icon: <FileX className="h-4 w-4" />,
                        variant: "danger",
                        hidden: !onCancel || receipt.status !== "posted",
                        onClick: () => onCancel?.(receipt),
                      },
                      {
                        label: "ลบ",
                        icon: <Trash2 className="h-4 w-4" />,
                        variant: "danger",
                        hidden: !onDelete || receipt.status !== "draft",
                        onClick: () => onDelete?.(receipt),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>แสดง</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border px-2 py-1"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>รายการต่อหน้า</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            หน้า {page} จาก {totalPages} ({totalItems} รายการ)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
