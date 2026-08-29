"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  departmentsApi,
  type ListDepartmentsParams,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
} from "@/features/departments/api/departments-api";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";

/**
 * List departments. The real backend returns
 *   { items, meta: { page, limit, totalItems, totalPages } }.
 * Callers should read `data.items` (not treat `data` as an array).
 */
export function useDepartments(params: Partial<ListDepartmentsParams> = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.DEPARTMENTS.LIST(params),
    queryFn: () =>
      departmentsApi.list({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        status: params.status,
      }),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.DEPARTMENTS.DETAIL(id),
    queryFn: () => departmentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentPayload) => departmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTMENTS.ALL });
      showToast.success("สร้างแผนกเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้างแผนกได้", err.message);
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentPayload }) =>
      departmentsApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTMENTS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTMENTS.DETAIL(vars.id) });
      showToast.success("แก้ไขแผนกเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถแก้ไขแผนกได้", err.message);
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTMENTS.ALL });
      showToast.success("ลบแผนกเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบแผนกได้", err.message);
    },
  });
}
