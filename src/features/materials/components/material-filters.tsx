"use client";

import * as React from "react";
import { ChevronDown, FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListMaterialsParams, MaterialLookups } from "../api/materials-api";

export interface MaterialFiltersProps {
  value: ListMaterialsParams;
  lookups: MaterialLookups;
  onChange: (value: ListMaterialsParams) => void;
  debounceMs?: number;
}

function filterValue(value?: string): string {
  return value ?? "";
}

export function MaterialFilters({
  value,
  lookups,
  onChange,
  debounceMs = 300,
}: MaterialFiltersProps) {
  const [search, setSearch] = React.useState(value.search ?? "");
  const [showMore, setShowMore] = React.useState(false);
  const searchRef = React.useRef(value.search ?? "");

  React.useEffect(() => {
    const next = value.search ?? "";
    searchRef.current = next;
    setSearch(next);
  }, [value.search]);

  React.useEffect(() => {
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
  }, [debounceMs, onChange, search, value]);

  const update = <K extends keyof ListMaterialsParams>(
    key: K,
    next: ListMaterialsParams[K] | undefined,
  ) => {
    onChange({ ...value, page: 1, [key]: next === "" ? undefined : next });
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

  return (
    <section aria-label="ตัวกรองวัสดุ" className="bg-card space-y-3 rounded-lg border p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(16rem,1fr)_11rem_12rem_auto_auto] md:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="material-search">ค้นหาวัสดุ</Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="material-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหารหัสหรือชื่อวัสดุ"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="material-status-filter">สถานะ</Label>
          <select
            id="material-status-filter"
            value={value.isActive === undefined ? "all" : String(value.isActive)}
            onChange={(event) =>
              update(
                "isActive",
                event.target.value === "all" ? undefined : event.target.value === "true",
              )
            }
            className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="true">ใช้งาน</option>
            <option value="false">ปิดใช้งาน</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="material-type-filter">ประเภท</Label>
          <select
            id="material-type-filter"
            value={value.type ?? ""}
            onChange={(event) =>
              update("type", event.target.value || undefined)
            }
            className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
          >
            <option value="">ทุกประเภท</option>
            <option value="PC">PC (อะไหล่)</option>
            <option value="OF">OF (วัสดุโรงงาน)</option>
            <option value="OF_MAT">OF_MAT (วัตถุดิบ)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="material-unit-filter">หน่วย</Label>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMore((shown) => !shown)}
          aria-expanded={showMore}
          aria-controls="material-more-filters"
        >
          ตัวกรองเพิ่มเติม
          <ChevronDown className={showMore ? "size-4 rotate-180" : "size-4"} />
        </Button>
        <Button type="button" variant="ghost" onClick={clear}>
          <FilterX className="size-4" />
          ล้างตัวกรอง
        </Button>
      </div>

      {showMore && (
        <div
          id="material-more-filters"
          className="grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            ["modelId", "รุ่น", "material-model-filter", lookups.models],
            [
              "deliveryTypeId",
              "ประเภทการจัดส่ง",
              "material-delivery-filter",
              lookups.deliveryTypes,
            ],
            ["loadingPointId", "จุดรับสินค้า", "material-loading-filter", lookups.loadingPoints],
          ].map(([key, label, id, options]) => (
            <div key={String(key)} className="space-y-1.5">
              <Label htmlFor={String(id)}>{String(label)}</Label>
              <select
                id={String(id)}
                value={filterValue(value[key as "modelId" | "deliveryTypeId" | "loadingPointId"])}
                onChange={(event) =>
                  update(key as "modelId" | "deliveryTypeId" | "loadingPointId", event.target.value)
                }
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
              >
                <option value="">ทั้งหมด</option>
                {(options as MaterialLookups["models"]).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.code} — {option.nameTh}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="material-supplier-filter">ผู้ขาย</Label>
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
      )}
    </section>
  );
}
