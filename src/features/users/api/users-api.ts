/**
 * User API service
 */
import { apiClient } from "@/services/api-client";
import type { User } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface ListUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  departmentId?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export const usersApi = {
  /** List users. The real backend returns { items, meta: { page, limit, totalItems, totalPages } }. */
  list: (params: ListUsersParams) =>
    apiClient.get<PaginatedList<User>>("/users", {
      params: {
        page: params.page,
        // Real backend uses `limit`, not `pageSize` — translate it here.
        limit: toLimit(params.pageSize),
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
        roleId: params.roleId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    }),

  get: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: Partial<User> & { password?: string; roleIds: string[] }) =>
    apiClient.post<User>("/users", data),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/users/${id}`),

  updateStatus: (id: string, status: User["status"]) =>
    apiClient.patch<User>(`/users/${id}/status`, { status }),

  resetPassword: (id: string) =>
    apiClient.post<{ success: boolean }>(`/users/${id}/reset-password`, {}),
};
