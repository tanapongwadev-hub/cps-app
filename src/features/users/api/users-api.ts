/**
 * User API service — aligned with `API_ENDPOINTS.md` and the real NestJS DTOs.
 *
 *  GET    /users                  — list (page, limit, search, status?)
 *  GET    /users/:id              — detail (no `fullName`, no `phone`, has `telephone`)
 *  POST   /users                  — create
 *                                   body: { username, password, firstName, lastName, email,
 *                                           telephone?, assignments: [{departmentId, roleId, isPrimary?}] }
 *  PATCH  /users/:id              — update personal info
 *                                   body: { firstName, lastName, email, telephone? }
 *                                   (rejects roleIds, assignments, status, phone, isActive)
 *  PATCH  /users/:id/status       — toggle active flag
 *                                   body: { isActive: boolean }
 *  POST   /users/:id/reset-password — admin reset (sends new password via email)
 *  GET    /users/:id/assignments  — list (user, department, role) tuples
 *  POST   /users/:id/assignments  — add one tuple
 *                                   body: { departmentId, roleId }   (no isPrimary, no userId)
 *  DELETE /users/:id              — delete user
 */
import { apiClient } from "@/services/api-client";
import type { User, UserAssignment } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface ListUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  /** UI "status" filter — "active" | "inactive" (mapped to `isActive` query) */
  status?: string;
  departmentId?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  /** Required by the backend (at least one) */
  assignments: { departmentId: string; roleId: string; isPrimary?: boolean }[];
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
}

export interface AddUserAssignmentPayload {
  departmentId: string;
  roleId: string;
}

export const usersApi = {
  /**
   * List users. The real backend returns
   *   { items, meta: { page, limit, totalItems, totalPages } }
   * and uses `limit` (not `pageSize`).
   */
  list: (params: ListUsersParams) => {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: toLimit(params.pageSize),
      search: params.search,
    };
    // Map UI "status" filter to backend `isActive` boolean query.
    if (params.status === "active") query.isActive = true;
    else if (params.status === "inactive") query.isActive = false;
    if (params.departmentId) query.departmentId = params.departmentId;
    if (params.roleId) query.roleId = params.roleId;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<User>>("/users", { params: query });
  },

  get: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: CreateUserPayload) => apiClient.post<User>("/users", data),

  update: (id: string, data: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<{ success: boolean; message?: string }>(`/users/${id}`),

  /** Toggle the active flag (replaces the old `status: "active"|"inactive"` payload). */
  updateStatus: (id: string, payload: UpdateUserStatusPayload) =>
    apiClient.patch<User>(`/users/${id}/status`, payload),

  resetPassword: (id: string) =>
    apiClient.post<{ success: boolean }>(`/users/${id}/reset-password`, {}),

  listAssignments: (id: string) =>
    apiClient.get<UserAssignment[]>(`/users/${id}/assignments`),

  addAssignment: (id: string, payload: AddUserAssignmentPayload) =>
    apiClient.post<UserAssignment>(`/users/${id}/assignments`, payload),
};
