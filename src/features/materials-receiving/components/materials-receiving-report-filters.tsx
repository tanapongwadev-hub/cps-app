"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
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
import type {
  ReportMaterialsReceivingFilters,
} from "../api/materials-receiving-report-api";

export interface MaterialsReceivingReportFiltersProps {
  filters: ReportMaterialsReceivingFilters;
  onFiltersChange: (filters: ReportMaterialsReceivingFilters) => void;
  suppliers?: { id: string; nameTh: string }[];
  materials?: { id: string; code: string; name: string }[];
  onSearch: () => void;
}

export function MaterialsReceivingReportFilters({
  filters,
  onFiltersChange,
  suppliers = [],
  materials = [],
  onSearch,
}: MaterialsReceivingReportFiltersProps) {
  const setStatus = React.useCallback(
    (status: string) => {
      onFiltersChange({
        ...filters,
        status: status === "all" ? undefined : status,
      });
    },
    [filters, onFiltersChange],
  );

  const setSupplier = React.useCallback(
    (supplierId: string) => {
      onFiltersChange({
        ...filters,
        supplierId: supplierId === "all" ? undefined : supplierId,
      });
    },
    [filters, onFiltersChange],
  );

  const setMaterial = React.useCallback(
    (materialId: string) => {
      onFiltersChange({
        ...filters,
        materialId: materialId === "all" ? undefined : materialId,
      });
    },
    [filters, onFiltersChange],
  );

  const setStartDate = React.useCallback(
    (date: string) => {
      onFiltersChange({ ...filters, startDate: date || undefined });
    },
    [filters, onFiltersChange],
  );

  const setEndDate = React.useCallback(
    (date: string) => {
      onFiltersChange({ ...filters, endDate: date || undefined });
    },
    [filters, onFiltersChange],
  );

  const handleReset = React.useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters =
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.status ||
    !!filters.supplierId ||
    !!filters.materialId;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 flex-wrap items-end gap-3">
        {/* Date Range */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">วันที่รับ:</span>
          <Input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-[150px]"
          />
          <span className="hidden text-muted-foreground sm:inline">—</span>
          <Input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-[150px]"
          />
        </div>

        {/* Status */}
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

        {/* Search button */}
        <Button onClick={onSearch} size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          ค้นหา
        </Button>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            ล้าง
          </Button>
        )}
      </div>
    </div>
  );
}
