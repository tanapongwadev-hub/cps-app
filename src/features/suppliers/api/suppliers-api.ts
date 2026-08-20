import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface Supplier {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  taxId: string | null;
  contactName: string | null;
  telephone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  taxId?: string | null;
  contactName?: string | null;
  telephone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplierPayload extends Partial<SupplierPayload> {
  updatedAt: string;
}

export interface ListSuppliersParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const suppliersApi = {
  list: (params: ListSuppliersParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<Supplier>>("/suppliers", { params: query });
  },

  get: (id: string) => apiClient.get<Supplier>(`/suppliers/${id}`),

  create: (data: SupplierPayload) => apiClient.post<Supplier>("/suppliers", data),

  update: (id: string, data: UpdateSupplierPayload) =>
    apiClient.patch<Supplier>(`/suppliers/${id}`, data),

  deactivate: (id: string) => apiClient.delete<Supplier>(`/suppliers/${id}`),

  restore: (id: string) => apiClient.patch<Supplier>(`/suppliers/${id}/restore`),
};
