/**
 * Permissions React Query hooks
 */
import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissions-api";
import type { PageQuery } from "@/types/paginated";

export const PERMISSIONS_QUERY_KEY = "permissions";

export function usePermissions(query: PageQuery = { page: 1, pageSize: 100 }) {
  return useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, query],
    queryFn: () => permissionsApi.list(query),
    staleTime: 5 * 60 * 1000,
  });
}
