"use client";

import * as React from "react";
import { CalendarDays, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportPeriod, UnifiedReportFilters } from "../api/materials-unified-report-api";

interface Props {
  filters: UnifiedReportFilters;
  onFiltersChange: (filters: UnifiedReportFilters) => void;
  materials?: { id: string; code: string; name: string }[];
  onSearch: () => void;
}

export function MaterialsUnifiedReportFilters({
  filters,
  onFiltersChange,
  materials = [],
  onSearch,
}: Props) {
  const isCustom = filters.period === undefined || filters.period === 'custom';

  const setPeriod = React.useCallback(
    (period: string) => {
      onFiltersChange({
        ...filters,
        period: period as ReportPeriod,
        // Clear custom dates when switching to a preset
        startDate: undefined,
        endDate: undefined,
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

  const setType = React.useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        type: type === "both" ? "both" : (type as "receive" | "disbursement"),
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

  const handleReset = React.useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters =
    !!filters.period ||
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.type ||
    !!filters.materialId;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 flex-wrap items-end gap-3">
        {/* Period quick-select */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground whitespace-nowrap">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            ช่วงเวลา:
          </span>
          {/* Quick period buttons */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: "today", label: "วันนี้" },
                { value: "this_month", label: "เดือนนี้" },
                { value: "this_year", label: "ปีนี้" },
                { value: "custom", label: "กำหนดเอง" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                variant={filters.period === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(opt.value)}
                className="h-8 px-3 text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Document type */}
        <Select
          value={filters.type ?? "both"}
          onValueChange={setType}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="ประเภทเอกสาร" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">ทั้งหมด</SelectItem>
            <SelectItem value="receive">เฉพาะรับเข้า</SelectItem>
            <SelectItem value="disbursement">เฉพาะจ่ายออก</SelectItem>
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

        {/* Search */}
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

      {/* Custom date range — only visible when "กำหนดเอง" */}
      {isCustom && (
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="text-sm text-muted-foreground whitespace-nowrap">วันที่เริ่ม:</span>
            <Input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[150px]"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">ถึง:</span>
            <Input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[150px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
