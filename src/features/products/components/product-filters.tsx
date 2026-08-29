"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ListProductsParams, ProductLookups } from "../api/products-api";

interface ProductFiltersProps {
  value: ListProductsParams;
  lookups: ProductLookups;
  onChange: (filters: ListProductsParams) => void;
}

export function ProductFilters({ value, lookups, onChange }: ProductFiltersProps) {
  const activeCount = [
    value.search,
    value.isActive !== undefined,
    value.productTypeId,
    value.modelId,
    value.customerId,
    value.locationId,
    value.processLineId,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<ListProductsParams>) => {
    onChange({ ...value, ...patch });
  };

  const handleClear = () => {
    onChange({});
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
        <Input
          value={value.search ?? ""}
          onChange={(e) => handleChange({ search: e.target.value })}
          placeholder="ค้นหารหัสสินค้า, ชื่อ, โมเดล, ลูกค้า..."
          className="pl-8 h-8 text-sm"
        />
        {value.search && (
          <button
            onClick={() => handleChange({ search: undefined })}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Product Type */}
        <div className="space-y-1">
          <Label className="text-xs">ประเภทสินค้า</Label>
          <Select
            value={value.productTypeId ?? "all"}
            onValueChange={(v) =>
              handleChange({ productTypeId: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {lookups.productTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id}>
                  {pt.nameTh} ({pt.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Model */}
        <div className="space-y-1">
          <Label className="text-xs">โมเดล</Label>
          <Select
            value={value.modelId ?? "all"}
            onValueChange={(v) => handleChange({ modelId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {lookups.productModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <Label className="text-xs">ลูกค้า</Label>
          <Select
            value={value.customerId ?? "all"}
            onValueChange={(v) => handleChange({ customerId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {lookups.customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1">
          <Label className="text-xs">คลัง</Label>
          <Select
            value={value.locationId ?? "all"}
            onValueChange={(v) => handleChange({ locationId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {lookups.locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Process Line */}
        <div className="space-y-1">
          <Label className="text-xs">สายการผลิต</Label>
          <Select
            value={value.processLineId ?? "all"}
            onValueChange={(v) => handleChange({ processLineId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {lookups.processLines.map((pl) => (
                <SelectItem key={pl.id} value={pl.id}>
                  {pl.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Status */}
        <div className="space-y-1">
          <Label className="text-xs">สถานะ</Label>
          <Select
            value={
              value.isActive === undefined
                ? "all"
                : value.isActive
                  ? "active"
                  : "inactive"
            }
            onValueChange={(v) => {
              if (v === "all") handleChange({ isActive: undefined });
              else if (v === "active") handleChange({ isActive: true });
              else handleChange({ isActive: false });
            }}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="active">ใช้งาน</SelectItem>
              <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs gap-1">
            <X className="size-3" />
            ล้างตัวกรอง
            <Badge variant="secondary" className="ml-0.5 text-[10px]">{activeCount}</Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
