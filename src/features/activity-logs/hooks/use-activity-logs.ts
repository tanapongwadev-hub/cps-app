/**
 * Activity Logs React Query hooks
 */
import { useQuery } from "@tanstack/react-query";
import { activityLogsApi, type ListActivityLogsParams } from "../api/activity-logs-api";
import { QUERY_KEYS } from "@/constants/app";

export function useActivityLogsList(params: ListActivityLogsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_LOGS.LIST(params),
    queryFn: () => activityLogsApi.list(params),
    staleTime: 30 * 1000,
  });
}

/** Fetch a single activity log by id (used by detail dialog). */
export function useActivityLog(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_LOGS.DETAIL(id ?? ""),
    queryFn: () => activityLogsApi.get(id as string),
    enabled: !!id && enabled,
  });
}
