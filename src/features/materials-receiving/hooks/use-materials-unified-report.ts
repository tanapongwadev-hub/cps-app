"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  materialsUnifiedReportApi,
  type UnifiedReportFilters,
  type UnifiedReportResponse,
} from "../api/materials-unified-report-api";

export const materialsUnifiedReportKeys = {
  all: ["materials-unified-report"] as const,
  report: (params: UnifiedReportFilters) =>
    [...materialsUnifiedReportKeys.all, "report", params] as const,
};

export function useMaterialsUnifiedReport(
  params: UnifiedReportFilters,
): UseQueryResult<UnifiedReportResponse, Error> {
  return useQuery({
    queryKey: materialsUnifiedReportKeys.report(params),
    queryFn: () => materialsUnifiedReportApi.generate(params),
    // Wait for user to trigger search explicitly via refetch()
    enabled: false,
  });
}
