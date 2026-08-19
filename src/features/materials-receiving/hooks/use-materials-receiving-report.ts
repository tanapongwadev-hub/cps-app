"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  materialsReceivingReportApi,
  type ReportMaterialsReceivingFilters,
  type ReportMaterialsReceivingResponse,
} from "../api/materials-receiving-report-api";

export const materialsReceivingReportKeys = {
  all: ["materials-receiving-report"] as const,
  report: (params: ReportMaterialsReceivingFilters) =>
    [...materialsReceivingReportKeys.all, "report", params] as const,
};

export function useMaterialsReceivingReport(
  params: ReportMaterialsReceivingFilters,
): UseQueryResult<ReportMaterialsReceivingResponse, Error> {
  return useQuery({
    queryKey: materialsReceivingReportKeys.report(params),
    queryFn: () => materialsReceivingReportApi.generate(params),
  });
}
