"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ImageOff,
  Package,
  Pencil,
  RotateCcw,
  Slash,
} from "lucide-react";
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
import type { ListMaterialsParams, Material } from "../api/materials-api";

type MaterialSortBy = NonNullable<ListMaterialsParams["sortBy"]>;
type MaterialSortOrder = NonNullable<ListMaterialsParams["sortOrder"]>;

export interface MaterialTableProps {
  materials: Material[];
  page: number;
  pageSize: number;
  totalItems: number;
  sortBy?: MaterialSortBy;
  sortOrder?: MaterialSortOrder;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (material: Material) => void;
  onStatusChange?: (material: Material) => void;
  onSortChange: (sortBy: MaterialSortBy, sortOrder: MaterialSortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function lookupLabel(value: Material["unit"] | null): string {
  if (!value) return "—";
  return value.symbol || value.nameTh || value.code;
}

export function MaterialTable({
  materials,
  page,
  pageSize,
  totalItems,
  sortBy,
  sortOrder,
  isLoading = false,
  isError = false,
  onRetry,
  onCreate,
  onEdit,
  onStatusChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: MaterialTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const toggleSort = (field: MaterialSortBy) => {
    onSortChange(field, sortBy === field && sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-3">
      <div className="bg-card overflow-hidden rounded-lg border">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[280px]">
                <button
                  type="button"
                  onClick={() => toggleSort("code")}
                  aria-label="เรียงตามรหัสวัสดุ"
                  className="focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2"
                >
                  วัสดุ
                  {sortBy === "code" ? (
                    <ChevronDown
                      className={sortOrder === "asc" ? "size-3.5 rotate-180" : "size-3.5"}
                    />
                  ) : (
                    <ChevronsUpDown className="size-3.5" />
                  )}
                </button>
              </TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead>รุ่น</TableHead>
              <TableHead>ประเภทการจัดส่ง</TableHead>
              <TableHead>ผู้ขาย</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("isActive")}
                  aria-label="เรียงตามสถานะ"
                  className="focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2"
                >
                  สถานะ
                  <ChevronsUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-right">การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div role="status" aria-label="กำลังโหลดรายการวัสดุ" className="space-y-3 py-2">
                    <span className="sr-only">กำลังโหลดรายการวัสดุ</span>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-11 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <div className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-full">
                      <Slash className="size-5" />
                    </div>
                    <p className="font-semibold">โหลดรายการวัสดุไม่สำเร็จ</p>
                    <p className="text-muted-foreground text-sm">
                      ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง
                    </p>
                    {onRetry && (
                      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        ลองใหม่
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={<Package className="size-6" />}
                    title="ยังไม่มีข้อมูลวัสดุ"
                    description="เพิ่มวัสดุรายการแรก หรือปรับเงื่อนไขการค้นหา"
                    action={
                      onCreate ? (
                        <Button type="button" size="sm" onClick={onCreate}>
                          เพิ่มวัสดุ
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div
                      data-testid={`material-identity-${material.code}`}
                      className="border-primary bg-muted/30 flex items-center gap-3 rounded-md border-l-2 py-1 pr-2 pl-3"
                    >
                      <div className="bg-background flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                        {material.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={material.imagePath}
                            alt={`รูปวัสดุ ${material.code}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageOff className="text-muted-foreground size-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <code className="text-primary font-mono text-xs font-semibold">
                          {material.code}
                        </code>
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{material.name}</p>
                          <span className="bg-background text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                            {lookupLabel(material.unit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{lookupLabel(material.unit)}</TableCell>
                  <TableCell>{material.model?.nameTh ?? "—"}</TableCell>
                  <TableCell>{material.deliveryType?.nameTh ?? "—"}</TableCell>
                  <TableCell>
                    {material.suppliers.length > 0 ? (
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {material.suppliers.map((supplier) => (
                          <Badge key={supplier.id} variant="muted" size="sm">
                            {supplier.nameTh}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={material.isActive ? "success" : "muted"}>
                      {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(material)}
                          aria-label={`แก้ไข ${material.code}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {onStatusChange && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onStatusChange(material)}
                          aria-label={
                            material.isActive
                              ? `ปิดใช้งาน ${material.code}`
                              : `เปิดใช้งาน ${material.code}`
                          }
                        >
                          {material.isActive ? (
                            <Slash className="size-4" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                        </Button>
                      )}
                      {!onEdit && !onStatusChange && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            {start}–{end} จาก {totalItems} รายการ
          </span>
          <label className="flex items-center gap-2">
            จำนวนต่อหน้า
            <select
              aria-label="จำนวนต่อหน้า"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="border-input bg-background text-foreground focus-visible:ring-ring h-8 rounded-md border px-2 outline-none focus-visible:ring-2"
              disabled={isLoading}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft className="size-4" />
            ก่อนหน้า
          </Button>
          <span className="min-w-20 text-center">
            หน้า {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="หน้าถัดไป"
          >
            ถัดไป
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
