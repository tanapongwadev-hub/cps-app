"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Filter,
  FilterX,
  Package,
  Search,
  Settings2,
  Store,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { getMaterialTypeLabel, getMaterialShapeLabel } from "../utils";
import type {
  ListMaterialsParams,
  MaterialLookups,
  MaterialShape,
} from "../api/materials-api";

export interface MaterialFiltersProps {
  value: ListMaterialsParams;
  lookups: MaterialLookups;
  onChange: (value: ListMaterialsParams) => void;
  debounceMs?: number;
}

function filterValue(value?: string): string {
  return value ?? "";
}

const TYPE_FILTERS: { value: "" | "PC" | "OF" | "OF_MAT"; color: string }[] = [
  { value: "", color: "bg-muted text-foreground" },
  { value: "PC", color: "bg-[#8B0000] text-white" },
  { value: "OF", color: "bg-emerald-700 text-white" },
  { value: "OF_MAT", color: "bg-blue-600 text-white" },
];

const MATERIAL_SHAPE_FILTERS: {
  value: "" | MaterialShape;
  color: string;
}[] = [
  { value: "", color: "bg-muted text-foreground" },
  { value: "PCS", color: "bg-slate-200 text-slate-800 border-slate-300" },
  { value: "PIPE", color: "bg-amber-200 text-amber-900 border-amber-300" },
  { value: "SHEET", color: "bg-sky-200 text-sky-900 border-sky-300" },
  { value: "COIL", color: "bg-violet-200 text-violet-900 border-violet-300" },
];

const STATUS_FILTERS: { value: "all" | "true" | "false"; label: string; color: string }[] = [
  { value: "all", label: "ทั้งหมด", color: "bg-muted text-foreground" },
  { value: "true", label: "ใช้งาน", color: "bg-success text-white" },
  { value: "false", label: "ปิดใช้งาน", color: "bg-muted-foreground text-white" },
];

