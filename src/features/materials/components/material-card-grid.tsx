"use client";

/**
 * MaterialCardGrid
 *
 * Card-based grid view of Materials. Each card shows the image (resolved
 * through `resolveMaterialImage` so the API's bare `/uploads/...` paths
 * load through the Next.js rewrite), key fields, status, and per-card
 * actions.
 *
 * Designed for `/materials/pc` and any page that prefers a tiled view
 * over the row-based `MaterialTable`. Sort and pagination live in the
 * page; this component renders a single, already-filtered page of
 * materials.
 */

import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Pencil,
  RotateCcw,
  Slash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { resolveMaterialImage } from "../utils";
import type { Material } from "../api/materials-api";

export interface MaterialCardGridProps {
  materials: Material[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (material: Material) => void;
  onStatusChange?: (material: Material) => void;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function unitLabel(material: Material): string {
  if (!material.unit) return "—";
  return material.unit.symbol || material.unit.nameTh || material.unit.code;
}

export function MaterialCardGrid({
  materials,
  isLoading = false,
  isError = false,
  onRetry,
  onCreate,
  onEdit,
  onStatusChange,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: MaterialCardGridProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-full">
              <Slash className="size-5" />
            </div>
            <p className="font-semibold">โหลดรายการอะไหล่ไม่สำเร็จ</p>
            <p className="text-muted-foreground text-sm">
              ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง
            </p>
            {onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                ลองใหม่
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="กำลังโหลดรายการอะไหล่"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span className="sr-only">กำลังโหลดรายการอะไหล่</span>
          {Array.from({ length: Math.max(pageSize, 8) }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<ImageOff className="size-6" />}
              title="ยังไม่มีข้อมูลอะไหล่ PC"
              description="เพิ่มอะไหล่รายการแรก หรือปรับเงื่อนไขการค้นหา"
              action={
                onCreate ? (
                  <Button type="button" size="sm" onClick={onCreate}>
                    เพิ่มอะไหล่ PC
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((material) => {
            const imageUrl = resolveMaterialImage(material.imagePath);
            return (
              <Card
                key={material.id}
                data-testid={`material-card-${material.code}`}
                className={cn(
                  "group flex h-full flex-col overflow-hidden transition-shadow",
                  "hover:shadow-md",
                )}
              >
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`รูปอะไหล่ ${material.code}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
                      <ImageOff className="size-6" aria-hidden="true" />
                      <span>ไม่มีรูป</span>
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge variant={material.isActive ? "success" : "muted"}>
                      {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <code className="text-primary font-mono text-xs font-semibold">
                      {material.code}
                    </code>
                    <span className="bg-background text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                      {unitLabel(material)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm font-medium" title={material.name}>
                    {material.name}
                  </p>

                  <dl className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <div>
                      <dt className="text-foreground/60">รุ่น</dt>
                      <dd className="truncate">{material.model?.nameTh ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">การจัดส่ง</dt>
                      <dd className="truncate">{material.deliveryType?.nameTh ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-foreground/60">ผู้ขาย</dt>
                      <dd className="truncate">
                        {material.suppliers.length > 0
                          ? material.suppliers
                              .slice(0, 2)
                              .map((supplier) => supplier.nameTh)
                              .join(", ") +
                            (material.suppliers.length > 2
                              ? ` +${material.suppliers.length - 2}`
                              : "")
                          : "—"}
                      </dd>
                    </div>
                  </dl>

                  {(onEdit || onStatusChange) && (
                    <div className="mt-auto flex items-center justify-end gap-1 border-t pt-2">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(material)}
                          aria-label={`แก้ไข ${material.code}`}
                        >
                          <Pencil className="size-4" />
                          แก้ไข
                        </Button>
                      )}
                      {onStatusChange && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(material)}
                          aria-label={
                            material.isActive
                              ? `ปิดใช้งาน ${material.code}`
                              : `เปิดใช้งาน ${material.code}`
                          }
                        >
                          {material.isActive ? (
                            <>
                              <Slash className="size-4" />
                              ปิดใช้งาน
                            </>
                          ) : (
                            <>
                              <RotateCcw className="size-4" />
                              เปิดใช้งาน
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
              {[8, 12, 24, 48].map((size) => (
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
