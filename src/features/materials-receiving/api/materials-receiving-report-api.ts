import { apiClient } from "@/services/api-client";

// ============================================================================
// Types
// ============================================================================

export interface ReportMaterialsReceivingRow {
  id: string;
  runNo: string | null;
  internalLotNo: string;
  receiveDate: string;
  supplierProductionDate: string | null;
  supplierCode: string;
  supplierName: string;
  materialCode: string;
  materialName: string;
  materialType: string | null;
  receiveQuantity: string;
  unitSymbol: string;
  packingQuantity: number;
  packageCount: number;
  poNo: string | null;
  status: string;
  organizationName: string;
  confirmedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ReportMaterialsReceivingFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  supplierId?: string;
  materialId?: string;
  organizationId?: string;
}

export interface ReportMaterialsReceivingResponse {
  items: ReportMaterialsReceivingRow[];
  meta: {
    totalItems: number;
    generatedAt: string;
    filters: ReportMaterialsReceivingFilters;
  };
}

// ============================================================================
// API
// ============================================================================

export const materialsReceivingReportApi = {
  generate: (params: ReportMaterialsReceivingFilters) => {
    const query: Record<string, string> = {};
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;
    if (params.status) query.status = params.status;
    if (params.supplierId) query.supplierId = params.supplierId;
    if (params.materialId) query.materialId = params.materialId;
    if (params.organizationId) query.organizationId = params.organizationId;
    return apiClient.get<ReportMaterialsReceivingResponse>(
      "/materials-receiving/report",
      { params: query },
    );
  },
};
