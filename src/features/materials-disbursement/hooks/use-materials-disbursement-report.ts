"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  materialsDisbursementReportApi,
  type ReportMaterialsDisbursementFilters,
  type ReportMaterialsDisbursementResponse,
} from "../api/materials-disbursement-report-api";

export const materialsDisbursementReportKeys = {
  all: ["materials-disbursement-report"] as const,
  report: (params: ReportMaterialsDisbursementFilters) =>
    [...materialsDisbursementReportKeys.all, "report", params] as const,
};

export function useMaterialsDisbursementReport(
  params: ReportMaterialsDisbursementFilters,
): UseQueryResult<ReportMaterialsDisbursementResponse, Error> {
  return useQuery({
    queryKey: materialsDisbursementReportKeys.report(params),
    queryFn: () => materialsDisbursementReportApi.generate(params),
  });
}
