/**
 * RejectReasonList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, XCircle } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RejectReasonTable } from "./reject-reason-table";
import { RejectReasonFilters } from "./reject-reason-filters";
import { RejectReasonFormDialog } from "./reject-reason-form-dialog";
import { RejectReasonStatusDialog } from "./reject-reason-status-dialog";
import type { RejectReason, RejectReasonPayload, UpdateRejectReasonPayload } from "../api/reject-reasons-api";

// ============================================================================
// Props Types
// ============================================================================

export interface RejectReasonListPresenterProps {
  // Data
  items: RejectReason[];
  totalItems: number;
  totalPages: number;
  
  // State
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: RejectReason | null;
  statusChange: RejectReason | null;
  
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
  onEdit: (reason: RejectReason) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (payload: RejectReasonPayload | UpdateRejectReasonPayload) => void;
  onStatusChange: (reason: RejectReason) => void;
  onStatusConfirm: (reason: RejectReason) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function RejectReasonListPresenter({
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
}: RejectReasonListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (payload: RejectReasonPayload | UpdateRejectReasonPayload) => {
      await onSubmit(payload);
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
          title="จัดการเหตุผลการปฏิเสธ"
          description="จัดการข้อมูลเหตุผลการปฏิเสธที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "เหตุผลการปฏิเสธ" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มเหตุผลการปฏิเสธ
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
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

        <RejectReasonFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <RejectReasonTable
          reasons={items}
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

      <RejectReasonFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        reason={editing}
        savePending={isCreatePending || isUpdatePending}
        onSave={handleSubmit}
      />

      <RejectReasonStatusDialog
        open={!!statusChange}
        onOpenChange={onStatusDialogOpenChange}
        reason={statusChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
