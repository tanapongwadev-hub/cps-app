"use client";

/**
 * MaterialCardGrid — Redesigned
 *
 * Modern, clean card grid for Materials/PC parts.
 * - Compact card design with subtle borders
 * - Clear visual hierarchy
 * - Quick actions on hover
 * - Responsive grid layout
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  ImageOff,
  Maximize2,
  Package,
  Power,
  RotateCcw,
  Scale,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import {
  resolveMaterialImage,
  getMaterialTypeLabel,
  getMaterialTypeColor,
  getMaterialShapeLabel,
  getMaterialShapeColor,
} from "../utils";
import { stockBalanceApi, materialShapeRequiresRatio, type Material } from "../api/materials-api";

export interface MaterialCardGridProps {
  materials: Material[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate?: () => void;
  onEdit?: (material: Material) => void;
  onStatusChange?: (material: Material) => void;
  onViewStockBalance?: (material: Material) => void;
  detailHref?: (material: Material) => string;
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
  onViewStockBalance,
  detailHref,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: MaterialCardGridProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const [preview, setPreview] = useState<{ url: string; code: string; name: string } | null>(null);

  // Stock balances — fetch once per material
  const [stockBalances, setStockBalances] = useState<Record<string, { qty: string; unit: string }>>({});
  const [stockLoaded, setStockLoaded] = useState(false);
  useEffect(() => {
    if (!materials.length) return;
    setStockLoaded(false);
    stockBalanceApi
      .getAll()
      .then((data) => {
        const map: Record<string, { qty: string; unit: string }> = {};
        for (const sb of data ?? []) {
          map[sb.materialId] = { qty: sb.quantity, unit: sb.unitCode };
        }
        setStockBalances(map);
      })
      .catch(() => {
        // silently ignore — balances just won't show
      })
      .finally(() => setStockLoaded(true));
  }, [materials.map((m) => m.id).join(",")]);

  return (
    <div className="space-y-4">
      {/* Error State */}
      {isError ? (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-lg">
              <Package className="size-5" />
            </div>
            <p className="font-semibold text-danger">โหลดรายการอะไหล่ไม่สำเร็จ</p>
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
        /* Loading Skeleton */
        <div
          role="status"
          aria-label="กำลังโหลดรายการอะไหล่"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span className="sr-only">กำลังโหลดรายการอะไหล่</span>
          {Array.from({ length: Math.max(pageSize, 8) }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-border/60">
              <Skeleton className="h-36 w-full rounded-none" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="p-0">
            <EmptyState
              icon={<Package className="size-8 text-muted-foreground/50" />}
              title="ยังไม่มีข้อมูลอะไหล่ PC"
              description="เริ่มต้นโดยการเพิ่มอะไหล่รายการแรกของคุณ"
              action={
                onCreate ? (
                  <Button type="button" onClick={onCreate}>
                    เพิ่มอะไหล่ PC
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        /* Material Cards Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((material) => {
            const imageUrl = resolveMaterialImage(material.imagePath);
            const href = detailHref?.(material);
            const typeLabel = getMaterialTypeLabel(material.type);
            const shapeLabel = getMaterialShapeLabel(material.materialType);
            return (
              <Card
                key={material.id}
                data-testid={`material-card-${material.code}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden border-border/60 transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-md",
                  href && "cursor-pointer",
                )}
              >
                {/* Image Section - ลดขนาด */}
                <div className="group/img relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`รูปอะไหล่ ${material.code}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2">
                      <div className="bg-muted/50 flex size-12 items-center justify-center rounded-lg">
                        <ImageOff className="size-5" />
                      </div>
                      <span className="text-xs">ไม่มีรูป</span>
                    </div>
                  )}

                  {/* Preview Button - Bottom Right */}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview({ url: imageUrl, code: material.code, name: material.name });
                      }}
                      aria-label={`ขยายรูป ${material.code}`}
                      className="bg-background/90 hover:bg-primary hover:scale-110 absolute bottom-2 right-2 z-10 flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-all"
                    >
                      <Maximize2 className="text-muted-foreground group-hover/img:text-primary-foreground size-3.5 transition-colors" />
                    </button>
                  )}

                  {/* Type Badge - Top Left */}
                  {typeLabel && (
                    <div className="absolute left-2 top-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-md",
                          getMaterialTypeColor(material.type),
                        )}
                      >
                        {typeLabel}
                      </span>
                    </div>
                  )}

                  {/* Material Shape Badge - Top Left (below type) */}
                  {shapeLabel && (
                    <div className="absolute left-2 top-10">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium shadow-sm",
                          getMaterialShapeColor(material.materialType),
                        )}
                        title={
                          material.ratio
                            ? `1 เส้น/แผ่น/ม้วน แบ่งได้ ${material.ratio} ชิ้น`
                            : undefined
                        }
                      >
                        {shapeLabel}
                        {material.ratio != null && (
                          <span className="ml-0.5 rounded bg-white/40 px-1 text-[10px] font-semibold">
                            ×{material.ratio}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Status Badge - Top Right */}
                  <div className="absolute right-2 top-2">
                    <Badge
                      variant={material.isActive ? "success" : "secondary"}
                      className="gap-1 px-2 py-0.5 text-xs"
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          material.isActive ? "bg-white/80" : "bg-muted-foreground/50",
                        )}
                      />
                      {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </div>

                  {/* Unit Badge - Bottom Left */}
                  {material.unit && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-background/95 text-foreground rounded-md border px-2 py-0.5 font-mono text-xs font-medium shadow-sm backdrop-blur-sm">
                        {unitLabel(material)}
                      </span>
                    </div>
                  )}

                  {/* Quick Actions - shown next to status badge (visible on hover) */}
                  {(onEdit || onStatusChange || onViewStockBalance) && (
                    <div className="absolute right-2 top-9 flex translate-y-1 items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      {onViewStockBalance && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewStockBalance(material);
                          }}
                          aria-label={`ดูสต็อก ${material.code}`}
                          className="bg-background/95 hover:bg-primary hover:scale-110 flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-all"
                        >
                          <Scale className="text-muted-foreground group-hover/btn:text-primary-foreground size-3.5 transition-colors" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(material);
                          }}
                          aria-label={`แก้ไข ${material.code}`}
                          className="bg-background/95 hover:bg-primary hover:scale-110 flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-all"
                        >
                          <Edit2 className="text-muted-foreground group-hover/btn:text-primary-foreground size-3.5 transition-colors" />
                        </button>
                      )}
                      {onStatusChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(material);
                          }}
                          aria-label={
                            material.isActive
                              ? `ปิดใช้งาน ${material.code}`
                              : `เปิดใช้งาน ${material.code}`
                          }
                          className={cn(
                            "flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-colors",
                            material.isActive
                              ? "bg-background/95 hover:bg-danger/10"
                              : "bg-success/10 hover:bg-success/20",
                          )}
                        >
                          {material.isActive ? (
                            <Power className="size-3.5 text-muted-foreground" />
                          ) : (
                            <RotateCcw className="size-3.5 text-success" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardContent className="flex flex-1 flex-col gap-2 p-3">
                  {/* Code & Stock Balance */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-primary font-mono text-xs font-semibold shrink-0">
                        {material.code}
                      </code>
                      {/* Stock Balance — prominent badge next to code */}
                      {stockLoaded && stockBalances[material.id] && (() => {
                        const bal = stockBalances[material.id]!;
                        const qty = Number(bal.qty);
                        const requiresRatio = materialShapeRequiresRatio(material.materialType);
                        const usableQty = requiresRatio && material.ratio ? qty * material.ratio : null;
                        const hasStock = qty > 0;
                        return (
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs font-bold border",
                              hasStock
                                ? "bg-success/10 text-success border-success/30"
                                : "bg-danger/10 text-danger border-danger/30",
                            )}
                          >
                            {qty.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            <span className="ml-0.5 text-[10px] font-medium">{bal.unit}</span>
                            {usableQty !== null && (
                              <span className="ml-1 text-[10px] font-semibold text-success/80">
                                ({usableQty.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ชิ้น)
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {new Date(material.updatedAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Name */}
                  <p
                    className="line-clamp-2 text-sm font-medium leading-snug"
                    title={material.name}
                  >
                    {material.name}
                  </p>

                  {/* Meta Info */}
                  <div className="mt-auto space-y-1.5">
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-1.5">
                      {material.packingQuantity && (
                        <span className="bg-warning/10 text-warning inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                          <Package className="size-2.5" />
                          {material.packingQuantity} ชิ้น
                        </span>
                      )}
                      {material.model && (
                        <span className="bg-muted/50 text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]">
                          <Package className="size-2.5" />
                          {material.model.nameTh}
                        </span>
                      )}
                      {material.deliveryType && (
                        <span className="bg-muted/50 text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]">
                          {material.deliveryType.nameTh}
                        </span>
                      )}
                    </div>

                    {/* Suppliers */}
                    {material.suppliers.length > 0 && (
                      <p className="text-muted-foreground truncate text-xs">
                        <span className="text-muted-foreground/60">ผู้ขาย: </span>
                        {material.suppliers
                          .slice(0, 2)
                          .map((s) => s.nameTh)
                          .join(", ")}
                        {material.suppliers.length > 2 && (
                          <span className="text-muted-foreground/60">
                            {" "}
                            +{material.suppliers.length - 2}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                    {href ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(href);
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="mr-1 size-3.5" />
                        ดูรายละเอียด
                      </Button>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(material)}
                          aria-label={`แก้ไข ${material.code}`}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="size-3.5" />
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
                          className={cn(
                            "h-7 w-7 p-0",
                            material.isActive
                              ? "text-muted-foreground hover:text-danger"
                              : "text-success hover:text-success",
                          )}
                        >
                          {material.isActive ? (
                            <Power className="size-3.5" />
                          ) : (
                            <ToggleRight className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            แสดง {start}–{end} จาก {totalItems} รายการ
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
            <ChevronLeft className="mr-1 size-4" />
            ก่อนหน้า
          </Button>
          <span className="min-w-20 text-center text-sm">
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
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 sm:max-w-5xl">
          <DialogTitle className="sr-only">
            {preview ? `รูป ${preview.code} - ${preview.name}` : "รูปตัวอย่าง"}
          </DialogTitle>
          <div className="bg-muted relative flex max-h-[85vh] items-center justify-center overflow-hidden p-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={`รูปอะไหล่ ${preview.code}`}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}
          </div>
          {preview && (
            <div className="flex items-center justify-between border-t bg-card px-4 py-3">
              <div>
                <p className="font-mono text-sm font-semibold">{preview.code}</p>
                <p className="text-muted-foreground text-xs">{preview.name}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreview(null)}
              >
                <X className="size-4" />
                ปิด
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
