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
import Image from "next/image";
import {
  AlertCircle,
  Box,
  Calendar,
  Edit2,
  Hash,
  Image as ImageIcon,
  ImageOff,
  Maximize2,
  Package,
  Power,
  RotateCcw,
  Scissors,
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
import { cn } from "@/utils/cn";
import {
  resolveMaterialImage,
  getMaterialTypeLabel,
  getMaterialTypeColor,
  getMaterialShapeLabel,
  getMaterialShapeColor,
} from "../utils";
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
  const shapeLabel = getMaterialShapeLabel(material.materialType);
  const [preview, setPreview] = useState(false);

  return (
    <div className={cn("space-y-5", className)}>
      {/* ===== Hero Section: Image Card + Info Card (แยกกัน) ===== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[360px_1fr] lg:grid-cols-[420px_1fr]">
        {/* Image Card — แยกเดี่ยว */}
        <Card className="overflow-hidden border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
                <ImageIcon className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">รูปอะไหล่</h3>
                <p className="text-muted-foreground text-xs">คลิกเพื่อขยาย</p>
              </div>
            </div>
            {imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview(true)}
                className="h-8 gap-1.5"
                aria-label="ขยายรูปภาพ"
              >
                <Maximize2 className="size-3.5" />
                <span className="hidden sm:inline">ขยาย</span>
              </Button>
            )}
          </CardHeader>
          <div
            className={cn(
              "group/img relative aspect-square w-full overflow-hidden bg-muted/30",
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
              <Image
                src={imageUrl}
                alt={`รูปอะไหล่ ${material.code}`}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="bg-muted/50 flex size-16 items-center justify-center rounded-2xl">
                  <ImageOff className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-foreground text-sm font-medium">ไม่มีรูปตัวอย่าง</p>
                  <p className="text-muted-foreground text-xs">อัปโหลดรูปเพื่อให้ง่ายต่อการค้นหา</p>
                </div>
              </div>
            )}

            {/* Type Badge - Top Left */}
            {typeLabel && (
              <div className="absolute left-3 top-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider shadow-md",
                    getMaterialTypeColor(material.type),
                  )}
                >
                  <Tag className="size-3" />
                  {typeLabel}
                </span>
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute right-3 top-3">
              <Badge
                variant={material.isActive ? "success" : "secondary"}
                className="gap-1.5 px-2.5 py-1 shadow-md"
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

            {/* Preview Hint (ซ้อนทับรูป) */}
            {imageUrl && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/img:bg-black/30 group-hover/img:opacity-100">
                <div className="bg-background/90 text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg">
                  <Maximize2 className="size-3.5" />
                  คลิกเพื่อขยาย
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Info Card — แยกเดี่ยว */}
        <Card className="flex flex-col border-border/60">
          {/* Header */}
          <CardHeader className="border-b bg-muted/20 px-5 pb-4">
            <div className="flex flex-col gap-3">
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
              <h2 className="text-2xl font-semibold tracking-tight">{material.name}</h2>

              {/* Material Shape + Ratio — Hero highlight */}
              {shapeLabel && (
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-sm",
                      getMaterialShapeColor(material.materialType),
                    )}
                  >
                    <Box className="size-4" />
                    <span>{shapeLabel}</span>
                    {material.ratio != null && (
                      <span className="ml-1 inline-flex items-center gap-1 rounded bg-white/60 px-2 py-0.5 text-xs font-bold text-foreground/80">
                        <Scissors className="size-3" />×{material.ratio} ชิ้น/เส้น
                      </span>
                    )}
                  </div>
                  {material.ratio != null && (
                    <span className="text-muted-foreground text-xs">
                      เช่น รับเข้า 3 เส้น × ratio {material.ratio} = ใช้ได้{" "}
                      <span className="text-foreground font-semibold">
                        {3 * material.ratio}
                      </span>{" "}
                      ชิ้น
                    </span>
                  )}
                </div>
              )}
              {material.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>
          </CardHeader>

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
            <div className="mt-auto flex items-center gap-2 border-t bg-muted/10 p-4">
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
        </Card>
      </div>

      {/* ===== Detail Cards ===== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            {shapeLabel && (
              <DetailItem label="ลักษณะวัสดุ" value={shapeLabel} />
            )}
            {material.ratio != null && (
              <DetailItem
                label="จำนวนชิ้นต่อเส้น (Ratio)"
                value={`${material.ratio} ชิ้น`}
              />
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

        {/* Material Shape & Ratio Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  "bg-primary/10 text-primary",
                )}
              >
                <Box className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold">ลักษณะวัสดุ & จำนวนชิ้นต่อเส้น</h3>
                <p className="text-muted-foreground text-xs">
                  ใช้คำนวณจำนวนชิ้นที่ใช้ได้เมื่อรับเข้า
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shape badge ใหญ่ */}
            <div className="flex flex-col items-start gap-2 rounded-lg border bg-muted/20 p-4">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Material Shape
              </span>
              {shapeLabel ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-base font-semibold",
                    getMaterialShapeColor(material.materialType),
                  )}
                >
                  <Box className="size-5" />
                  {shapeLabel}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">ไม่ระบุ</span>
              )}
            </div>

            {/* Ratio */}
            <div className="flex flex-col items-start gap-2 rounded-lg border bg-muted/20 p-4">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Ratio (จำนวนชิ้นต่อเส้น)
              </span>
              {material.ratio != null ? (
                <>
                  <div className="inline-flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-foreground">
                      {material.ratio}
                    </span>
                    <span className="text-muted-foreground text-sm">ชิ้น/เส้น</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    1 เส้น/แผ่น/ม้วน แบ่งได้ {material.ratio} ชิ้น
                    {material.materialType === "PIPE" && (
                      <>
                        {" "}
                        •{" "}
                        <span className="text-foreground font-medium">
                          เช่น รับเข้า 3 เส้น × {material.ratio} = ใช้ได้{" "}
                          {3 * material.ratio} ชิ้น
                        </span>
                      </>
                    )}
                  </p>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">
                  ไม่ระบุ — ประเภทนี้ไม่ใช้ ratio
                </span>
              )}
            </div>
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
              <Image
                src={imageUrl}
                alt={`รูปอะไหล่ ${material.code}`}
                width={1600}
                height={1600}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
                style={{ width: "auto", height: "auto" }}
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
