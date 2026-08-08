"use client";

/**
 * MaterialDetailCard — Modern, clean redesign
 *
 * Layout: Hero image (left) + Info panel (right)
 * Style: Minimal, clean borders, good hierarchy, no gradient noise
 */

import {
  AlertCircle,
  Calendar,
  Hash,
  ImageOff,
  Package,
  Truck,
  User,
  Warehouse,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";
import { resolveMaterialImage } from "../utils";
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* ===== Hero Card ===== */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Image */}
          <div className="relative bg-muted/40 flex min-h-[240px] items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`รูปอะไหล่ ${material.code}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="bg-background flex size-14 items-center justify-center rounded-full border shadow-sm">
                  <ImageOff className="size-6" />
                </div>
                <span className="text-xs">ไม่มีรูปตัวอย่าง</span>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute right-3 top-3">
              <Badge
                variant={material.isActive ? "default" : "secondary"}
                className={cn(
                  "shadow-sm",
                  material.isActive
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-2 p-5 pb-4">
              <div className="flex items-center gap-2">
                <code className="bg-muted text-foreground rounded px-2 py-0.5 font-mono text-xs font-semibold">
                  {material.code}
                </code>
                <Badge variant="outline" className="text-xs">
                  {material.unit?.nameTh ?? "—"}
                </Badge>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">{material.name}</h1>
              {material.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 border-b px-5 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                สร้าง {formatDate(material.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                อัปเดต {formatDateTime(material.updatedAt)}
              </span>
              {material.updatedBy && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5" />
                  โดย {material.updatedBy}
                </span>
              )}
            </div>

            {/* Quick info pills */}
            <div className="flex flex-wrap gap-2 border-b px-5 py-3">
              {material.deliveryType && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Truck className="size-3" />
                  {material.deliveryType.nameTh}
                </div>
              )}
              {material.model && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Package className="size-3" />
                  {material.model.nameTh}
                </div>
              )}
              {material.loadingPoint && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  <Warehouse className="size-3" />
                  {material.loadingPoint.nameTh}
                </div>
              )}
            </div>

            {/* Actions */}
            {(onEdit || onStatusChange) && (
              <div className="mt-auto flex items-center gap-2 border-t p-4">
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    แก้ไขข้อมูล
                  </Button>
                )}
                {onStatusChange && (
                  <Button
                    size="sm"
                    variant={material.isActive ? "destructive" : "default"}
                    onClick={onStatusChange}
                  >
                    {material.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ===== Detail Cards ===== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Specs */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded">
                <Hash className="size-3.5" />
              </div>
              ข้อมูลวัสดุ
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailItem label="รหัสวัสดุ" value={material.code} mono />
            <DetailItem label="ชื่อวัสดุ" value={material.name} />
            <DetailItem label="หน่วยนับ" value={unitLabel} />
            {material.specification && (
              <DetailItem label="สเปค" value={material.specification} />
            )}
            {material.scale && (
              <DetailItem label="Scale" value={material.scale} />
            )}
            {material.processLineName && (
              <DetailItem label="Process Line" value={material.processLineName} />
            )}
          </CardContent>
        </Card>

        {/* Suppliers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <div className="bg-success/10 text-success flex size-6 items-center justify-center rounded">
                <Truck className="size-3.5" />
              </div>
              ผู้จัดจำหน่าย ({material.suppliers.length})
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {material.suppliers.length === 0 ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <AlertCircle className="size-4" />
                ไม่มีผู้จัดจำหน่ายที่เชื่อมโยง
              </p>
            ) : (
              material.suppliers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{s.nameTh}</p>
                    {s.code && (
                      <p className="text-muted-foreground text-xs">{s.code}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {s.telephone ?? "—"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
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
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-right font-medium",
          mono && "font-mono text-xs",
          !mono && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function MaterialDetailCardSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          <div className="bg-muted min-h-[240px] animate-pulse" />
          <div className="space-y-4 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
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
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Package className="size-5 text-muted-foreground" />
        </div>
        <div className="text-sm font-semibold">ไม่พบข้อมูลวัสดุ</div>
        <div className="text-muted-foreground text-sm">{message}</div>
      </CardContent>
    </Card>
  );
}
