"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListGoodsReceiptsParams } from "../api/goods-receipts-api";

export interface GoodsReceiptFiltersProps {
  filters: ListGoodsReceiptsParams;
  onFiltersChange: (filters: ListGoodsReceiptsParams) => void;
  suppliers?: { id: string; nameTh: string }[];
}

export function GoodsReceiptFilters({
  filters,
  onFiltersChange,
  suppliers = [],
}: GoodsReceiptFiltersProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search ?? "");

  const handleSearch = React.useCallback(() => {
    onFiltersChange({
      ...filters,
      search: searchValue || undefined,
      page: 1,
    });
  }, [filters, searchValue, onFiltersChange]);

  const handleSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchValue("");
    onFiltersChange({ ...filters, search: undefined, page: 1 });
  }, [filters, onFiltersChange]);

  const handleStatusChange = React.useCallback(
    (status: string) => {
      onFiltersChange({
        ...filters,
        status: status === "all" ? undefined : (status as ListGoodsReceiptsParams["status"]),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSupplierChange = React.useCallback(
    (supplierId: string) => {
      onFiltersChange({
        ...filters,
        supplierId: supplierId === "all" ? undefined : supplierId,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateFromChange = React.useCallback(
    (dateFrom: string) => {
      onFiltersChange({
        ...filters,
        receiptDateFrom: dateFrom || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateToChange = React.useCallback(
    (dateTo: string) => {
      onFiltersChange({
        ...filters,
        receiptDateTo: dateTo || undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleHasRejectionChange = React.useCallback(
    (hasRejection: string) => {
      onFiltersChange({
        ...filters,
        hasRejection: hasRejection === "true" ? true : hasRejection === "false" ? false : undefined,
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleReset = React.useCallback(() => {
    setSearchValue("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.supplierId ||
    filters.receiptDateFrom ||
    filters.receiptDateTo ||
    filters.hasRejection !== undefined;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขที่ใบรับ, ใบส่งของ..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="draft">ฉบับร่าง</SelectItem>
            <SelectItem value="posted">รับแล้ว</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>

        {/* Supplier */}
        <Select
          value={filters.supplierId ?? "all"}
          onValueChange={handleSupplierChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ผู้จัดจำหน่าย" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกผู้จัดจำหน่าย</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.nameTh}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.receiptDateFrom ?? ""}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="w-[150px]"
            placeholder="จากวันที่"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={filters.receiptDateTo ?? ""}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="w-[150px]"
            placeholder="ถึงวันที่"
          />
        </div>

        {/* Has Rejection */}
        <Select
          value={
            filters.hasRejection === true
              ? "true"
              : filters.hasRejection === false
              ? "false"
              : "all"
          }
          onValueChange={handleHasRejectionChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="การปฏิเสธ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="true">มีการปฏิเสธ</SelectItem>
            <SelectItem value="false">ไม่มีการปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  );
}
