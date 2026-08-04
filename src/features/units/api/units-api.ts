import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface Unit {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  symbol: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnitPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  symbol?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateUnitPayload extends Partial<UnitPayload> {
  updatedAt: string;
}

export interface ListUnitsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const unitsApi = {
  list: (params: ListUnitsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<Unit>>("/units", { params: query });
  },

  get: (id: string) => apiClient.get<Unit>(`/units/${id}`),

  create: (data: UnitPayload) => apiClient.post<Unit>("/units", data),

  update: (id: string, data: UpdateUnitPayload) =>
    apiClient.patch<Unit>(`/units/${id}`, data),

  deactivate: (id: string) => apiClient.delete<Unit>(`/units/${id}`),

  restore: (id: string) => apiClient.patch<Unit>(`/units/${id}/restore`),
};
