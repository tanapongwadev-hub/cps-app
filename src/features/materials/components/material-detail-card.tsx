"use client";

/**
 * MaterialDetailCard
 *
 * แสดงรายละเอียดของวัสดุ (Material) ในรูปแบบ card รวมศูนย์ ออกแบบใหม่ให้ทันสมัย
 * และอ่านง่ายกว่า mockup เดิม โดยใช้ข้อมูลจริงจาก API เป็นหลัก และ fallback
 * เป็น mock data สำหรับ fields ที่ API ปัจจุบันยังไม่มี (เช่น ยี่ห้อ, หมวดหมู่,
 * ระดับวัสดุ, ปริมาณคงเหลือ) — เพื่อให้ UI preview ครบทุกส่วนตามที่ออกแบบไว้.
 */

import {
  Calendar,
  CircleDot,
  ClipboardList,
  Edit3,
  ImageOff,
  Info,
  Power,
  RotateCcw,
  Truck,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { resolveMaterialImage } from "../utils";
import type { Material } from "../api/materials-api";

/**
 * Fields ที่ API ปัจจุบันยังไม่รองรับ — ใช้สำหรับ preview UI เท่านั้น
 * เมื่อ backend พร้อม สามารถลบ mock ทิ้งและ map จาก Material type ได้โดยตรง
 */
interface DerivedMaterialFields {
  category: string;
  stock: {
    available: number;
    recommended: number;
    minOrder: number;
    unit: string;
  };
  recentlyUpdatedBy: string;
}

function deriveMockFields(material: Material): DerivedMaterialFields {
  // ใช้ข้อมูลจริงที่มี + deterministic mock จาก code เพื่อให้ preview นิ่ง
  const codeNum = Number.parseInt(material.code.replace(/\D/g, ""), 10) || 1;
  const unitLabel =
    material.unit?.symbol || material.unit?.nameTh || material.unit?.code || "ชิ้น";
  return {
    category: codeNum % 2 === 0 ? "อะไหล่อิเล็กทรอนิกส์" : "อะไหล่เครื่องกล",
    stock: {
      available: 250 + ((codeNum * 7) % 200),
      recommended: 100,
      minOrder: 50,
      unit: unitLabel,
    },
    recentlyUpdatedBy: material.updatedBy ?? "system",
  };
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
  const derived = deriveMockFields(material);
  const unitLabel =
    material.unit?.symbol || material.unit?.nameTh || material.unit?.code || "—";
  const supplierNames =
    material.suppliers.length > 0
      ? material.suppliers.slice(0, 2).map((s) => s.nameTh).join(", ") +
        (material.suppliers.length > 2 ? ` +${material.suppliers.length - 2}` : "")
      : "—";

  return (
    <Card
      data-testid={`material-detail-${material.code}`}
      className={cn(
        "overflow-hidden border-border/60 shadow-sm",
        "bg-gradient-to-br from-card via-card to-muted/30",
        className,
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* ========== Image / hero panel ========== */}
        <div className="relative bg-muted/60 flex min-h-[280px] items-center justify-center overflow-hidden border-b lg:min-h-full lg:border-b-0 lg:border-r">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`รูปอะไหล่ ${material.code}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground relative z-10 flex flex-col items-center gap-2 text-sm">
              <div className="bg-background flex size-16 items-center justify-center rounded-full border shadow-sm">
                <ImageOff className="size-6" aria-hidden="true" />
              </div>
              <span>ไม่มีรูปตัวอย่าง</span>
            </div>
          )}

          {/* Top gradient + status badge */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute right-3 top-3">
            <Badge
              variant={material.isActive ? "success" : "muted"}
              className="shadow-md backdrop-blur-md"
            >
              <CircleDot className="mr-1 size-3" />
              {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
            </Badge>
          </div>

          {/* Bottom gradient + image attribution */}
          {imageUrl && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
          )}
        </div>

        {/* ========== Content panel ========== */}
        <div className="flex flex-col lg:h-full">
          {/* Header: code + name + updatedAt */}
          <div className="flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 font-mono text-xs font-semibold tracking-wide">
                {material.code}
              </span>
              <span className="text-muted-foreground text-xs">
                <span className="bg-muted text-foreground/80 rounded px-1.5 py-0.5">
                  วัสดุ / Material
                </span>
              </span>
              <span className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs">
                <Calendar className="size-3.5" />
                อัปเดตล่าสุด {formatDate(material.updatedAt)}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {material.name}
            </h1>

            {material.description && (
              <p className="text-muted-foreground text-sm">{material.description}</p>
            )}
          </div>

          <Separator />

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2">
            {/* ----- ข้อมูลพื้นฐาน ----- */}
            <div className="bg-card p-5 sm:p-6">
              <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded">
                  <Info className="size-3.5" />
                </span>
                ข้อมูลพื้นฐาน
              </div>
              <dl className="space-y-2.5 text-sm">
                <DetailRow label="รหัสวัสดุ" value={material.code} mono />
                <DetailRow label="ชื่อวัสดุ" value={material.name} />
                <DetailRow label="รุ่น" value={material.model?.nameTh ?? "—"} />
                <DetailRow
                  label="ผู้ขาย"
                  value={
                    material.suppliers.length > 0 ? (
                      <span className="text-primary font-medium">{supplierNames}</span>
                    ) : (
                      "—"
                    )
                  }
                />
              </dl>
            </div>

            {/* ----- รายละเอียดการจัดส่ง ----- */}
            <div className="bg-card p-5 sm:p-6">
              <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="bg-success/10 text-success flex size-6 items-center justify-center rounded">
                  <Truck className="size-3.5" />
                </span>
                รายละเอียดการจัดส่ง
              </div>
              <dl className="space-y-2.5 text-sm">
                <DetailRow label="การจัดส่ง" value={material.deliveryType?.nameTh ?? "—"} />
                <DetailRow
                  label="สถานะ"
                  value={
                    <Badge variant={material.isActive ? "success" : "muted"}>
                      <span
                        className={cn(
                          "mr-1.5 size-1.5 rounded-full",
                          material.isActive
                            ? "bg-success-foreground/80"
                            : "bg-muted-foreground/60",
                        )}
                      />
                      {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  }
                />
                <DetailRow label="วันที่บันทึก" value={formatDate(material.createdAt)} />
              </dl>
            </div>
          </div>

          <Separator />

          {/* ข้อมูลเพิ่มเติม — 2-column key-value table (mock fields) */}
          <CardContent className="space-y-3 p-5 sm:p-6">
            <div className="text-foreground mb-1 flex items-center gap-2 text-sm font-semibold">
              <span className="bg-info/10 text-info flex size-6 items-center justify-center rounded">
                <Info className="size-3.5" />
              </span>
              ข้อมูลเพิ่มเติม
            </div>

            <dl className="bg-muted/30 divide-border/60 grid grid-cols-1 divide-y rounded-lg border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <DetailCell label="หมวดหมู่">
                <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {derived.category}
                </span>
              </DetailCell>
              <DetailCell label="หน่วยนับ">{unitLabel} (PCS)</DetailCell>

              <DetailCell label="ค่าแนะนำจัดเก็บ">
                {derived.stock.recommended} {derived.stock.unit}
              </DetailCell>
              <DetailCell label="สต็อกคงเหลือ">
                <span className="text-success font-semibold">
                  {derived.stock.available} {derived.stock.unit}
                </span>
              </DetailCell>

              <DetailCell label="ขั้นต่ำการสั่งซื้อ">
                {derived.stock.minOrder} {derived.stock.unit}
              </DetailCell>
              <DetailCell label="หมายเหตุ">
                <span className="text-muted-foreground">—</span>
              </DetailCell>
            </dl>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <User className="size-3" />
                แก้ไขโดย <span className="text-foreground">{derived.recentlyUpdatedBy}</span>
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span>
                อัปเดตล่าสุด {formatDate(material.updatedAt)}
              </span>
            </div>
          </CardContent>

          {/* Sticky action bar */}
          <div className="bg-muted/40 border-t p-4 sm:flex sm:items-center sm:justify-end sm:gap-2 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onEdit}
                  className="w-full sm:w-auto"
                >
                  <Edit3 className="size-4" />
                  แก้ไข
                </Button>
              )}
              {onStatusChange && (
                <Button
                  type="button"
                  variant={material.isActive ? "danger" : "success"}
                  onClick={onStatusChange}
                  className="w-full sm:w-auto"
                >
                  {material.isActive ? (
                    <>
                      <Power className="size-4" />
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
          </div>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground shrink-0 text-xs">{label}</dt>
      <dd
        className={cn(
          "text-foreground text-right text-sm",
          mono && "font-mono text-xs",
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Key-value cell for the "ข้อมูลเพิ่มเติม" 2-column table.
 * Renders as a single grid item with a label on top and value below.
 */
function DetailCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 even:border-t sm:even:border-t-0 sm:odd:border-r">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-right text-sm font-medium">
        {children}
      </dd>
    </div>
  );
}

export function MaterialDetailCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        <Skeleton className="min-h-[280px] rounded-none" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function MaterialDetailEmpty({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader className="items-center justify-center text-center">
        <div className="bg-muted text-muted-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
          <ClipboardList className="size-5" />
        </div>
        <div className="text-foreground text-base font-semibold">
          ไม่พบข้อมูลวัสดุ
        </div>
        <div className="text-muted-foreground text-sm">{message}</div>
      </CardHeader>
    </Card>
  );
}
