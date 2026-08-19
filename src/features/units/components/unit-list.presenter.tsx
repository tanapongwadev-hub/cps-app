/**
 * UnitList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, Ruler } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UnitTable } from "./unit-table";
import { UnitFilters } from "./unit-filters";
import { UnitFormDialog } from "./unit-form-dialog";
import { UnitStatusDialog } from "./unit-status-dialog";
import type { Unit } from "../api/units-api";
import type { UnitFormValues } from "../schemas/unit-schema";

// ============================================================================
// Props Types
// ============================================================================

export interface UnitListPresenterProps {
  // Data
  items: Unit[];
  totalItems: number;
  totalPages: number;
  
  // State
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: Unit | null;
  statusChange: Unit | null;
  
  // Loading states
  isLoading: boolean;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDeactivatePending: boolean;
  isRestorePending: boolean;
  
  // Permission
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canRestore: boolean;
  
  // Actions
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFiltersChange: (search: string, isActive: boolean | undefined) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (unit: Unit) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (values: UnitFormValues) => void;
  onStatusChange: (unit: Unit) => void;
  onStatusConfirm: (unit: Unit) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function UnitListPresenter({
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
  canEdit,
  canDelete,
  canRestore,
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
}: UnitListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (values: UnitFormValues) => {
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
          title="จัดการหน่วยนับ"
          description="จัดการข้อมูลหน่วยนับที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "หน่วยนับ" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มหน่วยนับ
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler className="h-4 w-4" />
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

        <UnitFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <UnitTable
          units={items}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          canEdit={canEdit}
          canDelete={canDelete}
          canRestore={canRestore}
        />
      </PageContainer>

      <PageFooter />

      <UnitFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        unit={editing}
        pending={isCreatePending || isUpdatePending}
        onSubmit={handleSubmit}
      />

      <UnitStatusDialog
        unit={statusChange}
        onOpenChange={onStatusDialogOpenChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
