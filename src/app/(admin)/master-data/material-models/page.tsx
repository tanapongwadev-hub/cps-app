"use client";

import * as React from "react";
import { Plus, RefreshCw, Box } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useMaterialModels,
  useCreateMaterialModel,
  useUpdateMaterialModel,
  useDeactivateMaterialModel,
  useRestoreMaterialModel,
} from "@/features/material-models/hooks/use-material-models";
import { MaterialModelFormDialog } from "@/features/material-models/components/material-model-form-dialog";
import { MaterialModelTable } from "@/features/material-models/components/material-model-table";
import { MaterialModelFilters } from "@/features/material-models/components/material-model-filters";
import { MaterialModelStatusDialog } from "@/features/material-models/components/material-model-status-dialog";
import type {
  MaterialModel,
  MaterialModelPayload,
  UpdateMaterialModelPayload,
} from "@/features/material-models/api/material-models-api";
import type { MaterialModelFormValues } from "@/features/material-models/schemas/material-model-schema";

export default function MaterialModelsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MaterialModel | null>(null);
  const [statusChange, setStatusChange] = React.useState<MaterialModel | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useMaterialModels({
    page, pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy: "code", sortOrder: "asc",
  });

  const createM = useCreateMaterialModel();
  const updateM = useUpdateMaterialModel();
  const deactivateM = useDeactivateMaterialModel();
  const restoreM = useRestoreMaterialModel();

  const handleSubmit = async (values: MaterialModelFormValues) => {
    const payload = {
      code: values.code,
      nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateMaterialModelPayload });
    } else {
      await createM.mutateAsync(payload as MaterialModelPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (m: MaterialModel) => {
    if (m.isActive) await deactivateM.mutateAsync(m.id);
    else await restoreM.mutateAsync(m.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการรุ่นวัสดุ"
          description="จัดการข้อมูลรุ่นวัสดุที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "รุ่นวัสดุ" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.MATERIAL_MODEL_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />
                เพิ่มรุ่นวัสดุ
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Box className="h-4 w-4" />
            ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
        </div>
        <MaterialModelFilters
          value={{ search, isActive }}
          onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }}
        />
        <MaterialModelTable
          models={data?.items ?? []}
          isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(m) => { setEditing(m); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <MaterialModelFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        model={editing}
        pending={createM.isPending || updateM.isPending}
        onSubmit={handleSubmit}
      />
      <MaterialModelStatusDialog
        model={statusChange}
        onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
