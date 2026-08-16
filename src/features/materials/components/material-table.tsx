"use client";

/**
 * MaterialTable
 *
 * ตารางแสดงรายการวัสดุ — ปรับปรุงใหม่ให้สอดคล้องกับ MaterialDetailCard:
 *  - เพิ่มปุ่ม "ดู" สำหรับเปิดหน้ารายละเอียด
 *  - เพิ่ม column "อัปเดตล่าสุด" เพื่อ trace การเปลี่ยนแปลง
 *  - ปรับ status badge ให้มี dot (เหมือน detail card) และรองรับ sort
 *  - ปรับ row hover / active state ให้อ่านง่ายขึ้น
 *  - รวมสอง column ที่ซ้ำซ้อน (หน่วย) ไว้ใน chip ภายใน cell "วัสดุ"
 */

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  ImageOff,
  Package,
  Pencil,
  Power,
  RotateCcw,
  Scale,
  Slash,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";
import {
  resolveMaterialImage,
  getMaterialTypeLabel,
  getMaterialTypeColor,
  getMaterialShapeLabel,
  getMaterialShapeColor,
} from "../utils";
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
  onViewStockBalance?: (material: Material) => void;
  /**
   * If provided, each row gains a "ดู" action that navigates to the
   * returned URL. The whole row also becomes clickable for the same URL.
   */
  detailHref?: (material: Material) => string;
  onSortChange: (sortBy: MaterialSortBy, sortOrder: MaterialSortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function unitLabel(material: Material): string {
  if (!material.unit) return "—";
  return material.unit.symbol || material.unit.nameTh || material.unit.code;
}

function supplierSummary(material: Material): {
  text: string;
  overflow: number;
} {
  if (material.suppliers.length === 0) return { text: "—", overflow: 0 };
  const first = material.suppliers[0];
  if (!first) return { text: "—", overflow: 0 };
  const overflow = material.suppliers.length - 1;
  return { text: first.nameTh, overflow };
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSortChange,
  ariaLabel,
  align = "left",
}: {
  label: string;
  field: MaterialSortBy;
  sortBy?: MaterialSortBy;
  sortOrder?: MaterialSortOrder;
  onSortChange: (sortBy: MaterialSortBy, sortOrder: MaterialSortOrder) => void;
  ariaLabel: string;
  align?: "left" | "right";
}) {
  const isActive = sortBy === field;
  const toggleSort = () => {
    onSortChange(field, isActive && sortOrder === "asc" ? "desc" : "asc");
  };
  return (
    <button
      type="button"
      onClick={toggleSort}
      aria-label={ariaLabel}
      className={cn(
        "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2",
        align === "right" && "ml-auto",
      )}
    >
      {label}
      {isActive ? (
        <ChevronDown
          className={cn("size-3.5", sortOrder === "asc" && "rotate-180")}
        />
      ) : (
        <ChevronsUpDown className="text-muted-foreground/60 size-3.5" />
      )}
    </button>
  );
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
  onViewStockBalance,
  detailHref,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: MaterialTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-3">
      <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="min-w-[320px] py-2.5">
                <SortableHeader
                  label="วัสดุ"
                  field="code"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามรหัสวัสดุ"
                />
              </TableHead>
              <TableHead className="w-[100px]">ประเภท</TableHead>
              <TableHead className="w-[140px]">ลักษณะวัสดุ</TableHead>
              <TableHead>ผู้ขาย</TableHead>
              <TableHead>
                <SortableHeader
                  label="สถานะ"
                  field="isActive"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามสถานะ"
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="อัปเดตล่าสุด"
                  field="updatedAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามวันที่อัปเดต"
                />
              </TableHead>
              <TableHead className="text-right">การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skel-${index}`} className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-2">
                    <Skeleton className="h-14 w-full" />
                  </TableCell>
                </TableRow>
              ))
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
              materials.map((material) => {
                const href = detailHref?.(material);
                const suppliers = supplierSummary(material);
                const imageUrl = resolveMaterialImage(material.imagePath);
                const actions: ActionItem[] = [
                  {
                    label: "ดูรายละเอียด",
                    icon: <Eye className="size-4" />,
                    hidden: !href,
                    onClick: () => href && router.push(href),
                  },
                  {
                    label: "แก้ไข",
                    icon: <Pencil className="size-4" />,
                    hidden: !onEdit,
                    onClick: () => onEdit?.(material),
                  },
                  {
                    label: "ดูสต็อก",
                    icon: <Scale className="size-4" />,
                    hidden: !onViewStockBalance,
                    onClick: () => onViewStockBalance?.(material),
                  },
                  {
                    label: material.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน",
                    icon: material.isActive ? (
                      <Power className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    ),
                    hidden: !onStatusChange,
                    variant: material.isActive ? "danger" : "default",
                    onClick: () => onStatusChange?.(material),
                  },
                ];
                return (
                  <TableRow
                    key={material.id}
                    data-testid={`material-row-${material.code}`}
                    className={cn(
                      "group transition-colors",
                      href && "hover:bg-muted/30 cursor-pointer",
                    )}
                    onClick={
                      href
                        ? (event) => {
                            // Don't navigate if the click came from a button/link
                            // inside the row — let those handlers run instead.
                            const target = event.target as HTMLElement;
                            if (target.closest("button, a")) return;
                            router.push(href);
                          }
                        : undefined
                    }
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail — 40px compact, no border-radius heavy */}
                        <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded">
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={`รูปวัสดุ ${material.code}`}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <ImageOff
                              className="text-muted-foreground/60 size-4"
                              aria-hidden="true"
                            />
                          )}
                          {/* Active dot — bottom-right corner */}
                          <span
                            className={cn(
                              "absolute right-0.5 bottom-0.5 size-2 rounded-full ring-[1.5px] ring-card",
                              material.isActive
                                ? "bg-emerald-500"
                                : "bg-slate-400",
                            )}
                            aria-label={material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                          />
                        </div>

                        {/* Content — single column, 2-line clamp */}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                          {/* Line 1: code (mono) + name */}
                          <div className="flex items-baseline gap-2">
                            <code className="text-primary shrink-0 font-mono text-[11px] font-semibold tracking-tight">
                              {material.code}
                            </code>
                            {material.unit && (
                              <>
                                <span className="bg-border/60 size-0.5 shrink-0 rounded-full" />
                                <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                                  {unitLabel(material)}
                                </span>
                              </>
                            )}
                            <span className="bg-border/60 size-0.5 shrink-0 rounded-full" />
                            <span
                              className="text-foreground truncate text-sm font-medium"
                              title={material.name}
                            >
                              {material.name}
                            </span>
                          </div>

                          {/* Line 2: meta — model • delivery (single inline string) */}
                          {(material.model?.nameTh || material.deliveryType?.nameTh) && (
                            <div className="text-muted-foreground flex items-center gap-1.5 truncate text-[11px]">
                              {material.model?.nameTh && (
                                <span className="truncate">
                                  <span className="text-muted-foreground/60">รุ่น</span>{" "}
                                  <span className="text-foreground/70 font-medium">
                                    {material.model.nameTh}
                                  </span>
                                </span>
                              )}
                              {material.model?.nameTh && material.deliveryType?.nameTh && (
                                <span
                                  className="bg-border/70 size-0.5 shrink-0 rounded-full"
                                  aria-hidden="true"
                                />
                              )}
                              {material.deliveryType?.nameTh && (
                                <span className="truncate">
                                  <span className="text-muted-foreground/60">จัดส่ง</span>{" "}
                                  <span className="text-foreground/70 font-medium">
                                    {material.deliveryType.nameTh}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {material.type ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                            getMaterialTypeColor(material.type),
                          )}
                        >
                          {getMaterialTypeLabel(material.type) ?? material.type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {material.materialType ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                            getMaterialShapeColor(material.materialType),
                          )}
                          title={
                            material.ratio
                              ? `1 เส้น/แผ่น/ม้วน แบ่งได้ ${material.ratio} ชิ้น`
                              : undefined
                          }
                        >
                          {getMaterialShapeLabel(material.materialType) ??
                            material.materialType}
                          {material.ratio != null && (
                            <span className="ml-0.5 rounded bg-white/40 px-1 text-[10px] font-semibold">
                              ×{material.ratio}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex max-w-[220px] flex-wrap items-center gap-1">
                        {material.suppliers.length > 0 ? (
                          <>
                            <Badge variant="muted" size="sm" className="max-w-[180px]">
                              <Store className="mr-1 size-2.5 shrink-0" />
                              <span className="truncate">{suppliers.text}</span>
                            </Badge>
                            {suppliers.overflow > 0 && (
                              <span className="text-muted-foreground shrink-0 text-xs">
                                +{suppliers.overflow}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={material.isActive ? "success" : "muted"}
                        className="gap-1"
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            material.isActive
                              ? "bg-success-foreground/80"
                              : "bg-muted-foreground/60",
                          )}
                        />
                        {material.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-foreground text-xs font-medium">
                        {formatDate(material.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <ActionMenu label={`จัดการวัสดุ ${material.code}`} items={actions} />
                    </TableCell>
                  </TableRow>
                );
              })
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
