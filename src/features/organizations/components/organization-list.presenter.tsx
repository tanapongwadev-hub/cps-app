/**
 * OrganizationList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { OrganizationTable } from "./organization-table";
import { OrganizationFilters } from "./organization-filters";
import { OrganizationFormDialog } from "./organization-form-dialog";
import { OrganizationStatusDialog } from "./organization-status-dialog";
import type { Organization, OrganizationPayload, UpdateOrganizationPayload } from "../api/organizations-api";

// ============================================================================
// Props Types
// ============================================================================

export interface OrganizationListPresenterProps {
  // Data
  items: Organization[];
  totalItems: number;
  totalPages: number;
  
  // State
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: Organization | null;
  statusChange: Organization | null;
  
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
  onEdit: (org: Organization) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (values: OrganizationPayload) => void;
  onStatusChange: (org: Organization) => void;
  onStatusConfirm: (org: Organization) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function OrganizationListPresenter({
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
}: OrganizationListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (values: OrganizationPayload) => {
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
          title="จัดการองค์กร"
          description="จัดการข้อมูลองค์กรที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "องค์กร" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มองค์กร
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
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

        <OrganizationFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <OrganizationTable
          organizations={items}
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

      <OrganizationFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        organization={editing}
        pending={isCreatePending || isUpdatePending}
        onSubmit={handleSubmit}
      />

      <OrganizationStatusDialog
        organization={statusChange}
        onOpenChange={onStatusDialogOpenChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
