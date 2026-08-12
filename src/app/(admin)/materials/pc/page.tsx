"use client";

/**
 * Materials — PC (อะไหล่ PC) page
 *
 * Redesigned page for PC parts management:
 * - Modern header with stats
 * - Clean filter section
 * - Card grid view (default)
 * - View toggle (card/table)
 */

import * as React from "react";
import {
  Cpu,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
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
import { MaterialCardGrid } from "@/features/materials/components/material-card-grid";
import { MaterialTable } from "@/features/materials/components/material-table";
import { MaterialFilters } from "@/features/materials/components/material-filters";
import { MaterialFormModal } from "@/features/materials/components/material-form-modal";
import { MaterialStatusDialog } from "@/features/materials/components/material-status-dialog";
import { StockBalanceDialog } from "@/features/materials/components/stock-balance-dialog";
import type {
  ListMaterialsParams,
  Material,
  MaterialPayload,
  UpdateMaterialPayload,
} from "@/features/materials/api/materials-api";
import { useRouter } from "next/navigation";

type SortBy = NonNullable<ListMaterialsParams["sortBy"]>;
type SortOrder = NonNullable<ListMaterialsParams["sortOrder"]>;

const PC_PAGE_SIZE = 12;

export default function MaterialsPCPage() {
  const router = useRouter();
  const [filters, setFilters] = React.useState<ListMaterialsParams>({
    page: 1,
    pageSize: PC_PAGE_SIZE,
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>("card");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);
  const [statusChange, setStatusChange] = React.useState<{
    material: Material;
    action: "deactivate" | "restore";
  } | null>(null);
  const [stockBalanceMaterial, setStockBalanceMaterial] = React.useState<Material | null>(null);

  const lookupsQuery = useMaterialLookups();
  const listQuery = useMaterials(filters);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deactivateMutation = useDeactivateMaterial();
  const restoreMutation = useRestoreMaterial();
  const uploadMutation = useUploadMaterialImage();

  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const activeItems = items.filter((m) => m.isActive).length;
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

  const handleViewStockBalance = React.useCallback((material: Material) => {
    setStockBalanceMaterial(material);
  }, []);

  const handleGoToReceiving = React.useCallback(() => {
    router.push("/materials/materials-receiving");
  }, [router]);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingMaterial(null);
  }, []);

  const handleSave = React.useCallback(
    async (payload: MaterialPayload | UpdateMaterialPayload) => {
      try {
        if ("updatedAt" in payload) {
          const editing = editingMaterial;
          if (!editing) return;
          await updateMutation.mutateAsync({ id: editing.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload as MaterialPayload);
        }
        // Close modal without redirect
        setFormOpen(false);
        setEditingMaterial(null);
      } catch {
        // Error is handled by mutation
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
        {/* Header */}
        <PageHeader
          title="จัดการอะไหล่ PC"
          description="Material Master — อะไหล่และวัสดุสิ้นเปลืองสำหรับฝ่าย PC"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "จัดการอะไหล่", href: "/materials" },
            { label: "อะไหล่ PC" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.MATERIAL_CREATE}>
              <Button
                onClick={handleCreate}
                disabled={!canSave}
                className="gap-2"
              >
                <Plus className="size-4" />
                เพิ่มอะไหล่ PC
              </Button>
            </PermissionGuard>
          }
          secondaryActions={
            <>
              <PermissionGuard permission={PERMISSIONS.MATERIALS_RECEIVING_VIEW}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToReceiving}
                  className="gap-2"
                >
                  <Warehouse className="size-4" />
                  <span className="hidden sm:inline">รับเข้าวัตถุดิบ</span>
                </Button>
              </PermissionGuard>
              <Button
                variant="outline"
                size="sm"
                onClick={() => listQuery.refetch()}
                disabled={listQuery.isFetching}
              >
                <RefreshCw
                  className={listQuery.isFetching ? "size-4 animate-spin" : "size-4"}
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </Button>
            </>
          }
        />

        {/* Stats Row */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ทั้งหมด</p>
                <p className="text-2xl font-semibold">{totalItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-lg">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">กำลังใช้งาน</p>
                <p className="text-2xl font-semibold">{activeItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
                <Cpu className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ประเภทอะไหล่</p>
                <p className="text-2xl font-semibold">
                  {lookups.models.length > 0 ? lookups.models.length : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <MaterialFilters
          value={filters}
          lookups={lookups}
          onChange={setFilters}
        />

        {/* View Toggle & Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="size-4" />
            <span>
              แสดง {items.length} รายการ {totalItems > 0 && `จาก ${totalItems}`}
            </span>
          </div>
          <ViewToggle
            value={viewMode}
            onValueChange={setViewMode}
            storageKey="materials:view-mode"
          />
        </div>

        {/* Content */}
        <div className="mt-4">
          {viewMode === "card" ? (
            <MaterialCardGrid
              materials={items}
              page={filters.page}
              pageSize={filters.pageSize ?? PC_PAGE_SIZE}
              totalItems={totalItems}
              isLoading={listQuery.isLoading || lookupsLoading}
              isError={listQuery.isError}
              onRetry={() => listQuery.refetch()}
              onCreate={canSave ? handleCreate : undefined}
              onEdit={canSave ? handleEdit : undefined}
              onStatusChange={canSave ? handleStatusChange : undefined}
              onViewStockBalance={handleViewStockBalance}
              detailHref={(material) => `/materials/pc/${material.id}`}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : (
            <MaterialTable
              materials={items}
              page={filters.page}
              pageSize={filters.pageSize ?? PC_PAGE_SIZE}
              totalItems={totalItems}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              isLoading={listQuery.isLoading || lookupsLoading}
              isError={listQuery.isError}
              onRetry={() => listQuery.refetch()}
              onCreate={canSave ? handleCreate : undefined}
              onEdit={canSave ? handleEdit : undefined}
              onStatusChange={canSave ? handleStatusChange : undefined}
              onViewStockBalance={handleViewStockBalance}
              detailHref={(material) => `/materials/pc/${material.id}`}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </PageContainer>

      <PageFooter />

      {/* Form Modal */}
      <MaterialFormModal
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        material={editingMaterial}
        lookups={lookups}
        onSave={handleSave}
        onUploadImage={handleUploadImage}
        savePending={createMutation.isPending || updateMutation.isPending}
        uploadPending={uploadMutation.isPending}
      />

      {/* Status Dialog */}
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

      {/* Stock Balance Dialog */}
      <StockBalanceDialog
        open={!!stockBalanceMaterial}
        material={stockBalanceMaterial}
        onOpenChange={(open) => {
          if (!open) setStockBalanceMaterial(null);
        }}
      />
    </>
  );
}
