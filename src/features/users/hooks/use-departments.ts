"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { Department } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";
import { QUERY_KEYS } from "@/constants/app";

export function useDepartments() {
  return useQuery({
    queryKey: QUERY_KEYS.DEPARTMENTS.ALL,
    // The real backend returns { items, meta: { page, limit, totalItems, totalPages } }.
    // Callers should read `data.items` rather than treating `data` as an array.
    queryFn: () => apiClient.get<PaginatedList<Department>>("/departments"),
  });
}
