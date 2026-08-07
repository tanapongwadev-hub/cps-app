"use client";

/**
 * Materials page
 * Wired to the real backend at /materials.
 * Backend contract: see docs/prompts/PROMPT-material-crud.md
 */
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
import { PermissionGuard } from "@/components/ui/permission-guard";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useMaterials,
  useMaterialLookups,
  useCreateMaterial,
  useUpdateMaterial,
  useDeactivateMaterial,
  useRestoreMaterial,
  useUploadMaterialImage,
} from "@/features/materials/hooks/use-materials";
import { MaterialTable } from "@/features/materials/components/material-table";
import { MaterialCardGrid } from "@/features/materials/components/material-card-grid";
import { MaterialFilters } from "@/features/materials/components/material-filters";
import { MaterialFormDialog } from "@/features/materials/components/material-form-dialog";
import { MaterialStatusDialog } from "@/features/materials/components/material-status-dialog";
import type {
  ListMaterialsParams,
  Material,
  MaterialPayload,
  UpdateMaterialPayload,
} from "@/features/materials/api/materials-api";

type SortBy = NonNullable<ListMaterialsParams["sortBy"]>;
type SortOrder = NonNullable<ListMaterialsParams["sortOrder"]>;

export default function MaterialsPage() {
  const [filters, setFilters] = React.useState<ListMaterialsParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);
  const [statusChange, setStatusChange] = React.useState<{
    material: Material;
    action: "deactivate" | "restore";
  } | null>(null);

  const lookupsQuery = useMaterialLookups();
  const listQuery = useMaterials(filters);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deactivateMutation = useDeactivateMaterial();
  const restoreMutation = useRestoreMaterial();
  const uploadMutation = useUploadMaterialImage();

  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const lookups = lookupsQuery.data ?? {
    units: [],
    suppliers: [],
    models: [],
    deliveryTypes: [],
    loadingPoints: [],
  };

  const handleSortChange = React.useCallback(
    (sortBy: SortBy, sortOrder: SortOrder) => {
      setFilters((prev) => ({ ...prev, page: 1, sortBy, sortOrder }));
    },
    [],
  );

  const handlePageChange = React.useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize }));
  }, []);

  const handleEdit = React.useCallback((material: Material) => {
    setEditingMaterial(material);
    setFormOpen(true);
  }, []);

  const handleStatusChange = React.useCallback((material: Material) => {
    setStatusChange({
      material,
      action: material.isActive ? "deactivate" : "restore",
    });
  }, []);

  const handleCreate = React.useCallback(() => {
    setEditingMaterial(null);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingMaterial(null);
  }, []);

  const handleSave = React.useCallback(
    async (payload: MaterialPayload | UpdateMaterialPayload) => {
      if ("updatedAt" in payload) {
        // Edit mode
        const editing = editingMaterial;
        if (!editing) return;
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload as MaterialPayload);
      }
    },
    [createMutation, editingMaterial, updateMutation],
  );

  const handleUploadImage = React.useCallback(
    (file: File) => uploadMutation.mutateAsync(file),
    [uploadMutation],
  );

  const handleConfirmStatusChange = React.useCallback(async () => {
    if (!statusChange) return;
    if (statusChange.action === "deactivate") {
      await deactivateMutation.mutateAsync(statusChange.material.id);
    } else {
      await restoreMutation.mutateAsync(statusChange.material.id);
    }
    setStatusChange(null);
  }, [deactivateMutation, restoreMutation, statusChange]);

  const lookupsLoading = lookupsQuery.isLoading;
  const lookupsError = lookupsQuery.error as Error | null;
  const canSave = !lookupsLoading && !lookupsError;

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการอะไหล่"
          description="คลังอะไหล่และวัสดุสิ้นเปลือง — Material Master"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "จัดการอะไหล่" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.MATERIAL_CREATE}>
              <Button
                onClick={handleCreate}
                disabled={!canSave}
                aria-label="เพิ่มวัสดุใหม่"
              >
                <Plus className="h-4 w-4" />
                เพิ่มอะไหล่
              </Button>
            </PermissionGuard>
          }
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
              aria-label="รีเฟรชรายการวัสดุ"
            >
              <RefreshCw
                className={listQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          }
        />

        {lookupsError && !lookupsLoading && (
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
          onChange={setFilters}
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
            onValueChange={setViewMode}
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
            isLoading={listQuery.isLoading || lookupsLoading}
            isError={listQuery.isError}
            onRetry={() => listQuery.refetch()}
            onCreate={canSave ? handleCreate : undefined}
            onEdit={canSave ? handleEdit : undefined}
            onStatusChange={canSave ? handleStatusChange : undefined}
            detailHref={(material) => `/materials/pc/${material.id}`}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : (
          <MaterialCardGrid
            materials={items}
            page={filters.page}
            pageSize={filters.pageSize ?? DEFAULT_PAGE_SIZE}
            totalItems={totalItems}
            isLoading={listQuery.isLoading || lookupsLoading}
            isError={listQuery.isError}
            onRetry={() => listQuery.refetch()}
            onCreate={canSave ? handleCreate : undefined}
            onEdit={canSave ? handleEdit : undefined}
            onStatusChange={canSave ? handleStatusChange : undefined}
            detailHref={(material) => `/materials/pc/${material.id}`}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </PageContainer>

      <PageFooter />

      <MaterialFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        material={editingMaterial}
        lookups={lookups}
        onSave={handleSave}
        onUploadImage={handleUploadImage}
        savePending={createMutation.isPending || updateMutation.isPending}
        uploadPending={uploadMutation.isPending}
      />

      <MaterialStatusDialog
        open={!!statusChange}
        material={statusChange?.material ?? null}
        action={statusChange?.action ?? "deactivate"}
        onOpenChange={(open) => {
          if (!open) setStatusChange(null);
        }}
        onConfirm={handleConfirmStatusChange}
        pending={deactivateMutation.isPending || restoreMutation.isPending}
      />
    </>
  );
}
