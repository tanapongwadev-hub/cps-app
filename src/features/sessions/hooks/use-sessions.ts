/**
 * Sessions React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions-api";
import type { PageQuery } from "@/types/paginated";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";

export function useSessions(query: PageQuery = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: QUERY_KEYS.SESSIONS.LIST(query),
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
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS.ALL });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถ revoke session ได้", err.message);
    },
  });
}

/**
 * Revoke every active session belonging to a user.
 * Used by admin to force-logout a user across all devices.
 * Real backend: POST /sessions/revoke-all/:userId
 */
export function useRevokeAllSessionsForUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => sessionsApi.revokeAllForUser(userId),
    onSuccess: (result, userId) => {
      const revoked = (result as { revoked?: number } | undefined)?.revoked;
      showToast.success(
        revoked != null
          ? `บังคับออกจากระบบเรียบร้อย (${revoked} เซสชัน)`
          : "บังคับออกจากระบบเรียบร้อย",
      );
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS.ALL });
      // Invalidate users list to refresh any "is online" indicator
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      // Side-effect: this could be the current user
      void userId;
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถบังคับออกจากระบบได้", err.message);
    },
  });
}
