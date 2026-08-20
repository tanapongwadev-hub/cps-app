import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface Category {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  parentId: string | null;
  sortOrder: number;
  iconColor: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  iconColor?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryPayload extends Partial<CategoryPayload> {
  updatedAt: string;
}

export interface ListCategoriesParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "code" | "nameTh" | "sortOrder" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const categoriesApi = {
  list: (p: ListCategoriesParams) => {
    const q: Record<string, string | number | boolean> = { page: p.page, limit: toLimit(p.pageSize) };
    if (p.search) q.search = p.search;
    if (p.isActive !== undefined) q.isActive = p.isActive;
    if (p.sortBy) q.sortBy = p.sortBy;
    if (p.sortOrder) q.sortOrder = p.sortOrder;
    return apiClient.get<PaginatedList<Category>>("/categories", { params: q });
  },
  get: (id: string) => apiClient.get<Category>(`/categories/${id}`),
  create: (d: CategoryPayload) => apiClient.post<Category>("/categories", d),
  update: (id: string, d: UpdateCategoryPayload) => apiClient.patch<Category>(`/categories/${id}`, d),
  deactivate: (id: string) => apiClient.delete<Category>(`/categories/${id}`),
  restore: (id: string) => apiClient.patch<Category>(`/categories/${id}/restore`),
};
