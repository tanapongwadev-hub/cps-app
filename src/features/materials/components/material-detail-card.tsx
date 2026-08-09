"use client";

/**
 * MaterialDetailCard — Redesigned
 *
 * Modern, clean detail view for a single Material.
 * - Hero section with image and key info
 * - Organized detail cards
 * - Clear visual hierarchy
 */

import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Edit2,
  Hash,
  ImageOff,
  Maximize2,
  Package,
  Power,
  RotateCcw,
  Tag,
  Truck,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";
import { resolveMaterialImage, getMaterialTypeLabel, getMaterialTypeColor } from "../utils";
import type { Material } from "../api/materials-api";

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

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export interface MaterialDetailCardProps {
  material: Material;
  onEdit?: () => void;
  onStatusChange?: () => void;
  className?: string;
}

export function MaterialDetailCard({
  material,
  onEdit,
  onStatusChange,
  className,
}: MaterialDetailCardProps) {
  const imageUrl = resolveMaterialImage(material.imagePath);
  const unitLabel =
    material.unit?.symbol ||
    material.unit?.nameTh ||
    material.unit?.code ||
    "—";
  const typeLabel = getMaterialTypeLabel(material.type);
  const [preview, setPreview] = useState(false);

  return (
    <div className={cn("space-y-5", className)}>
      {/* ===== Hero Section ===== */}
      <Card className="overflow-hidden border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Image */}
          <div
            className={cn(
              "group/img relative min-h-[280px] overflow-hidden bg-muted/30 border-b md:border-b-0 md:border-r",
              imageUrl && "cursor-pointer",
            )}
            onClick={() => imageUrl && setPreview(true)}
            role={imageUrl ? "button" : undefined}
            tabIndex={imageUrl ? 0 : undefined}
            onKeyDown={(event) => {
              if (imageUrl && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                setPreview(true);
              }
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`รูปอะไหล่ ${material.code}`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="bg-muted/50 flex size-14 items-center justify-center rounded-xl">
                  <ImageOff className="size-6 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground text-sm">ไม่มีรูปตัวอย่าง</span>
              </div>
            )}

            {/* Preview Hint (ซ้อนทับรูป) */}
            {imageUrl && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/img:bg-black/30 group-hover/img:opacity-100">
                <div className="bg-background/90 text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg">
                  <Maximize2 className="size-3.5" />
                  คลิกเพื่อขยาย
                </div>
              </div>
            )}

            {/* Type Badge - Top Left */}
            {typeLabel && (
              <div className="absolute left-3 top-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold shadow-md",
                    getMaterialTypeColor(material.type),
                  )}
                >
                  {typeLabel}
                </span>
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute right-3 top-3">
              <Badge
                variant={material.isActive ? "success" : "secondary"}
                className="gap-1.5 px-2.5 py-1"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    material.isActive ? "bg-white/90" : "bg-muted-foreground/60",
                  )}
                />
                {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
              </Badge>
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-3 p-5 pb-4">
              {/* Type — Hero element (เด่น) */}
              {typeLabel && (
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm",
                      getMaterialTypeColor(material.type),
                    )}
                  >
                    <Tag className="size-3.5" />
                    {typeLabel}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <code className="bg-primary/10 text-primary rounded-lg px-2.5 py-1 font-mono text-sm font-semibold">
                  {material.code}
                </code>
                <Badge variant="outline" className="text-xs">
                  {material.unit?.nameTh ?? "—"}
                </Badge>
                {/* ประเภท (Model) */}
                {material.model && (
                  <Badge variant="secondary" className="text-xs">
                    {material.model.nameTh}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{material.name}</h1>
              {material.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-3 text-sm">
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                สร้าง {formatDate(material.createdAt)}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                อัปเดต {formatDateTime(material.updatedAt)}
              </span>
              {material.updatedBy && (
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <User className="size-4" />
                  โดย {material.updatedBy}
                </span>
              )}
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2 border-b px-5 py-3">
              {material.packingQuantity && (
                <div className="bg-warning/10 text-warning inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <Package className="size-3.5" />
                  {material.packingQuantity} ชิ้น/หน่วย
                </div>
              )}
              {material.deliveryType && (
                <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <Truck className="size-3.5" />
                  {material.deliveryType.nameTh}
                </div>
              )}
              {material.loadingPoint && (
                <div className="bg-info/10 text-info inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <Warehouse className="size-3.5" />
                  {material.loadingPoint.nameTh}
                </div>
              )}
              {material.processLineName && (
                <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                  {material.processLineName}
                </div>
              )}
            </div>

            {/* Actions */}
            {(onEdit || onStatusChange) && (
              <div className="mt-auto flex items-center gap-2 border-t p-4">
                {onEdit && (
                  <Button size="sm" onClick={onEdit} className="gap-1.5">
                    <Edit2 className="size-3.5" />
                    แก้ไขข้อมูล
                  </Button>
                )}
                {onStatusChange && (
                  <Button
                    size="sm"
                    variant={material.isActive ? "outline" : "default"}
                    onClick={onStatusChange}
                    className={cn(
                      "gap-1.5",
                      material.isActive && "text-danger hover:text-danger",
                    )}
                  >
                    {material.isActive ? (
                      <>
                        <Power className="size-3.5" />
                        ปิดใช้งาน
                      </>
                    ) : (
                      <>
                        <RotateCcw className="size-3.5" />
                        เปิดใช้งาน
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ===== Detail Cards ===== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Material Info Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Hash className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold">ข้อมูลวัสดุ</h3>
                <p className="text-muted-foreground text-xs">รายละเอียดพื้นฐาน</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="รหัสวัสดุ" value={material.code} mono />
            <DetailItem label="ชื่อวัสดุ" value={material.name} />
            <DetailItem label="หน่วยนับ" value={unitLabel} />
            {material.model && (
              <DetailItem label="ประเภท (Model)" value={material.model.nameTh} />
            )}
            {material.packingQuantity && (
              <DetailItem label="จำนวนบรรจุ" value={`${material.packingQuantity} ชิ้น/หน่วย`} />
            )}
            {material.specification && (
              <DetailItem label="สเปค" value={material.specification} />
            )}
            {material.scale && (
              <DetailItem label="Scale" value={material.scale} />
            )}
          </CardContent>
        </Card>

        {/* Suppliers Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-success/10 text-success flex size-8 items-center justify-center rounded-lg">
                <Truck className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold">ผู้จัดจำหน่าย</h3>
                <p className="text-muted-foreground text-xs">
                  {material.suppliers.length > 0
                    ? `${material.suppliers.length} รายการ`
                    : "ไม่มีผู้จัดจำหน่าย"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {material.suppliers.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
                <AlertCircle className="size-4" />
                ไม่มีผู้จัดจำหน่ายที่เชื่อมโยง
              </div>
            ) : (
              material.suppliers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.nameTh}</p>
                    {s.code && (
                      <p className="text-muted-foreground font-mono text-xs">{s.code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.telephone && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {s.telephone}
                      </Badge>
                    )}
                    <Badge variant={s.isActive ? "success" : "secondary"} className="text-xs">
                      {s.isActive ? "ใช้งาน" : "ปิด"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Lightbox (manual — avoids nested Radix Dialog) */}
      {preview && imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`รูปอะไหล่ ${material.code}`}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreview(false)}
        >
          <div
            className="bg-card relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-muted relative flex max-h-[80vh] items-center justify-center overflow-hidden p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`รูปอะไหล่ ${material.code}`}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
            <div className="flex items-center justify-between border-t bg-card px-4 py-3">
              <div>
                <p className="font-mono text-sm font-semibold">{material.code}</p>
                <p className="text-muted-foreground text-xs">{material.name}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreview(false)}
              >
                <X className="size-4" />
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-muted/30">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span
        className={cn(
          "text-right font-medium",
          mono && "font-mono text-xs bg-muted px-1.5 py-0.5 rounded",
          !mono && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function MaterialDetailCardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Hero Skeleton */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          <div className="bg-muted min-h-[220px] animate-pulse" />
          <div className="space-y-4 p-5">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Card>
      {/* Detail Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function MaterialDetailEmpty({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-xl">
          <Package className="size-6 text-muted-foreground" />
        </div>
        <div className="text-base font-semibold">ไม่พบข้อมูลวัสดุ</div>
        <div className="text-muted-foreground text-sm">{message}</div>
      </CardContent>
    </Card>
  );
}
