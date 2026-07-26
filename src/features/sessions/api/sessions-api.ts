/**
 * Sessions API
 */
import { apiClient } from "@/services/api-client";
import type { UserSession } from "@/types/session";
import type { PaginatedList, PageQuery } from "@/types/paginated";

export const sessionsApi = {
  /** List sessions (paginated) */
  list: (query: PageQuery = { page: 1, pageSize: 20 }) =>
    apiClient.get<PaginatedList<UserSession>>("/sessions", {
      params: {
        page: query.page,
        limit: query.pageSize,
        userId: query.userId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    }),

  /** Get a single session */
  get: (id: string) => apiClient.get<UserSession>(`/sessions/${id}`),

  /** Revoke one session (backend uses PATCH /sessions/:id/revoke) */
  revoke: (id: string, reason?: string) =>
    apiClient.patch<UserSession>(`/sessions/${id}/revoke`, { reason }),

  /** Revoke all sessions for a user (POST /sessions/revoke-all/:userId) */
  revokeAllForUser: (userId: string) =>
    apiClient.post<{ revoked: number }>(`/sessions/revoke-all/${userId}`, {}),
};
