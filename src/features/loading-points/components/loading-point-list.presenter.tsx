/**
 * LoadingPointList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, MapPin } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LoadingPointTable } from "./loading-point-table";
import { LoadingPointFilters } from "./loading-point-filters";
import { LoadingPointFormDialog } from "./loading-point-form-dialog";
import { LoadingPointStatusDialog } from "./loading-point-status-dialog";
import type { LoadingPoint } from "../api/loading-points-api";
import type { LoadingPointFormValues } from "../schemas/loading-point-schema";

// ============================================================================
// Props Types
// ============================================================================

export interface LoadingPointListPresenterProps {
  // Data
  items: LoadingPoint[];
  totalItems: number;
  totalPages: number;
  
  // State
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: LoadingPoint | null;
  statusChange: LoadingPoint | null;
  
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
  onEdit: (point: LoadingPoint) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (values: LoadingPointFormValues) => void;
  onStatusChange: (point: LoadingPoint) => void;
  onStatusConfirm: (point: LoadingPoint) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function LoadingPointListPresenter({
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
}: LoadingPointListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (values: LoadingPointFormValues) => {
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
          title="จัดการจุดขนถ่าย"
          description="จัดการข้อมูลจุดขนถ่ายที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "จุดขนถ่าย" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มจุดขนถ่าย
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
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

        <LoadingPointFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <LoadingPointTable
          points={items}
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

      <LoadingPointFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        point={editing}
        pending={isCreatePending || isUpdatePending}
        onSubmit={handleSubmit}
      />

      <LoadingPointStatusDialog
        point={statusChange}
        onOpenChange={onStatusDialogOpenChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
