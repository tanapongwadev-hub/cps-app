/**
 * Sessions React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions-api";
import type { PageQuery } from "@/types/paginated";
import { showToast } from "@/lib/toast";

export const SESSIONS_QUERY_KEY = "sessions";

export function useSessions(query: PageQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: [SESSIONS_QUERY_KEY, query],
    queryFn: () => sessionsApi.list(query),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      sessionsApi.revoke(id, reason),
    onSuccess: () => {
      showToast.success("Revoke session สำเร็จ");
      qc.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถ revoke session ได้", err.message);
    },
  });
}
