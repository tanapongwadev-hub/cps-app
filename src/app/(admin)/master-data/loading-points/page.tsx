"use client";

import * as React from "react";
import { Plus, RefreshCw, MapPin } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useLoadingPoints, useCreateLoadingPoint, useUpdateLoadingPoint,
  useDeactivateLoadingPoint, useRestoreLoadingPoint,
} from "@/features/loading-points/hooks/use-loading-points";
import { LoadingPointFormDialog } from "@/features/loading-points/components/loading-point-form-dialog";
import { LoadingPointTable } from "@/features/loading-points/components/loading-point-table";
import { LoadingPointFilters } from "@/features/loading-points/components/loading-point-filters";
import { LoadingPointStatusDialog } from "@/features/loading-points/components/loading-point-status-dialog";
import type { LoadingPoint, LoadingPointPayload, UpdateLoadingPointPayload } from "@/features/loading-points/api/loading-points-api";
import type { LoadingPointFormValues } from "@/features/loading-points/schemas/loading-point-schema";

export default function LoadingPointsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LoadingPoint | null>(null);
  const [statusChange, setStatusChange] = React.useState<LoadingPoint | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useLoadingPoints({
    page, pageSize, search: debouncedSearch || undefined, isActive, sortBy: "code", sortOrder: "asc",
  });

  const createM = useCreateLoadingPoint();
  const updateM = useUpdateLoadingPoint();
  const deactivateM = useDeactivateLoadingPoint();
  const restoreM = useRestoreLoadingPoint();

  const handleSubmit = async (values: LoadingPointFormValues) => {
    const payload = {
      code: values.code, nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateLoadingPointPayload });
    } else {
      await createM.mutateAsync(payload as LoadingPointPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (p: LoadingPoint) => {
    if (p.isActive) await deactivateM.mutateAsync(p.id);
    else await restoreM.mutateAsync(p.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการจุดขนถ่าย"
          description="จัดการข้อมูลจุดขนถ่ายที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" }, { label: "ข้อมูลหลัก" }, { label: "จุดขนถ่าย" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.LOADING_POINT_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />เพิ่มจุดขนถ่าย
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />รีเฟรช
          </Button>
        </div>
        <LoadingPointFilters value={{ search, isActive }}
          onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }} />
        <LoadingPointTable
          points={data?.items ?? []} isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0} totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage} onPageSizeChange={setPageSize}
          onEdit={(p) => { setEditing(p); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <LoadingPointFormDialog
        open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        point={editing} pending={createM.isPending || updateM.isPending} onSubmit={handleSubmit}
      />
      <LoadingPointStatusDialog
        point={statusChange} onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending} onConfirm={handleStatusConfirm}
      />
    </>
  );
}
