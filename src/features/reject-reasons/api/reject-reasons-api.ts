import { apiClient } from "@/services/api-client";
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
    return apiClient.get<PaginatedList<RejectReason>>("/reject-reasons", { params: query });
  },
  get: (id: string) => apiClient.get<RejectReason>(`/reject-reasons/${id}`),
  create: (data: RejectReasonPayload) => apiClient.post<RejectReason>("/reject-reasons", data),
  update: (id: string, data: UpdateRejectReasonPayload) =>
    apiClient.patch<RejectReason>(`/reject-reasons/${id}`, data),
  deactivate: (id: string) => apiClient.delete<RejectReason>(`/reject-reasons/${id}`),
  restore: (id: string) => apiClient.patch<RejectReason>(`/reject-reasons/${id}/restore`),
};
