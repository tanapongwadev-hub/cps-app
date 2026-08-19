/**
 * Loading Points API - using centralized endpoints
 */

import { apiClient } from "@/infra/api/client";
import { endpoints } from "@/infra/api/endpoints";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface LoadingPoint {
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

export interface LoadingPointPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateLoadingPointPayload extends Partial<LoadingPointPayload> {
  updatedAt: string;
}

export interface ListLoadingPointsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const loadingPointsApi = {
  list: (params: ListLoadingPointsParams) => {
    const query: Record<string, string | number | boolean> = { 
      page: params.page, 
      limit: toLimit(params.pageSize) 
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    
    return apiClient.get<PaginatedList<LoadingPoint>>(endpoints.materials.loadingPoints, { params: query });
  },

  get: (id: string) => apiClient.get<LoadingPoint>(`/loading-points/${id}`),
  create: (data: LoadingPointPayload) => apiClient.post<LoadingPoint>(endpoints.materials.loadingPoints, data),
  update: (id: string, data: UpdateLoadingPointPayload) => apiClient.patch<LoadingPoint>(`/loading-points/${id}`, data),
  deactivate: (id: string) => apiClient.delete<LoadingPoint>(`/loading-points/${id}`),
  restore: (id: string) => apiClient.patch<LoadingPoint>(`/loading-points/${id}/restore`),
};
