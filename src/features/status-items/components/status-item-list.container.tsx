/**
 * StatusItemList Container - Logic & State Management
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
  useStatusItems,
  useCreateStatusItem,
  useUpdateStatusItem,
  useDeactivateStatusItem,
  useRestoreStatusItem,
} from "../hooks/use-status-items";
import type { StatusItem, StatusItemPayload, UpdateStatusItemPayload } from "../api/status-items-api";
import type { StatusItemFormValues } from "../schemas/status-item-schema";
import { StatusItemListPresenter } from "./status-item-list.presenter";

/**
 * Container Props
 */
export interface StatusItemListContainerProps {
  className?: string;
}

/**
 * StatusItemList Container
 */
export function StatusItemListContainer({ className }: StatusItemListContainerProps) {
  // =========================================================================
  // Auth & Permissions
  // =========================================================================
  const canCreate = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.STATUS_ITEM_CREATE)
  );
  const canEdit = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.STATUS_ITEM_UPDATE)
  );
  const canDelete = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.STATUS_ITEM_DELETE)
  );
  const canRestore = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.STATUS_ITEM_UPDATE)
  );

  // =========================================================================
  // Local State
  // =========================================================================
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"code" | "nameTh" | "module" | "sortOrder" | "isActive" | "createdAt" | "updatedAt">("code");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StatusItem | null>(null);
  const [statusChange, setStatusChange] = React.useState<StatusItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // =========================================================================
  // Data Queries
  // =========================================================================
  const { data, isLoading, refetch } = useStatusItems({
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
  const createMutation = useCreateStatusItem();
  const updateMutation = useUpdateStatusItem();
  const deactivateMutation = useDeactivateStatusItem();
  const restoreMutation = useRestoreStatusItem();

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

  const handleEdit = React.useCallback((item: StatusItem) => {
    setEditing(item);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (values: StatusItemFormValues) => {
      const payload: StatusItemPayload | UpdateStatusItemPayload = {
        code: values.code,
        nameTh: values.nameTh,
        nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
        color: values.color,
        module: values.module,
        isDefault: values.isDefault,
        sortOrder: values.sortOrder,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
        ...(editing ? { updatedAt: editing.updatedAt } : {}),
      };

      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: payload as UpdateStatusItemPayload,
        });
      } else {
        await createMutation.mutateAsync(payload as StatusItemPayload);
      }
      
      setFormOpen(false);
      setEditing(null);
    },
    [createMutation, editing, updateMutation],
  );

  const handleStatusChange = React.useCallback((item: StatusItem) => {
    setStatusChange(item);
  }, []);

  const handleStatusConfirm = React.useCallback(
    async (item: StatusItem) => {
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
    <StatusItemListPresenter
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
