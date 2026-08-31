"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Car,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ImageOff,
  Plus,
  RotateCcw,
  Star,
  ToggleLeft,
} from "lucide-react";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
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
import { cn } from "@/utils/cn";
import type { ListProductsParams, Product } from "../api/products-api";
import { resolveProductImage } from "../utils";

type SortBy = NonNullable<ListProductsParams["sortBy"]>;
type SortOrder = NonNullable<ListProductsParams["sortOrder"]>;

interface ProductTableProps {
  products: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate?: () => void;
  onEdit?: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onGoToBom?: (product: Product) => void;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSortChange,
  ariaLabel,
}: {
  label: string;
  field: SortBy;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  ariaLabel: string;
}) {
  const active = sortBy === field;
  const nextOrder: SortOrder = active && sortOrder === "asc" ? "desc" : "asc";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onSortChange(field, nextOrder)}
      className="hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2"
    >
      {label}
      {active && sortOrder === "desc" ? (
        <ArrowDown className="text-primary size-3" />
      ) : (
        <ArrowUp className={cn("size-3", active ? "text-primary" : "text-muted-foreground/30")} />
      )}
    </button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));
}

export function ProductTable({
  products,
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
  onStatusChange,
  onGoToBom,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: ProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div data-testid="product-table-root" className="max-w-full min-w-0 space-y-3">
      <div className="bg-card max-w-full min-w-0 overflow-hidden rounded-lg border shadow-xs">
        <Table className="table-fixed sm:min-w-[760px] sm:table-auto">
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="w-auto min-w-0 px-2 py-2.5 sm:w-[260px] sm:min-w-[260px] sm:px-3">
                <SortableHeader
                  label="สินค้า"
                  field="code"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามรหัสสินค้า"
                />
              </TableHead>
              <TableHead className="hidden w-[120px] sm:table-cell">ประเภท</TableHead>
              <TableHead className="hidden w-[135px] md:table-cell">การผลิต</TableHead>
              <TableHead className="w-[76px] px-1 text-center sm:w-[96px] sm:px-3">ขั้นต่ำ</TableHead>
              <TableHead className="hidden w-[78px] sm:table-cell">
                <SortableHeader
                  label="สถานะ"
                  field="isActive"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามสถานะ"
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortableHeader
                  label="อัปเดต"
                  field="updatedAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={onSortChange}
                  ariaLabel="เรียงตามวันที่อัปเดต"
                />
              </TableHead>
              <TableHead className="w-12 px-1 text-right sm:w-10 sm:px-3">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-2">
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-danger text-sm font-medium">โหลดรายการสินค้าไม่สำเร็จ</p>
                  <p className="text-muted-foreground mt-1 text-xs">ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
                  <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-3">
                    ลองใหม่
                  </Button>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={<Car className="text-muted-foreground/50 size-8" />}
                    title="ยังไม่มีข้อมูลสินค้า"
                    description="เริ่มต้นโดยการเพิ่มสินค้ารายการแรก"
                    action={
                      onCreate ? (
                        <Button type="button" onClick={onCreate}>
                          <Plus className="size-4" />
                          เพิ่มสินค้า
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onGoToBom={onGoToBom}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !isError && totalItems > 0 && (
        <div className="text-muted-foreground flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm">{start}–{end} จาก {totalItems}</span>
            <label className="flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline">จำนวนต่อหน้า</span>
              <span className="text-xs sm:hidden">/หน้า</span>
              <select
                aria-label="จำนวนต่อหน้า"
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="border-input bg-background text-foreground focus-visible:ring-ring h-8 rounded-md border px-2 text-xs outline-none focus-visible:ring-2 sm:text-sm"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="size-4" />
              ก่อนหน้า
            </Button>
            <span className="min-w-20 text-center">หน้า {page} / {totalPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="หน้าถัดไป"
            >
              ถัดไป
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onStatusChange,
  onGoToBom,
}: {
  product: Product;
  onEdit?: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onGoToBom?: (product: Product) => void;
}) {
  const imageUrl = resolveProductImage(product.productImagePath);
  const actions: ActionItem<Product>[] = [
    {
      label: "BOM",
      icon: <Star className="mr-2 size-3.5" />,
      onClick: (item) => onGoToBom?.(item),
      hidden: !onGoToBom,
    },
    {
      label: "แก้ไข",
      icon: <Edit2 className="mr-2 size-3.5" />,
      onClick: (item) => onEdit?.(item),
      hidden: !onEdit,
    },
    {
      label: product.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน",
      icon: product.isActive ? <ToggleLeft className="mr-2 size-3.5" /> : <RotateCcw className="mr-2 size-3.5" />,
      onClick: (item) => onStatusChange?.(item),
      hidden: !onStatusChange,
      variant: product.isActive ? "danger" : "default",
    },
  ];

  return (
    <TableRow data-testid={`product-row-${product.code}`} className={cn("group", !product.isActive && "opacity-65")}>
      <TableCell className="min-w-0 px-2 py-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-muted/40 relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {imageUrl ? (
              <Image src={imageUrl} alt={`รูปสินค้า ${product.code}`} fill sizes="44px" className="object-cover" />
            ) : (
              <span aria-label={`ไม่มีรูปสินค้า ${product.code}`}>
                <ImageOff className="text-muted-foreground/60 size-4" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-baseline gap-1.5">
              <code className="text-primary shrink-0 font-mono text-[10px] font-semibold sm:text-[11px]">{product.code}</code>
              {product.unit && <span className="text-muted-foreground shrink-0 font-mono text-[10px]">{product.unit.code}</span>}
              <span className="truncate text-xs font-medium sm:text-sm" title={product.name}>{product.name}</span>
            </div>
            <p className="text-muted-foreground mt-1 hidden truncate text-[11px] sm:block">
              {product.model?.nameTh ?? "ไม่ระบุรุ่น"} · {product.customer?.nameTh ?? "ไม่ระบุลูกค้า"}
            </p>
            <Badge
              data-testid="product-mobile-status"
              variant={product.isActive ? "success" : "muted"}
              className="mt-1 w-fit gap-1 px-1.5 text-[10px] sm:hidden"
            >
              <span className={cn("size-1.5 rounded-full", product.isActive ? "bg-success-foreground/80" : "bg-muted-foreground/60")} />
              {product.isActive ? "ใช้งาน" : "ปิด"}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden py-2 sm:table-cell">
        {product.productType ? (
          <Badge variant="outline" className="max-w-[110px] text-xs">
            <span className="truncate">{product.productType.nameTh || product.productType.code}</span>
          </Badge>
        ) : <span className="text-muted-foreground text-xs">—</span>}
      </TableCell>
      <TableCell className="hidden py-2 md:table-cell">
        <div className="space-y-0.5 text-xs">
          <p><span className="text-muted-foreground">Lot</span> <span className="font-mono font-semibold">{product.lotSize}</span></p>
          <p><span className="text-muted-foreground">Pack</span> <span className="font-mono font-semibold">{product.packing}</span></p>
        </div>
      </TableCell>
      <TableCell className="px-1 py-2 text-center sm:px-3">
        <div className="inline-flex flex-col rounded-md border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] sm:text-xs">
          <span className="font-semibold">S {product.safetyStock}</span>
          <span className="text-muted-foreground">M {product.minStock}</span>
        </div>
      </TableCell>
      <TableCell className="hidden py-2 sm:table-cell">
        <Badge variant={product.isActive ? "success" : "muted"} className="gap-1 px-1.5 text-[10px] sm:text-xs">
          <span className={cn("size-1.5 rounded-full", product.isActive ? "bg-success-foreground/80" : "bg-muted-foreground/60")} />
          {product.isActive ? "ใช้งาน" : "ปิด"}
        </Badge>
      </TableCell>
      <TableCell className="hidden py-2 lg:table-cell">
        <span className="text-foreground text-xs font-medium">{formatDate(product.updatedAt)}</span>
        <p className="text-muted-foreground mt-0.5 max-w-[160px] truncate text-[10px]">{product.location?.nameTh ?? "—"}</p>
      </TableCell>
      <TableCell className="w-12 px-1 py-2 text-right sm:w-10 sm:px-3">
        <ActionMenu row={product} label={`จัดการสินค้า ${product.code}`} items={actions} />
      </TableCell>
    </TableRow>
  );
}