export function MaterialFilters({
  value,
  lookups,
  onChange,
  debounceMs = 300,
}: MaterialFiltersProps) {
  const [search, setSearch] = useState(value.search ?? "");
  const searchRef = useRef(value.search ?? "");

  // Keep local search in sync with controlled value
  useEffect(() => {
    const next = value.search ?? "";
    if (searchRef.current !== next) {
      searchRef.current = next;
      setSearch(next);
    }
  }, [value.search]);

  // Debounce search input → onChange
  useEffect(() => {
    const normalized = search.trim();
    if (normalized === searchRef.current) return;
    const timer = window.setTimeout(() => {
      searchRef.current = normalized;
      onChange({
        ...value,
        page: 1,
        search: normalized || undefined,
      });
    }, debounceMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, debounceMs]);

  const update = <K extends keyof ListMaterialsParams>(
    key: K,
    next: ListMaterialsParams[K] | undefined,
  ) => {
    onChange({ ...value, page: 1, [key]: next === "" ? undefined : next });
  };

  const setType = (type: "" | "PC" | "OF" | "OF_MAT") => {
    onChange({ ...value, page: 1, type: type === "" ? undefined : type });
  };

  const setMaterialType = (shape: "" | MaterialShape) => {
    onChange({
      ...value,
      page: 1,
      materialType: shape === "" ? undefined : shape,
    });
  };

  const setStatus = (status: "all" | "true" | "false") => {
    onChange({
      ...value,
      page: 1,
      isActive: status === "all" ? undefined : status === "true",
    });
  };

  const clear = () => {
    searchRef.current = "";
    setSearch("");
    onChange({
      page: 1,
      pageSize: value.pageSize,
      sortBy: value.sortBy,
      sortOrder: value.sortOrder,
    });
  };

  // Active filter count
  const activeCount = [
    value.search,
    value.type,
    value.materialType,
    value.isActive !== undefined ? "status" : undefined,
    value.unitId,
    value.modelId,
    value.deliveryTypeId,
    value.loadingPointId,
    value.supplierId,
  ].filter(Boolean).length;

  return (
    <section
      aria-label="ตัวกรองวัสดุ"
      className="bg-card space-y-4 rounded-xl border p-4 shadow-sm"
    >
      {/* ===== Search Row ===== */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            id="material-search"
            type="search"
            aria-label="ค้นหาวัสดุ"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหารหัสหรือชื่อวัสดุ..."
            className="h-11 border-border/60 bg-muted/30 pl-10 pr-4 text-sm shadow-xs focus-visible:bg-background"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeCount > 0 && (
            <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-xs">
              <Filter className="size-3" />
              {activeCount} ตัวกรอง
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={activeCount === 0}
            className="h-9"
          >
            <FilterX className="size-4" />
            ล้างตัวกรอง
          </Button>
        </div>
      </div>

      {/* ===== Quick Filters: Type + Material Shape + Status ===== */}
      <div className="space-y-3">
        {/* Type Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Tag className="size-3.5" />
            ประเภท:
          </span>
          {TYPE_FILTERS.map((f) => {
            const currentType = (value.type ?? "") as "" | "PC" | "OF" | "OF_MAT";
            const isActive = currentType === f.value;
            const label = f.value ? getMaterialTypeLabel(f.value) ?? f.value : "ทั้งหมด";
            return (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setType(f.value)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  isActive
                    ? cn(f.color, "border-transparent shadow-sm")
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Material Shape Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Package className="size-3.5" />
            ลักษณะวัสดุ:
          </span>
          {MATERIAL_SHAPE_FILTERS.map((f) => {
            const currentShape = (value.materialType ?? "") as "" | MaterialShape;
            const isActive = currentShape === f.value;
            const label = f.value
              ? getMaterialShapeLabel(f.value) ?? f.value
              : "ทั้งหมด";
            return (
              <button
                key={f.value || "all-shapes"}
                type="button"
                onClick={() => setMaterialType(f.value)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  isActive
                    ? cn(f.color, "border-transparent shadow-sm")
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <span className="bg-muted-foreground/30 inline-block size-2 rounded-full" />
            สถานะ:
          </span>
          {STATUS_FILTERS.map((f) => {
            const currentStatus =
              value.isActive === undefined ? "all" : String(value.isActive);
            const isActive = currentStatus === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  isActive
                    ? cn(f.color, "border-transparent shadow-sm")
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Advanced Filters (Popover) ===== */}
      <div className="flex items-center justify-between border-t pt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5">
              <Settings2 className="size-4" />
              ตัวกรองขั้นสูง
              {(value.unitId || value.modelId || value.deliveryTypeId || value.loadingPointId || value.supplierId) && (
                <Badge
                  variant="default"
                  className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px]"
                >
                  {
                    [value.unitId, value.modelId, value.deliveryTypeId, value.loadingPointId, value.supplierId]
                      .filter(Boolean).length
                  }
                </Badge>
              )}
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[420px] p-0">
            <div className="space-y-1 border-b px-4 py-3">
              <h4 className="text-sm font-semibold">ตัวกรองขั้นสูง</h4>
              <p className="text-muted-foreground text-xs">กรองตามคุณสมบัติเพิ่มเติม</p>
            </div>
            <div className="grid gap-3 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="material-unit-filter" className="flex items-center gap-1.5 text-xs">
                  <Package className="size-3" />
                  หน่วย
                </Label>
                <select
                  id="material-unit-filter"
                  value={filterValue(value.unitId)}
                  onChange={(event) => update("unitId", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                >
                  <option value="">ทุกหน่วย</option>
                  {lookups.units.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.code} — {option.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="material-model-filter" className="flex items-center gap-1.5 text-xs">
                  <Tag className="size-3" />
                  รุ่น
                </Label>
                <select
                  id="material-model-filter"
                  value={filterValue(value.modelId)}
                  onChange={(event) => update("modelId", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                >
                  <option value="">ทุกรุ่น</option>
                  {lookups.models.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.code} — {option.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="material-delivery-filter"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Truck className="size-3" />
                  การจัดส่ง
                </Label>
                <select
                  id="material-delivery-filter"
                  value={filterValue(value.deliveryTypeId)}
                  onChange={(event) => update("deliveryTypeId", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                >
                  <option value="">ทุกประเภทจัดส่ง</option>
                  {lookups.deliveryTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.code} — {option.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="material-loading-filter"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Warehouse className="size-3" />
                  จุดรับสินค้า
                </Label>
                <select
                  id="material-loading-filter"
                  value={filterValue(value.loadingPointId)}
                  onChange={(event) => update("loadingPointId", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                >
                  <option value="">ทุกจุดรับสินค้า</option>
                  {lookups.loadingPoints.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.code} — {option.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="material-supplier-filter"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Store className="size-3" />
                  ผู้ขาย
                </Label>
                <select
                  id="material-supplier-filter"
                  value={filterValue(value.supplierId)}
                  onChange={(event) => update("supplierId", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                >
                  <option value="">ผู้ขายทั้งหมด</option>
                  {lookups.suppliers
                    .filter((supplier) => supplier.isActive)
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.code} — {supplier.nameTh}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active advanced filter chips */}
        {(value.unitId || value.modelId || value.deliveryTypeId || value.loadingPointId || value.supplierId) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {value.unitId && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                <Package className="size-3" />
                {lookups.units.find((u) => u.id === value.unitId)?.nameTh}
                <button
                  type="button"
                  onClick={() => update("unitId", undefined)}
                  className="hover:text-danger ml-0.5"
                  aria-label="ลบตัวกรองหน่วย"
                >
                  ×
                </button>
              </Badge>
            )}
            {value.modelId && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                <Tag className="size-3" />
                {lookups.models.find((m) => m.id === value.modelId)?.nameTh}
                <button
                  type="button"
                  onClick={() => update("modelId", undefined)}
                  className="hover:text-danger ml-0.5"
                  aria-label="ลบตัวกรองรุ่น"
                >
                  ×
                </button>
              </Badge>
            )}
            {value.deliveryTypeId && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                <Truck className="size-3" />
                {lookups.deliveryTypes.find((d) => d.id === value.deliveryTypeId)?.nameTh}
                <button
                  type="button"
                  onClick={() => update("deliveryTypeId", undefined)}
                  className="hover:text-danger ml-0.5"
                  aria-label="ลบตัวกรองการจัดส่ง"
                >
                  ×
                </button>
              </Badge>
            )}
            {value.loadingPointId && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                <Warehouse className="size-3" />
                {lookups.loadingPoints.find((l) => l.id === value.loadingPointId)?.nameTh}
                <button
                  type="button"
                  onClick={() => update("loadingPointId", undefined)}
                  className="hover:text-danger ml-0.5"
                  aria-label="ลบตัวกรองจุดรับสินค้า"
                >
                  ×
                </button>
              </Badge>
            )}
            {value.supplierId && (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                <Store className="size-3" />
                {lookups.suppliers.find((s) => s.id === value.supplierId)?.nameTh}
                <button
                  type="button"
                  onClick={() => update("supplierId", undefined)}
                  className="hover:text-danger ml-0.5"
                  aria-label="ลบตัวกรองผู้ขาย"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
