/**
 * Permissions API
 */
import { apiClient } from "@/services/api-client";
import type { Permission } from "@/types/permission";
import type { PaginatedList, PageQuery } from "@/types/paginated";

export const permissionsApi = {
  /** List permissions (paginated). The real backend returns { items, meta: { page, limit, totalItems, totalPages } }. */
  list: (query: PageQuery = { page: 1, pageSize: 20 }) =>
    apiClient.get<PaginatedList<Permission>>("/permissions", {
      params: {
        page: query.page,
        limit: query.pageSize,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    }),

  /** Get a single permission */
  get: (id: string) => apiClient.get<Permission>(`/permissions/${id}`),

  /** menus + actions สำหรับ dropdown ในฟอร์ม */
  options: () =>
    apiClient.get<{
      menus: { id: string; code: string; nameTh?: string; nameEn?: string }[];
      actions: { id: string; code: string; nameTh?: string; nameEn?: string }[];
    }>("/permissions/options"),

  /** Create a permission */
  create: (data: Partial<Permission>) => apiClient.post<Permission>("/permissions", data),

  /** Update a permission */
  update: (id: string, data: Partial<Permission>) =>
    apiClient.patch<Permission>(`/permissions/${id}`, data),

  /** Delete a permission */
  remove: (id: string) => apiClient.delete<{ message?: string }>(`/permissions/${id}`),
};
