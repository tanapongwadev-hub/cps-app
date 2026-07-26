"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { Role } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";

export interface ListRolesParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

const rolesApi = {
  /** List roles. The real backend returns { items, meta: { page, limit, totalItems, totalPages } }. */
  list: (params: ListRolesParams) =>
    apiClient.get<PaginatedList<Role>>("/roles", {
      params: {
        page: params.page,
        // Real backend uses `limit`, not `pageSize` — translate it here.
        limit: toLimit(params.pageSize),
        search: params.search,
        status: params.status,
      },
    }),
  get: (id: string) => apiClient.get<Role>(`/roles/${id}`),
  create: (data: Partial<Role>) => apiClient.post<Role>("/roles", data),
  update: (id: string, data: Partial<Role>) => apiClient.patch<Role>(`/roles/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/roles/${id}`),
  clone: (id: string) => apiClient.post<Role>(`/roles/${id}/clone`, {}),
};

export function useRoles(params: ListRolesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.LIST(params),
    queryFn: () => rolesApi.list(params),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.DETAIL(id),
    queryFn: () => rolesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Role>) => rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("สร้าง Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้าง Role ได้", err.message);
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) =>
      rolesApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.DETAIL(vars.id) });
      showToast.success("แก้ไข Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถแก้ไข Role ได้", err.message);
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("ลบ Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบ Role ได้", err.message);
    },
  });
}

export function useCloneRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.clone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("คัดลอก Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถคัดลอก Role ได้", err.message);
    },
  });
}
