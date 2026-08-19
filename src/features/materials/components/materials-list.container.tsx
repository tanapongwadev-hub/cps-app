/**
 * MaterialsList Container - Logic & State Management
 * 
 * A container component that handles all business logic using hooks.
 * Passes data and callbacks to the Presenter component.
 * 
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/auth-store";
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
} from "../hooks/use-materials";
import type { Material, MaterialLookups, ListMaterialsParams, MaterialPayload, UpdateMaterialPayload } from "../api/materials-api";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { MaterialsListPresenter } from "./materials-list.presenter";

/**
 * Container Props - interface for the Presenter
 */
export interface MaterialsListContainerProps {
  /** Initial filters to apply */
  initialFilters?: Partial<ListMaterialsParams>;
  /** Container className */
  className?: string;
}

/**
 * Default initial filters
 */
const DEFAULT_FILTERS: ListMaterialsParams = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/**
 * MaterialsList Container
 * 
 * Manages all state and business logic, passes to Presenter for rendering.
 * 
 * @example
 * ```tsx
 * // In a page file
 * import { MaterialsListContainer } from '@/features/materials/components/materials-list.container';
 * 
 * export default function MaterialsPage() {
 *   return <MaterialsListContainer />;
 * }
 * ```
 */
export function MaterialsListContainer({
  initialFilters = {},
  className,
}: MaterialsListContainerProps) {
  // =========================================================================
  // Auth & Permissions
  // =========================================================================
  const canCreate = useAuthStore((state) => 
    state.hasPermission(PERMISSIONS.MATERIAL_CREATE)
  );

  // =========================================================================
  // Local State
  // =========================================================================
  const [filters, setFilters] = React.useState<ListMaterialsParams>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);
  const [statusChange, setStatusChange] = React.useState<{
    material: Material;
    action: "deactivate" | "restore";
  } | null>(null);

  // =========================================================================
  // Data Queries
  // =========================================================================
  const listQuery = useMaterials(filters);
  const lookupsQuery = useMaterialLookups();

  // =========================================================================
  // Mutations
  // =========================================================================
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deactivateMutation = useDeactivateMaterial();
  const restoreMutation = useRestoreMaterial();
  const uploadMutation = useUploadMaterialImage();

  // =========================================================================
  // Derived State
  // =========================================================================
  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const lookups: MaterialLookups = lookupsQuery.data ?? {
    units: [],
    suppliers: [],
    models: [],
    deliveryTypes: [],
    loadingPoints: [],
  };

  // =========================================================================
  // Event Handlers
  // =========================================================================
  const handleFiltersChange = React.useCallback((newFilters: ListMaterialsParams) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handleSortChange = React.useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      setFilters((prev) => ({ ...prev, page: 1, sortBy: sortBy as ListMaterialsParams["sortBy"], sortOrder }));
    },
    [],
  );

  const handlePageChange = React.useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize }));
  }, []);

  const handleCreate = React.useCallback(() => {
    setEditingMaterial(null);
    setFormOpen(true);
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
        // Create mode
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

  const handleStatusDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) setStatusChange(null);
  }, []);

  const handleRefresh = React.useCallback(() => {
    listQuery.refetch();
  }, [listQuery]);

  // =========================================================================
  // Render Presenter
  // =========================================================================
  return (
    <MaterialsListPresenter
      items={items}
      totalItems={totalItems}
      lookups={lookups}
      filters={filters}
      viewMode={viewMode}
      formOpen={formOpen}
      editingMaterial={editingMaterial}
      statusChange={statusChange}
      isLoading={listQuery.isLoading}
      isFetching={listQuery.isFetching}
      isLookupsLoading={lookupsQuery.isLoading}
      isLookupsError={lookupsQuery.isError}
      lookupsError={lookupsQuery.error as Error | null}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      isDeactivatePending={deactivateMutation.isPending}
      isRestorePending={restoreMutation.isPending}
      isUploadPending={uploadMutation.isPending}
      onFiltersChange={handleFiltersChange}
      onViewModeChange={setViewMode}
      onRefresh={handleRefresh}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onStatusChange={handleStatusChange}
      onFormOpenChange={handleFormOpenChange}
      onSave={handleSave}
      onUploadImage={handleUploadImage}
      onConfirmStatusChange={handleConfirmStatusChange}
      onStatusDialogOpenChange={handleStatusDialogOpenChange}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      canCreate={canCreate}
      className={className}
    />
  );
}
