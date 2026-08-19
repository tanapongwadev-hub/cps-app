/**
 * Categories API - using centralized endpoints
 * 
 * Refactored to use @/infra/api/endpoints for maintainability.
 * Following Vercel Best Practices for API layer.
 */

import { apiClient } from "@/infra/api/client";
import { endpoints } from "@/infra/api/endpoints";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// API Functions - using centralized endpoints
// ============================================================================

export const categoriesApi = {
  /**
   * List categories with pagination and filters
   * Using centralized endpoint from @/infra/api/endpoints
   */
  list: (p: ListCategoriesParams) => {
    const q: Record<string, string | number | boolean> = { 
      page: p.page, 
      limit: toLimit(p.pageSize) 
    };
    if (p.search) q.search = p.search;
    if (p.isActive !== undefined) q.isActive = p.isActive;
    if (p.sortBy) q.sortBy = p.sortBy;
    if (p.sortOrder) q.sortOrder = p.sortOrder;
    
    // Note: Categories are under materials endpoints or have their own
    return apiClient.get<PaginatedList<Category>>(endpoints.materials.categories, { params: q });
  },

  /**
   * Get single category by ID
   */
  get: (id: string) => 
    apiClient.get<Category>(`/categories/${id}`),

  /**
   * Create new category
   */
  create: (d: CategoryPayload) => 
    apiClient.post<Category>(endpoints.materials.categories, d),

  /**
   * Update existing category
   */
  update: (id: string, d: UpdateCategoryPayload) => 
    apiClient.patch<Category>(`/categories/${id}`, d),

  /**
   * Deactivate category (soft delete)
   */
  deactivate: (id: string) => 
    apiClient.delete<Category>(`/categories/${id}`),

  /**
   * Restore deactivated category
   */
  restore: (id: string) => 
    apiClient.patch<Category>(`/categories/${id}/restore`),
};
