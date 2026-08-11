"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";
import type { ListMaterialsReceivingParams } from "../api/materials-receiving-api";

export interface MaterialsReceivingFiltersProps {
  filters: ListMaterialsReceivingParams;
  onFiltersChange: (filters: ListMaterialsReceivingParams) => void;
  suppliers?: { id: string; nameTh: string }[];
  materials?: { id: string; code: string; name: string }[];
}

export function MaterialsReceivingFilters({
  filters,
  onFiltersChange,
  suppliers = [],
  materials = [],
}: MaterialsReceivingFiltersProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? "");
  const [lotValue, setLotValue] = React.useState(filters.internalLotNo ?? "");

  // Keep local inputs in sync when filters change externally
  React.useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);
  React.useEffect(() => {
    setLotValue(filters.internalLotNo ?? "");
  }, [filters.internalLotNo]);

  const applySearch = React.useCallback(() => {
    onFiltersChange({
      ...filters,
      search: searchValue || undefined,
      page: 1,
    });
  }, [filters, searchValue, onFiltersChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") applySearch();
    },
    [applySearch],
  );

  const clearSearch = React.useCallback(() => {
    setSearchValue("");
    onFiltersChange({ ...filters, search: undefined, page: 1 });
  }, [filters, onFiltersChange]);

  const applyLot = React.useCallback(() => {
    onFiltersChange({
      ...filters,
      internalLotNo: lotValue || undefined,
      page: 1,
    });
  }, [filters, lotValue, onFiltersChange]);

  const handleLotKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") applyLot();
    },
    [applyLot],
  );

  const clearLot = React.useCallback(() => {
    setLotValue("");
    onFiltersChange({ ...filters, internalLotNo: undefined, page: 1 });
  }, [filters, onFiltersChange]);

  const setStatus = React.useCallback(
    (status: string) => {
      onFiltersChange({
        ...filters,
        status:
          status === "all"
            ? undefined
            : (status as ListMaterialsReceivingParams["status"]),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setSupplier = React.useCallback(
    (supplierId: string) => {
      onFiltersChange({
        ...filters,
        supplierId: supplierId === "all" ? undefined : supplierId,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setMaterial = React.useCallback(
    (materialId: string) => {
      onFiltersChange({
        ...filters,
        materialId: materialId === "all" ? undefined : materialId,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setDateFrom = React.useCallback(
    (date: string) => {
      onFiltersChange({
        ...filters,
        receiveDateFrom: date || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setDateTo = React.useCallback(
    (date: string) => {
      onFiltersChange({
        ...filters,
        receiveDateTo: date || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setHasPackages = React.useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        hasPackages:
          value === "true" ? true : value === "false" ? false : undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleReset = React.useCallback(() => {
    setSearchValue("");
    setLotValue("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.internalLotNo ||
    !!filters.status ||
    !!filters.supplierId ||
    !!filters.materialId ||
    !!filters.receiveDateFrom ||
    !!filters.receiveDateTo ||
    filters.hasPackages !== undefined;

  // Advanced filters collapsed on mobile by default; expanded if any field is set
  const hasAdvancedFilters =
    !!filters.internalLotNo ||
    !!filters.supplierId ||
    !!filters.materialId ||
    !!filters.receiveDateFrom ||
    !!filters.receiveDateTo ||
    filters.hasPackages !== undefined;
  const [showAdvanced, setShowAdvanced] = React.useState(hasAdvancedFilters);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {/* Always-visible row: search + status + filter toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหา supplier lot, material code..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={applySearch}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status — always visible (most-used filter) */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={setStatus}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="draft">ฉบับร่าง</SelectItem>
            <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters toggle — always visible on mobile, hidden on desktop where everything fits */}
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="md:hidden"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          ตัวกรองเพิ่มเติม
          {hasAdvancedFilters && (
            <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Advanced filters row — hidden on mobile unless toggled; always visible on desktop */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          showAdvanced ? "flex" : "hidden md:flex",
        )}
      >
        {/* Internal Lot No filter */}
        <div className="relative w-full sm:w-[220px]">
          <Input
            placeholder="Internal Lot (CCI-YYYYMMDD-XXX)"
            value={lotValue}
            onChange={(e) => setLotValue(e.target.value.toUpperCase())}
            onKeyDown={handleLotKeyDown}
            onBlur={applyLot}
            className="pr-9 font-mono"
          />
          {lotValue && (
            <button
              type="button"
              onClick={clearLot}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Supplier */}
        <Select
          value={filters.supplierId ?? "all"}
          onValueChange={setSupplier}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="ผู้จัดจำหน่าย" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกผู้จัดจำหน่าย</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nameTh}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Material */}
        <Select
          value={filters.materialId ?? "all"}
          onValueChange={setMaterial}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="วัสดุ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกวัสดุ</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.code} — {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range — stacks on mobile, side-by-side on sm+ */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            type="date"
            value={filters.receiveDateFrom ?? ""}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[150px]"
            placeholder="จากวันที่"
          />
          <span className="hidden text-muted-foreground sm:inline">—</span>
          <Input
            type="date"
            value={filters.receiveDateTo ?? ""}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[150px]"
            placeholder="ถึงวันที่"
          />
        </div>

        {/* Has Packages */}
        <Select
          value={
            filters.hasPackages === true
              ? "true"
              : filters.hasPackages === false
                ? "false"
                : "all"
          }
          onValueChange={setHasPackages}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="บรรจุภัณฑ์" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="true">มีบรรจุภัณฑ์</SelectItem>
            <SelectItem value="false">ไม่มีบรรจุภัณฑ์</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
