"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  suppliersApi,
  type ListSuppliersParams,
  type SupplierPayload,
  type UpdateSupplierPayload,
} from "../api/suppliers-api";

export function useSuppliers(params: ListSuppliersParams) {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS.LIST(params),
    queryFn: () => suppliersApi.list(params),
  });
}

export function useSupplier(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS.DETAIL(id ?? ""),
    queryFn: () => suppliersApi.get(id as string),
    enabled: !!id,
  });
}

function useSupplierInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS.ALL });
    if (id) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS.DETAIL(id) });
    }
  };
}

export function useCreateSupplier() {
  const invalidate = useSupplierInvalidation();
  return useMutation({
    mutationFn: (data: SupplierPayload) => suppliersApi.create(data),
    onSuccess: () => {
      invalidate();
      showToast.success("สร้างผู้จัดจำหน่ายเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถสร้างผู้จัดจำหน่ายได้", error.message),
  });
}

export function useUpdateSupplier() {
  const invalidate = useSupplierInvalidation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierPayload }) =>
      suppliersApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidate(variables.id);
      showToast.success("แก้ไขผู้จัดจำหน่ายเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถแก้ไขผู้จัดจำหน่ายได้", error.message),
  });
}

export function useDeactivateSupplier() {
  const invalidate = useSupplierInvalidation();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deactivate(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("ปิดใช้งานผู้จัดจำหน่ายเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถปิดใช้งานผู้จัดจำหน่ายได้", error.message),
  });
}

export function useRestoreSupplier() {
  const invalidate = useSupplierInvalidation();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.restore(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("เปิดใช้งานผู้จัดจำหน่ายเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถเปิดใช้งานผู้จัดจำหน่ายได้", error.message),
  });
}
