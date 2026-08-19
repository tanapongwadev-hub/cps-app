/**
 * MaterialModelList Container - Logic & State Management
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
import { useDebounce } from "@/hooks/use-debounce";
import {
  useMaterialModels,
  useCreateMaterialModel,
  useUpdateMaterialModel,
  useDeactivateMaterialModel,
  useRestoreMaterialModel,
} from "../hooks/use-material-models";
import type { MaterialModel, MaterialModelPayload, UpdateMaterialModelPayload } from "../api/material-models-api";
import type { MaterialModelFormValues } from "../schemas/material-model-schema";
import { MaterialModelListPresenter } from "./material-model-list.presenter";

/**
 * Container Props
 */
export interface MaterialModelListContainerProps {
  className?: string;
}

/**
 * MaterialModelList Container
 */
export function MaterialModelListContainer({ className }: MaterialModelListContainerProps) {
  // =========================================================================
  // Auth & Permissions
  // =========================================================================
  const canCreate = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MATERIAL_MODEL_CREATE)
  );
  const canEdit = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MATERIAL_MODEL_UPDATE)
  );
  const canDelete = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MATERIAL_MODEL_DELETE)
  );
  const canRestore = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.MATERIAL_MODEL_UPDATE)
  );

  // =========================================================================
  // Local State
  // =========================================================================
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"code" | "nameTh" | "isActive" | "createdAt" | "updatedAt">("code");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MaterialModel | null>(null);
  const [statusChange, setStatusChange] = React.useState<MaterialModel | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // =========================================================================
  // Data Queries
  // =========================================================================
  const { data, isLoading, refetch } = useMaterialModels({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy,
    sortOrder,
  });

  // =========================================================================
  // Mutations
  // =========================================================================
  const createMutation = useCreateMaterialModel();
  const updateMutation = useUpdateMaterialModel();
  const deactivateMutation = useDeactivateMaterialModel();
  const restoreMutation = useRestoreMaterialModel();

  // =========================================================================
  // Event Handlers
  // =========================================================================
  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleFiltersChange = React.useCallback((newSearch: string, newIsActive: boolean | undefined) => {
    setSearch(newSearch);
    setIsActive(newIsActive);
    setPage(1);
  }, []);

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreate = React.useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const handleEdit = React.useCallback((item: MaterialModel) => {
    setEditing(item);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (values: MaterialModelFormValues) => {
      const payload: MaterialModelPayload | UpdateMaterialModelPayload = {
        code: values.code,
        nameTh: values.nameTh,
        nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
        ...(editing ? { updatedAt: editing.updatedAt } : {}),
      };

      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: payload as UpdateMaterialModelPayload,
        });
      } else {
        await createMutation.mutateAsync(payload as MaterialModelPayload);
      }
      
      setFormOpen(false);
      setEditing(null);
    },
    [createMutation, editing, updateMutation],
  );

  const handleStatusChange = React.useCallback((item: MaterialModel) => {
    setStatusChange(item);
  }, []);

  const handleStatusConfirm = React.useCallback(
    async (item: MaterialModel) => {
      if (item.isActive) {
        await deactivateMutation.mutateAsync(item.id);
      } else {
        await restoreMutation.mutateAsync(item.id);
      }
      setStatusChange(null);
    },
    [deactivateMutation, restoreMutation],
  );

  const handleStatusDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) setStatusChange(null);
  }, []);

  // =========================================================================
  // Render Presenter
  // =========================================================================
  return (
    <MaterialModelListPresenter
      items={data?.items ?? []}
      totalItems={data?.meta.totalItems ?? 0}
      totalPages={data?.meta.totalPages ?? 0}
      page={page}
      pageSize={pageSize}
      search={search}
      isActive={isActive}
      formOpen={formOpen}
      editing={editing}
      statusChange={statusChange}
      isLoading={isLoading}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      isDeactivatePending={deactivateMutation.isPending}
      isRestorePending={restoreMutation.isPending}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      canRestore={canRestore}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onFiltersChange={handleFiltersChange}
      onRefresh={handleRefresh}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onFormOpenChange={handleFormOpenChange}
      onSubmit={handleSubmit}
      onStatusChange={handleStatusChange}
      onStatusConfirm={handleStatusConfirm}
      onStatusDialogOpenChange={handleStatusDialogOpenChange}
      className={className}
    />
  );
}
