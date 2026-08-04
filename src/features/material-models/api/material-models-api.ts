import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface MaterialModel {
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

export interface MaterialModelPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateMaterialModelPayload extends Partial<MaterialModelPayload> {
  updatedAt: string;
}

export interface ListMaterialModelsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const materialModelsApi = {
  list: (params: ListMaterialModelsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<MaterialModel>>("/material-models", { params: query });
  },
  get: (id: string) => apiClient.get<MaterialModel>(`/material-models/${id}`),
  create: (data: MaterialModelPayload) => apiClient.post<MaterialModel>("/material-models", data),
  update: (id: string, data: UpdateMaterialModelPayload) =>
    apiClient.patch<MaterialModel>(`/material-models/${id}`, data),
  deactivate: (id: string) => apiClient.delete<MaterialModel>(`/material-models/${id}`),
  restore: (id: string) => apiClient.patch<MaterialModel>(`/material-models/${id}/restore`),
};
