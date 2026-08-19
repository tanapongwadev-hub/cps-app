/**
 * DeliveryTypeList Presenter - Pure UI Component
 */

"use client";

import * as React from "react";
import { Plus, RefreshCw, Truck } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DeliveryTypeTable } from "./delivery-type-table";
import { DeliveryTypeFilters } from "./delivery-type-filters";
import { DeliveryTypeFormDialog } from "./delivery-type-form-dialog";
import { DeliveryTypeStatusDialog } from "./delivery-type-status-dialog";
import type { DeliveryType } from "../api/delivery-types-api";
import type { DeliveryTypeFormValues } from "../schemas/delivery-type-schema";

export interface DeliveryTypeListPresenterProps {
  items: DeliveryType[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  search: string;
  isActive?: boolean;
  formOpen: boolean;
  editing: DeliveryType | null;
  statusChange: DeliveryType | null;
  isLoading: boolean;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  isDeactivatePending: boolean;
  isRestorePending: boolean;
  canCreate: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFiltersChange: (search: string, isActive: boolean | undefined) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (type: DeliveryType) => void;
  onFormOpenChange: (open: boolean) => void;
  onSubmit: (values: DeliveryTypeFormValues) => void;
  onStatusChange: (type: DeliveryType) => void;
  onStatusConfirm: (type: DeliveryType) => void;
  onStatusDialogOpenChange: (open: boolean) => void;
  className?: string;
}

export function DeliveryTypeListPresenter({
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
}: DeliveryTypeListPresenterProps) {
  const handleFiltersChange = React.useCallback(
    (values: { search: string; isActive?: boolean }) => {
      onFiltersChange(values.search, values.isActive);
    },
    [onFiltersChange],
  );

  const handleSubmit = React.useCallback(
    async (values: DeliveryTypeFormValues) => {
      await onSubmit(values);
    },
    [onSubmit],
  );

  const handleConfirmStatus = React.useCallback(() => {
    if (statusChange) onStatusConfirm(statusChange);
  }, [statusChange, onStatusConfirm]);

  return (
    <div className={className}>
      <PageContainer>
        <PageHeader
          title="จัดการประเภทการจัดส่ง"
          description="จัดการข้อมูลประเภทการจัดส่งที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "ประเภทการจัดส่ง" },
          ]}
          primaryAction={
            canCreate && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4" />
                เพิ่มประเภทการจัดส่ง
              </Button>
            )
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            ทั้งหมด {totalItems} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
        </div>

        <DeliveryTypeFilters
          value={{ search, isActive }}
          onChange={handleFiltersChange}
        />

        <DeliveryTypeTable
          types={items}
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

      <DeliveryTypeFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        type={editing}
        pending={isCreatePending || isUpdatePending}
        onSubmit={handleSubmit}
      />

      <DeliveryTypeStatusDialog
        type={statusChange}
        onOpenChange={onStatusDialogOpenChange}
        pending={isDeactivatePending || isRestorePending}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
