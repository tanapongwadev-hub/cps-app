/**
 * CategoryList Container - Logic & State Management
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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeactivateCategory,
  useRestoreCategory,
} from "../hooks/use-categories";
import type { Category, CategoryPayload, UpdateCategoryPayload } from "../api/categories-api";
import type { CategoryFormValues } from "../schemas/category-schema";
import { CategoryListPresenter } from "./category-list.presenter";

/**
 * Container Props
 */
export interface CategoryListContainerProps {
  className?: string;
}

/**
 * CategoryList Container
 */
export function CategoryListContainer({ className }: CategoryListContainerProps) {
  // =========================================================================
  // Auth & Permissions
  // =========================================================================
  const canCreate = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.CATEGORY_CREATE)
  );

  // =========================================================================
  // Local State
  // =========================================================================
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [statusChange, setStatusChange] = React.useState<Category | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // =========================================================================
  // Data Queries
  // =========================================================================
  const { data, isLoading, refetch } = useCategories({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

  // =========================================================================
  // Mutations
  // =========================================================================
  const createM = useCreateCategory();
  const updateM = useUpdateCategory();
  const deactivateM = useDeactivateCategory();
  const restoreM = useRestoreCategory();

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

  const handleEdit = React.useCallback((category: Category) => {
    setEditing(category);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (values: CategoryFormValues) => {
      const payload = {
        code: values.code,
        nameTh: values.nameTh,
        nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
        parentId: values.parentId?.trim() ? values.parentId.trim() : null,
        sortOrder: values.sortOrder,
        iconColor: values.iconColor?.trim() ? values.iconColor.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
      };

      if (editing) {
        await updateM.mutateAsync({
          id: editing.id,
          data: { ...payload, updatedAt: editing.updatedAt } as UpdateCategoryPayload,
        });
      } else {
        await createM.mutateAsync(payload as CategoryPayload);
      }
      
      setFormOpen(false);
      setEditing(null);
    },
    [createM, editing, updateM],
  );

  const handleStatusChange = React.useCallback((category: Category) => {
    setStatusChange(category);
  }, []);

  const handleStatusConfirm = React.useCallback(
    async (category: Category) => {
      if (category.isActive) {
        await deactivateM.mutateAsync(category.id);
      } else {
        await restoreM.mutateAsync(category.id);
      }
      setStatusChange(null);
    },
    [deactivateM, restoreM],
  );

  const handleStatusDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) setStatusChange(null);
  }, []);

  // =========================================================================
  // Render Presenter
  // =========================================================================
  return (
    <CategoryListPresenter
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
      isCreatePending={createM.isPending}
      isUpdatePending={updateM.isPending}
      isDeactivatePending={deactivateM.isPending}
      isRestorePending={restoreM.isPending}
      canCreate={canCreate}
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
