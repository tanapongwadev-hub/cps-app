"use client";

import * as React from "react";
import { Plus, RefreshCw, Truck } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDeliveryTypes, useCreateDeliveryType, useUpdateDeliveryType,
  useDeactivateDeliveryType, useRestoreDeliveryType,
} from "@/features/delivery-types/hooks/use-delivery-types";
import { DeliveryTypeFormDialog } from "@/features/delivery-types/components/delivery-type-form-dialog";
import { DeliveryTypeTable } from "@/features/delivery-types/components/delivery-type-table";
import { DeliveryTypeFilters } from "@/features/delivery-types/components/delivery-type-filters";
import { DeliveryTypeStatusDialog } from "@/features/delivery-types/components/delivery-type-status-dialog";
import type { DeliveryType, DeliveryTypePayload, UpdateDeliveryTypePayload } from "@/features/delivery-types/api/delivery-types-api";
import type { DeliveryTypeFormValues } from "@/features/delivery-types/schemas/delivery-type-schema";

export default function DeliveryTypesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DeliveryType | null>(null);
  const [statusChange, setStatusChange] = React.useState<DeliveryType | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useDeliveryTypes({
    page, pageSize, search: debouncedSearch || undefined, isActive, sortBy: "code", sortOrder: "asc",
  });

  const createM = useCreateDeliveryType();
  const updateM = useUpdateDeliveryType();
  const deactivateM = useDeactivateDeliveryType();
  const restoreM = useRestoreDeliveryType();

  const handleSubmit = async (values: DeliveryTypeFormValues) => {
    const payload = {
      code: values.code, nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateDeliveryTypePayload });
    } else {
      await createM.mutateAsync(payload as DeliveryTypePayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (t: DeliveryType) => {
    if (t.isActive) await deactivateM.mutateAsync(t.id);
    else await restoreM.mutateAsync(t.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการประเภทการจัดส่ง"
          description="จัดการข้อมูลประเภทการจัดส่งที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" }, { label: "ข้อมูลหลัก" }, { label: "ประเภทการจัดส่ง" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.DELIVERY_TYPE_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />เพิ่มประเภทการจัดส่ง
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />รีเฟรช
          </Button>
        </div>
        <DeliveryTypeFilters value={{ search, isActive }}
          onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }} />
        <DeliveryTypeTable
          types={data?.items ?? []} isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0} totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage} onPageSizeChange={setPageSize}
          onEdit={(t) => { setEditing(t); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <DeliveryTypeFormDialog
        open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        type={editing} pending={createM.isPending || updateM.isPending} onSubmit={handleSubmit}
      />
      <DeliveryTypeStatusDialog
        type={statusChange} onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending} onConfirm={handleStatusConfirm}
      />
    </>
  );
}
