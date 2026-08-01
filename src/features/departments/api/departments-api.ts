/**
 * Department API service — aligned with `API_ENDPOINTS.md` and the real
 * NestJS backend.
 *
 *   GET    /departments             — list (page, limit, search, status?)
 *   GET    /departments/:id         — detail
 *   POST   /departments             — create { code, nameTh, nameEn }
 *   PATCH  /departments/:id         — update { nameTh, nameEn }
 *   DELETE /departments/:id         — delete
 *   GET    /departments/tree        — tree (backend returns 500 — UI
 *                                     builds the tree from the flat list)
 *
 * Notes on the real backend:
 *   - POST /departments accepts ONLY `code, nameTh, nameEn` (anything else
 *     returns 400 VALIDATION_ERROR)
 *   - PATCH /departments/:id accepts ONLY `nameTh, nameEn`
 *   - There's no `isActive` toggle endpoint — the active flag is admin-only
 *   - The list response uses `limit` (not `pageSize`) and the standard
 *     `{ items, meta: { page, limit, totalItems, totalPages } }` envelope
 */
import { apiClient } from "@/services/api-client";
import type { Department } from "@/types/department";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface ListDepartmentsParams {
  page: number;
  pageSize: number;
  search?: string;
  /** UI "status" filter — "active" | "inactive" (mapped to `isActive` query) */
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateDepartmentPayload {
  code: string;
  nameTh: string;
  nameEn: string;
}

export interface UpdateDepartmentPayload {
  nameTh: string;
  nameEn: string;
}

export const departmentsApi = {
  /**
   * List departments. Real backend returns
   *   { items, meta: { page, limit, totalItems, totalPages } }
   */
  list: (params: ListDepartmentsParams) => {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: toLimit(params.pageSize),
      search: params.search,
    };
    if (params.status === "active") query.isActive = true;
    else if (params.status === "inactive") query.isActive = false;
    return apiClient.get<PaginatedList<Department>>("/departments", {
      params: query,
    });
  },

  get: (id: string) => apiClient.get<Department>(`/departments/${id}`),

  create: (data: CreateDepartmentPayload) =>
    apiClient.post<Department>("/departments", data),

  update: (id: string, data: UpdateDepartmentPayload) =>
    apiClient.patch<Department>(`/departments/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/departments/${id}`,
    ),
};
