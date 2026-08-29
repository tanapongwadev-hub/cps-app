/**
 * MaterialsList Presenter - Pure UI Component
 * 
 * A presentational component that receives data and renders UI.
 * Following Container/Presenter pattern - NO hooks here!
 * 
 * @see @/lib/patterns.ts for pattern guidelines
 */

"use client";

import * as React from "react";
import {
  Package,
  Plus,
  RefreshCw,
  Construction,
} from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { MaterialTable } from "./material-table";
import { MaterialCardGrid } from "./material-card-grid";
import { MaterialFilters } from "./material-filters";
import { MaterialFormDialog } from "./material-form-dialog";
import { MaterialStatusDialog } from "./material-status-dialog";
import type { Material, MaterialLookups, ListMaterialsParams, MaterialPayload, UpdateMaterialPayload, MaterialImageUpload } from "../api/materials-api";

// ============================================================================
// Props Types
// ============================================================================

export interface MaterialsListPresenterProps {
  // Data
  items: Material[];
  totalItems: number;
  lookups: MaterialLookups;
  
  // State
  filters: ListMaterialsParams;
  viewMode: ViewMode;
  formOpen: boolean;
  editingMaterial: Material | null;
  statusChange: { material: Material; action: "deactivate" | "restore" } | null;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isLookupsLoading: boolean;
  isLookupsError: boolean;
  lookupsError: Error | null;
  
  // Mutation states
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDeactivatePending: boolean;
  isRestorePending: boolean;
  isUploadPending: boolean;
  
  // Actions (callbacks from Container)
  onFiltersChange: (filters: ListMaterialsParams) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (material: Material) => void;
  onStatusChange: (material: Material) => void;
  onFormOpenChange: (open: boolean) => void;
  onSave: (payload: MaterialPayload | UpdateMaterialPayload) => void;
  onUploadImage: (file: File) => void;
  onConfirmStatusChange: () => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  
  // Sort/Page handlers
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  
  // Permission
  canCreate: boolean;
  
  // Additional
  className?: string;
}

// ============================================================================
// Presenter Component
// ============================================================================

export function MaterialsListPresenter({
  items,
  totalItems,
  lookups,
  filters,
  viewMode,
  formOpen,
  editingMaterial,
  statusChange,
  isLoading,
  isFetching,
  isLookupsLoading,
  isLookupsError,
  lookupsError,
  isCreatePending,
  isUpdatePending,
  isDeactivatePending,
  isRestorePending,
  isUploadPending,
  onFiltersChange,
  onViewModeChange,
  onRefresh,
  onCreate,
  onEdit,
  onStatusChange,
  onFormOpenChange,
  onSave,
  onUploadImage,
  onConfirmStatusChange,
  onStatusDialogOpenChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  canCreate,
  className,
}: MaterialsListPresenterProps) {
  const canSave = !isLookupsLoading && !isLookupsError;

  // Wrap callbacks to match dialog's expected types
  const handleSave = React.useCallback(
    async (payload: MaterialPayload | UpdateMaterialPayload) => {
      onSave(payload);
    },
    [onSave],
  );

  const handleUploadImage = React.useCallback(
    async (file: File): Promise<MaterialImageUpload> => {
      onUploadImage(file);
      // Return a promise that resolves when mutation completes
      return Promise.resolve({ imagePath: "", previewUrl: "" });
    },
    [onUploadImage],
  );

  return (
    <div className={className}>
      <PageContainer>
        <PageHeader
          title="จัดการอะไหล่"
          description="คลังอะไหล่และวัสดุสิ้นเปลือง — Material Master"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "วัสดุและอะไหล่" },
          ]}
          primaryAction={
            canCreate && (
              <Button
                onClick={onCreate}
                disabled={!canSave}
                aria-label="เพิ่มอะไหล่"
              >
                <Plus className="h-4 w-4" />
                เพิ่มอะไหล่
              </Button>
            )
          }
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="รีเฟรชรายการวัสดุ"
            >
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          }
        />

        {isLookupsError && !isLookupsLoading && (
          <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Construction className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  โหลดข้อมูลตัวเลือกไม่สำเร็จ
                </p>
                <p className="mt-1 text-muted-foreground">
                  ไม่สามารถดึงรายการหน่วย/รุ่น/ประเภทการจัดส่ง/จุดรับสินค้า/ผู้ขาย —{" "}
                  ฟอร์มเพิ่ม/แก้ไขจะใช้งานไม่ได้จนกว่าจะโหลดสำเร็จ
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <MaterialFilters
          value={filters}
          lookups={lookups}
          onChange={onFiltersChange}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span>
              แสดง {items.length} จาก {totalItems} รายการ
            </span>
          </div>
          <ViewToggle
            value={viewMode}
            onValueChange={onViewModeChange}
            storageKey="materials:view-mode"
            ariaLabel="สลับมุมมองรายการอะไหล่"
          />
        </div>

        {viewMode === "list" ? (
          <MaterialTable
            materials={items}
            page={filters.page}
            pageSize={filters.pageSize}
            totalItems={totalItems}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            isLoading={isLoading || isLookupsLoading}
            isError={isLoading === false && items.length === 0 && totalItems === 0}
            onRetry={onRefresh}
            onCreate={canSave ? onCreate : undefined}
            onEdit={canSave ? onEdit : undefined}
            onStatusChange={canSave ? onStatusChange : undefined}
            detailHref={(material) => `/materials/pc/${material.id}`}
            onSortChange={onSortChange}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : (
          <MaterialCardGrid
            materials={items}
            page={filters.page}
            pageSize={filters.pageSize ?? DEFAULT_PAGE_SIZE}
            totalItems={totalItems}
            isLoading={isLoading || isLookupsLoading}
            isError={isLoading === false && items.length === 0 && totalItems === 0}
            onRetry={onRefresh}
            onCreate={canSave ? onCreate : undefined}
            onEdit={canSave ? onEdit : undefined}
            onStatusChange={canSave ? onStatusChange : undefined}
            detailHref={(material) => `/materials/pc/${material.id}`}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </PageContainer>

      <PageFooter />

      <MaterialFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        material={editingMaterial}
        lookups={lookups}
        onSave={handleSave}
        onUploadImage={handleUploadImage}
        savePending={isCreatePending || isUpdatePending}
        uploadPending={isUploadPending}
      />

      <MaterialStatusDialog
        open={!!statusChange}
        material={statusChange?.material ?? null}
        action={statusChange?.action ?? "deactivate"}
        onOpenChange={onStatusDialogOpenChange}
        onConfirm={onConfirmStatusChange}
        pending={isDeactivatePending || isRestorePending}
      />
    </div>
  );
}
