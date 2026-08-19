import { apiClient } from "@/infra/api/client";
import { endpoints } from "@/infra/api/endpoints";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface RejectReason {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RejectReasonPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateRejectReasonPayload extends Partial<RejectReasonPayload> {
  updatedAt: string;
}

export interface ListRejectReasonsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const rejectReasonsApi = {
  list: (params: ListRejectReasonsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<RejectReason>>(endpoints.materials.rejectReasons, { params: query });
  },
  get: (id: string) => apiClient.get<RejectReason>(`${endpoints.materials.rejectReasons}/${id}`),
  create: (data: RejectReasonPayload) => apiClient.post<RejectReason>(endpoints.materials.rejectReasons, data),
  update: (id: string, data: UpdateRejectReasonPayload) =>
    apiClient.patch<RejectReason>(`${endpoints.materials.rejectReasons}/${id}`, data),
  deactivate: (id: string) => apiClient.delete<RejectReason>(`${endpoints.materials.rejectReasons}/${id}`),
  restore: (id: string) => apiClient.patch<RejectReason>(`${endpoints.materials.rejectReasons}/${id}/restore`),
};
