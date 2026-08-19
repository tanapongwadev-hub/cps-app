/**
 * DeliveryTypeList Container - Logic & State Management
 */

"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/auth-store";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDeliveryTypes,
  useCreateDeliveryType,
  useUpdateDeliveryType,
  useDeactivateDeliveryType,
  useRestoreDeliveryType,
} from "../hooks/use-delivery-types";
import type { DeliveryType, DeliveryTypePayload, UpdateDeliveryTypePayload } from "../api/delivery-types-api";
import type { DeliveryTypeFormValues } from "../schemas/delivery-type-schema";
import { DeliveryTypeListPresenter } from "./delivery-type-list.presenter";

export interface DeliveryTypeListContainerProps {
  className?: string;
}

export function DeliveryTypeListContainer({ className }: DeliveryTypeListContainerProps) {
  const canCreate = useAuthStore((state) =>
    state.hasPermission(PERMISSIONS.DELIVERY_TYPE_CREATE)
  );

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DeliveryType | null>(null);
  const [statusChange, setStatusChange] = React.useState<DeliveryType | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useDeliveryTypes({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy: "code",
    sortOrder: "asc",
  });

  const createM = useCreateDeliveryType();
  const updateM = useUpdateDeliveryType();
  const deactivateM = useDeactivateDeliveryType();
  const restoreM = useRestoreDeliveryType();

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

  const handleEdit = React.useCallback((type: DeliveryType) => {
    setEditing(type);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (values: DeliveryTypeFormValues) => {
      const payload: DeliveryTypePayload | UpdateDeliveryTypePayload = {
        code: values.code,
        nameTh: values.nameTh,
        nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
        ...(editing ? { updatedAt: editing.updatedAt } : {}),
      };

      if (editing) {
        await updateM.mutateAsync({
          id: editing.id,
          data: payload as UpdateDeliveryTypePayload,
        });
      } else {
        await createM.mutateAsync(payload as DeliveryTypePayload);
      }

      setFormOpen(false);
      setEditing(null);
    },
    [createM, editing, updateM],
  );

  const handleStatusChange = React.useCallback((type: DeliveryType) => {
    setStatusChange(type);
  }, []);

  const handleStatusConfirm = React.useCallback(
    async (type: DeliveryType) => {
      if (type.isActive) {
        await deactivateM.mutateAsync(type.id);
      } else {
        await restoreM.mutateAsync(type.id);
      }
      setStatusChange(null);
    },
    [deactivateM, restoreM],
  );

  const handleStatusDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) setStatusChange(null);
  }, []);

  return (
    <DeliveryTypeListPresenter
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
