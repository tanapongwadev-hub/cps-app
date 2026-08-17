import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

// ============================================================================
// Types
// ============================================================================

export type DisbursementStatus = "draft" | "confirmed" | "cancelled";
export type DisbursementType = "stock_cut" | "production";

export interface MaterialsDisbursementMaterial {
  id: string;
  code: string;
  name: string;
  unitId: string;
  availableStock: string;
}

export interface MaterialsDisbursementUnit {
  id: string;
  code: string;
  nameTh: string;
}

export interface DisbursementItem {
  id: string;
  materialId: string;
  requestedQuantity: string;
  disbursedQuantity: string;
  material?: { id: string; code: string; name: string } | null;
}

export interface DisbursementPackage {
  id: string;
  packageId: string;
  disbursedQuantity: string;
  package?: {
    id: string;
    lotDetailNo: string | null;
    qrCode: string | null;
    quantity: string;
    status: string;
  } | null;
}

export interface MaterialsDisbursement {
  id: string;
  disbursementNo: string;
  disbursementType: DisbursementType;
  disbursementDate: string;
  status: DisbursementStatus;
  reason: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  remark: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsDisbursementDetail extends MaterialsDisbursement {
  items: DisbursementItem[];
  packages: DisbursementPackage[];
}

export interface ListMaterialsDisbursementParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: DisbursementStatus;
  disbursementType?: DisbursementType;
  disbursementDateFrom?: string;
  disbursementDateTo?: string;
  sortBy?: "disbursementNo" | "disbursementDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface MaterialsDisbursementLookups {
  disbursementTypes: { value: string; label: string }[];
  materials: MaterialsDisbursementMaterial[];
  units: MaterialsDisbursementUnit[];
}

export interface CreateMaterialsDisbursementPayload {
  disbursementType: DisbursementType;
  disbursementDate: string;
  reason?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  items: { materialId: string; requestedQuantity: string }[];
  remark?: string | null;
}

export interface UpdateMaterialsDisbursementPayload {
  disbursementType?: DisbursementType;
  disbursementDate?: string;
  reason?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  items?: { materialId: string; requestedQuantity: string }[];
  remark?: string | null;
  updatedAt?: string;
}

export interface CancelMaterialsDisbursementPayload {
  cancelReason: string;
}

// ============================================================================
// API
// ============================================================================

export const materialsDisbursementApi = {
  list: (params: ListMaterialsDisbursementParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.disbursementType) query.disbursementType = params.disbursementType;
    if (params.disbursementDateFrom) query.disbursementDateFrom = params.disbursementDateFrom;
    if (params.disbursementDateTo) query.disbursementDateTo = params.disbursementDateTo;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<MaterialsDisbursement>>(
      "/materials-disbursement",
      { params: query },
    );
  },

  get: (id: string) =>
    apiClient.get<MaterialsDisbursementDetail>(`/materials-disbursement/${id}`),

  lookups: () =>
    apiClient.get<MaterialsDisbursementLookups>("/materials-disbursement/lookups"),

  create: (data: CreateMaterialsDisbursementPayload) =>
    apiClient.post<MaterialsDisbursement>("/materials-disbursement", data),

  update: (id: string, data: UpdateMaterialsDisbursementPayload) =>
    apiClient.patch<MaterialsDisbursement>(`/materials-disbursement/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/materials-disbursement/${id}`),

  confirm: (id: string) =>
    apiClient.post<MaterialsDisbursement>(`/materials-disbursement/${id}/confirm`),

  cancel: (id: string, data: CancelMaterialsDisbursementPayload) =>
    apiClient.post<MaterialsDisbursement>(`/materials-disbursement/${id}/cancel`, data),
};
