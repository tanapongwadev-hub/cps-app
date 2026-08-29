/**
 * Activity Logs API
 * Aligned with the real NestJS backend (mounted at /audit-logs).
 *
 *  GET    /audit-logs        — list (page, limit, userId?, action?)
 *  GET    /audit-logs/:id    — detail
 */
import { apiClient } from "@/services/api-client";
import type { ActivityLog } from "@/features/activity-logs/types";
import type { PaginatedResponse } from "@/types/common";

export interface ListActivityLogsParams {
  page: number;
  pageSize: number;
  search?: string;
  userId?: string;
  action?: string;
  module?: string;
}

export const activityLogsApi = {
  /**
   * List activity logs. Real backend returns
   *   { items, totalItems, totalPages } — using the shared PaginatedResponse
   * shape (NOT the new { items, meta } envelope used by other endpoints).
   */
  list: (params: ListActivityLogsParams) =>
    apiClient.get<PaginatedResponse<ActivityLog>>("/audit-logs", {
      params: {
        page: params.page,
        limit: params.pageSize,
        userId: params.userId,
        action: params.action,
      },
    }),

  /** Get a single activity log by id */
  get: (id: string) => apiClient.get<ActivityLog>(`/audit-logs/${id}`),
};
