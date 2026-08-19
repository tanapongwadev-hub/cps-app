import { apiClient } from "@/services/api-client";

// ============================================================================
// Types
// ============================================================================

export interface ReportMaterialsDisbursementRow {
  id: string;
  disbursementNo: string;
  disbursementDate: string;
  disbursementType: string;
  disbursementTypeLabel: string;
  reason: string | null;
  materialCode: string;
  materialName: string;
  materialType: string | null;
  requestedQuantity: string;
  disbursedQuantity: string;
  unitSymbol: string;
  status: string;
  statusLabel: string;
  sourceLotNo: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ReportMaterialsDisbursementFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  disbursementType?: string;
}

export interface ReportMaterialsDisbursementResponse {
  items: ReportMaterialsDisbursementRow[];
  meta: {
    totalItems: number;
    totalDocuments: number;
    generatedAt: string;
    filters: ReportMaterialsDisbursementFilters;
  };
}

// ============================================================================
// API
// ============================================================================

export const materialsDisbursementReportApi = {
  generate: (params: ReportMaterialsDisbursementFilters) => {
    const query: Record<string, string> = {};
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;
    if (params.status) query.status = params.status;
    if (params.disbursementType) query.disbursementType = params.disbursementType;
    return apiClient.get<ReportMaterialsDisbursementResponse>(
      "/materials-disbursement/report",
      { params: query },
    );
  },
};
