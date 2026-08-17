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
import type { ListMaterialsDisbursementParams } from "../api/materials-disbursement-api";

export interface MaterialsDisbursementFiltersProps {
  filters: ListMaterialsDisbursementParams;
  onFiltersChange: (filters: ListMaterialsDisbursementParams) => void;
  disbursementTypes?: { value: string; label: string }[];
}

export function MaterialsDisbursementFilters({
  filters,
  onFiltersChange,
  disbursementTypes = [],
}: MaterialsDisbursementFiltersProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? "");

  React.useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const applySearch = React.useCallback(() => {
    onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 });
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

  const setStatus = React.useCallback(
    (status: string) => {
      onFiltersChange({
        ...filters,
        status:
          status === "all"
            ? undefined
            : (status as ListMaterialsDisbursementParams["status"]),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setDisbursementType = React.useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        disbursementType:
          type === "all"
            ? undefined
            : (type as ListMaterialsDisbursementParams["disbursementType"]),
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setDateFrom = React.useCallback(
    (date: string) => {
      onFiltersChange({
        ...filters,
        disbursementDateFrom: date || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const setDateTo = React.useCallback(
    (date: string) => {
      onFiltersChange({
        ...filters,
        disbursementDateTo: date || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const handleReset = React.useCallback(() => {
    setSearchValue("");
    onFiltersChange({ page: 1, pageSize: filters.pageSize });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.status ||
    !!filters.disbursementType ||
    !!filters.disbursementDateFrom ||
    !!filters.disbursementDateTo;

  const hasAdvancedFilters =
    !!filters.disbursementType ||
    !!filters.disbursementDateFrom ||
    !!filters.disbursementDateTo;
  const [showAdvanced, setShowAdvanced] = React.useState(hasAdvancedFilters);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      {/* Main row: search + status + filter toggle */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="relative min-w-0 basis-full flex-1 sm:min-w-[200px] sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขที่ใบจ่ายออก, วัสดุ..."
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

        {/* Advanced filters toggle */}
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full justify-center sm:w-auto md:hidden"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full justify-center sm:w-auto"
          >
            <X className="h-4 w-4 mr-1" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-3",
          showAdvanced ? "flex" : "hidden md:flex",
        )}
      >
        {/* Disbursement Type */}
        <Select
          value={filters.disbursementType ?? "all"}
          onValueChange={setDisbursementType}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="ประเภทการจ่าย" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {disbursementTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            type="date"
            value={filters.disbursementDateFrom ?? ""}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[150px]"
            placeholder="จากวันที่"
          />
          <span className="hidden text-muted-foreground sm:inline">—</span>
          <Input
            type="date"
            value={filters.disbursementDateTo ?? ""}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[150px]"
            placeholder="ถึงวันที่"
          />
        </div>
      </div>
    </div>
  );
}
