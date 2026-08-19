import { apiClient } from "@/services/api-client";

export type DocType = "receive" | "disbursement";

export interface UnifiedReportRow {
  docType: DocType;
  docDate: string;
  docNo: string;
  materialCode: string;
  materialName: string;
  materialType: string | null;
  unitSymbol: string;
  quantityIn: string | null;
  quantityOut: string | null;
  subLabel: string | null;
  sourceLotNo: string | null;
  poNo: string | null;
  supplierName: string | null;
  status: string;
  statusLabel: string;
}

export type ReportPeriod = "today" | "this_month" | "this_year" | "custom";

export interface UnifiedReportFilters {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  startDateDisbursement?: string;
  endDateDisbursement?: string;
  type?: "receive" | "disbursement" | "both";
  materialId?: string;
}

export interface UnifiedReportResponse {
  items: UnifiedReportRow[];
  meta: {
    totalItems: number;
    totalReceive: number;
    totalDisbursement: number;
    generatedAt: string;
    filters: UnifiedReportFilters;
  };
}

export const materialsUnifiedReportApi = {
  generate: (params: UnifiedReportFilters) => {
    const query: Record<string, string> = {};
    if (params.period) query.period = params.period;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;
    if (params.startDateDisbursement) query.startDateDisbursement = params.startDateDisbursement;
    if (params.endDateDisbursement) query.endDateDisbursement = params.endDateDisbursement;
    if (params.type) query.type = params.type;
    if (params.materialId) query.materialId = params.materialId;
    return apiClient.get<UnifiedReportResponse>(
      "/materials-receiving/unified-report",
      { params: query },
    );
  },
};
