"use client";

import * as React from "react";
import Image from "next/image";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ImageOff,
  Maximize2,
  Package,
  Plus,
  RotateCcw,
  Star,
  ToggleLeft,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import type { Product } from "../api/products-api";
import { resolveProductImage } from "../utils";

interface ProductCardGridProps {
  products: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate?: () => void;
  onEdit?: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onGoToBom?: (product: Product) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function unitLabel(product: Product) {
  return product.unit?.code ?? "—";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));
}

export function ProductCardGrid({
  products,
  page,
  pageSize,
  totalItems,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onStatusChange,
  onGoToBom,
  onPageChange,
  onPageSizeChange,
}: ProductCardGridProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const [preview, setPreview] = React.useState<{
    url: string;
    code: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      {isError ? (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-lg">
              <Package className="size-5" />
            </div>
            <p className="text-danger font-semibold">โหลดรายการสินค้าไม่สำเร็จ</p>
            <p className="text-muted-foreground text-sm">ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              ลองใหม่
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="กำลังโหลดรายการสินค้า"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span className="sr-only">กำลังโหลดรายการสินค้า</span>
          {Array.from({ length: Math.max(pageSize, 8) }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-border/60">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <CardContent className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPreview={setPreview}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onGoToBom={onGoToBom}
            />
          ))}
        </div>
      )}

      {!isError && !isLoading && totalItems > 0 && (
        <div className="flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground flex flex-wrap items-center gap-3">
            <span>แสดง {start}–{end} จาก {totalItems} รายการ</span>
            <label className="flex items-center gap-2">
              จำนวนต่อหน้า
              <select
                aria-label="จำนวนต่อหน้า"
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="border-input bg-background text-foreground focus-visible:ring-ring h-8 rounded-md border px-2 outline-none focus-visible:ring-2"
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
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="size-4" />
              ก่อนหน้า
            </Button>
            <span className="text-muted-foreground min-w-20 text-center">
              หน้า {page} / {totalPages}
            </span>
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

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 sm:max-w-5xl">
          <DialogTitle className="sr-only">
            {preview ? `รูป ${preview.code} - ${preview.name}` : "รูปสินค้า"}
          </DialogTitle>
          <div className="bg-muted relative flex max-h-[85vh] items-center justify-center overflow-hidden p-4">
            {preview && (
              <Image
                src={preview.url}
                alt={`รูปสินค้า ${preview.code}`}
                width={1600}
                height={1600}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            )}
          </div>
          {preview && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <div className="min-w-0">
                <p className="text-primary font-mono text-xs font-semibold">{preview.code}</p>
                <p className="truncate text-sm font-medium">{preview.name}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
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

function ProductCard({
  product,
  onPreview,
  onEdit,
  onStatusChange,
  onGoToBom,
}: {
  product: Product;
  onPreview: (preview: { url: string; code: string; name: string }) => void;
  onEdit?: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onGoToBom?: (product: Product) => void;
}) {
  const imageUrl = resolveProductImage(product.productImagePath);

  return (
    <Card
      data-testid={`product-card-${product.code}`}
      className={cn(
        "group relative flex flex-col overflow-hidden border-border/60 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        !product.isActive && "opacity-65",
      )}
    >
      <div className="group/image relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`รูปสินค้า ${product.code}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover/image:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
            <div className="bg-muted/60 flex size-12 items-center justify-center rounded-lg">
              <ImageOff className="size-5" />
            </div>
            <span className="text-xs">ไม่มีรูป</span>
          </div>
        )}

        {imageUrl && (
          <button
            type="button"
            onClick={() => onPreview({ url: imageUrl, code: product.code, name: product.name })}
            aria-label={`ขยายรูป ${product.code}`}
            className="bg-background/90 hover:bg-primary absolute bottom-2 right-2 z-10 flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:text-primary-foreground"
          >
            <Maximize2 className="size-3.5" />
          </button>
        )}

        {product.productType && (
          <Badge className="absolute left-2 top-2 max-w-[65%] shadow-sm" variant="default">
            <span className="truncate">{product.productType.nameTh || product.productType.code}</span>
          </Badge>
        )}
        <Badge
          className="absolute right-2 top-2 gap-1 shadow-sm"
          variant={product.isActive ? "success" : "muted"}
        >
          <span className={cn("size-1.5 rounded-full", product.isActive ? "bg-success-foreground/80" : "bg-muted-foreground/60")} />
          {product.isActive ? "ใช้งาน" : "ปิด"}
        </Badge>
        {product.unit && (
          <span className="bg-background/95 absolute bottom-2 left-2 rounded-md border px-2 py-0.5 font-mono text-xs font-medium shadow-sm backdrop-blur-sm">
            {unitLabel(product)}
          </span>
        )}

        <div className="absolute right-2 top-10 flex translate-y-1 items-center gap-1.5 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
          {onGoToBom && (
            <QuickAction label={`BOM ${product.code}`} onClick={() => onGoToBom(product)}>
              <Star className="size-3.5" />
            </QuickAction>
          )}
          {onEdit && (
            <QuickAction label={`แก้ไข ${product.code}`} onClick={() => onEdit(product)}>
              <Edit2 className="size-3.5" />
            </QuickAction>
          )}
          {onStatusChange && (
            <QuickAction
              label={`${product.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"} ${product.code}`}
              onClick={() => onStatusChange(product)}
              danger={product.isActive}
            >
              {product.isActive ? <ToggleLeft className="size-3.5" /> : <RotateCcw className="size-3.5" />}
            </QuickAction>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-3">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <code className="text-primary font-mono text-xs font-semibold">{product.code}</code>
            <span className="text-muted-foreground text-[10px]">อัปเดต {formatDate(product.updatedAt)}</span>
          </div>
          <h2 className="mt-0.5 truncate text-sm font-semibold" title={product.name}>{product.name}</h2>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {product.model?.nameTh ?? "ไม่ระบุรุ่น"} · {product.customer?.nameTh ?? "ไม่ระบุลูกค้า"}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {product.location?.nameTh ?? "ไม่ระบุคลัง"}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 border-t pt-3 text-center">
          {[
            ["Lot", product.lotSize],
            ["Pack", product.packing],
            ["Safety", product.safetyStock],
            ["Min", product.minStock],
          ].map(([label, value]) => (
            <div key={label} className="bg-muted/50 min-w-0 rounded-md px-1 py-1.5">
              <p className="text-muted-foreground truncate text-[10px] uppercase tracking-wide">{label}</p>
              <p className="truncate font-mono text-xs font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-2">
          {onGoToBom ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onGoToBom(product)} aria-label={`BOM ${product.code}`}>
              <Star className="size-3.5" />
              BOM
            </Button>
          ) : <span />}
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => onEdit(product)} aria-label={`แก้ไข ${product.code}`}>
                <Edit2 className="size-3.5" />
              </Button>
            )}
            {onStatusChange && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("size-7", product.isActive ? "text-danger" : "text-success")}
                onClick={() => onStatusChange(product)}
                aria-label={`${product.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"} ${product.code}`}
              >
                {product.isActive ? <ToggleLeft className="size-3.5" /> : <RotateCcw className="size-3.5" />}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "bg-background/95 flex size-7 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-colors",
        danger ? "text-danger hover:bg-danger hover:text-white" : "text-muted-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}
