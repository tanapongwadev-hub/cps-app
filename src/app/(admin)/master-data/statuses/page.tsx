"use client";

import * as React from "react";
import { Plus, RefreshCw, Tag } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useStatusItems, useCreateStatusItem, useUpdateStatusItem,
  useDeactivateStatusItem, useRestoreStatusItem,
} from "@/features/status-items/hooks/use-status-items";
import { StatusItemFormDialog } from "@/features/status-items/components/status-item-form-dialog";
import { StatusItemTable } from "@/features/status-items/components/status-item-table";
import { StatusItemFilters } from "@/features/status-items/components/status-item-filters";
import { StatusItemStatusDialog } from "@/features/status-items/components/status-item-status-dialog";
import type { StatusItem, StatusItemPayload, UpdateStatusItemPayload } from "@/features/status-items/api/status-items-api";
import type { StatusItemFormValues } from "@/features/status-items/schemas/status-item-schema";

export default function StatusesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StatusItem | null>(null);
  const [statusChange, setStatusChange] = React.useState<StatusItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useStatusItems({
    page, pageSize, search: debouncedSearch || undefined, isActive, sortBy: "sortOrder", sortOrder: "asc",
  });

  const createM = useCreateStatusItem();
  const updateM = useUpdateStatusItem();
  const deactivateM = useDeactivateStatusItem();
  const restoreM = useRestoreStatusItem();

  const handleSubmit = async (values: StatusItemFormValues) => {
    const payload = {
      code: values.code, nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      color: values.color,
      module: values.module,
      isDefault: values.isDefault,
      sortOrder: values.sortOrder,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateStatusItemPayload });
    } else {
      await createM.mutateAsync(payload as StatusItemPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (s: StatusItem) => {
    if (s.isActive) await deactivateM.mutateAsync(s.id);
    else await restoreM.mutateAsync(s.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการสถานะ"
          description="จัดการข้อมูลสถานะที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" }, { label: "ข้อมูลหลัก" }, { label: "สถานะ" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.STATUS_ITEM_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />เพิ่มสถานะ
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />รีเฟรช
          </Button>
        </div>
        <StatusItemFilters value={{ search, isActive }} onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }} />
        <StatusItemTable
          items={data?.items ?? []} isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0} totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage} onPageSizeChange={setPageSize}
          onEdit={(s) => { setEditing(s); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <StatusItemFormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        item={editing} pending={createM.isPending || updateM.isPending} onSubmit={handleSubmit} />
      <StatusItemStatusDialog item={statusChange} onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending} onConfirm={handleStatusConfirm} />
    </>
  );
}
