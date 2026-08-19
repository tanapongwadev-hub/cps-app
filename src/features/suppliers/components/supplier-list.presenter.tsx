/**
 * SupplierList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, Truck } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SupplierTable } from "./supplier-table";
import { SupplierFilters } from "./supplier-filters";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { SupplierStatusDialog } from "./supplier-status-dialog";
import type { Supplier } from "../api/suppliers-api";
import type { SupplierFormValues } from "../schemas/supplier-schema";

// ============================================================================
// Props Types
// ============================================================================

export interface SupplierListPresenterProps {
  // Data
  items: Supplier[];
  totalItems: number;
  totalPages: number;
  
  // State
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: Supplier | null;
  statusChange: Supplier | null;
  
  // Loading states
  isLoading: boolean;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDeactivatePending: boolean;
  isRestorePending: boolean;
  
  // Permission
  canCreate: boolean;
  
  // Actions
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFiltersChange: (search: string, isActive: boolean | undefined) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (supplier: Supplier) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierFormValues) => void;
  onStatusChange: (supplier: Supplier) => void;
  onStatusConfirm: (supplier: Supplier) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function SupplierListPresenter({
  items,
  totalItems,
  totalPages,
  page,
  pageSize,
  search,
  isActive,
  formOpen,
  editing,
  statusChange,
  isLoading,
  isCreatePending,
  isUpdatePending,
  isDeactivatePending,
  isRestorePending,
  canCreate,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onRefresh,
  onCreate,
  onEdit,
  onFormOpenChange,
  onSubmit,
  onStatusChange,
  onStatusConfirm,
  onStatusDialogOpenChange,
  className,
}: SupplierListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (values: SupplierFormValues) => {
      await onSubmit(values);
    },
    [onSubmit],
  );

  const handleConfirmStatus = React.useCallback(() => {
    if (statusChange) {
      onStatusConfirm(statusChange);
    }
  }, [statusChange, onStatusConfirm]);

  return (
    <div className={className}>
      <PageContainer>
        <PageHeader
          title="จัดการผู้จัดจำหน่าย"
          description="จัดการข้อมูลผู้จัดจำหน่ายที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "ผู้จัดจำหน่าย" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มผู้จัดจำหน่าย
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            ทั้งหมด {totalItems} รายการ
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
        </div>

        <SupplierFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <SupplierTable
          suppliers={items}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
        />
      </PageContainer>

      <PageFooter />

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        supplier={editing}
        pending={isCreatePending || isUpdatePending}
        onSubmit={handleSubmit}
      />

      <SupplierStatusDialog
        supplier={statusChange}
        onOpenChange={onStatusDialogOpenChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
