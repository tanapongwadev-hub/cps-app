/**
 * Units API - using centralized endpoints
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

// ============================================================================
// API Functions - using centralized endpoints
// ============================================================================

export const unitsApi = {
  /**
   * List units with pagination and filters
   * Using centralized endpoint from @/infra/api/endpoints
   */
  list: (params: ListUnitsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    
    return apiClient.get<PaginatedList<Unit>>(endpoints.materials.units, { params: query });
  },

  /**
   * Get single unit by ID
   */
  get: (id: string) => 
    apiClient.get<Unit>(`/units/${id}`),

  /**
   * Create new unit
   */
  create: (data: UnitPayload) => 
    apiClient.post<Unit>(endpoints.materials.units, data),

  /**
   * Update existing unit
   */
  update: (id: string, data: UpdateUnitPayload) => 
    apiClient.patch<Unit>(`/units/${id}`, data),

  /**
   * Deactivate unit (soft delete)
   */
  deactivate: (id: string) => 
    apiClient.delete<Unit>(`/units/${id}`),

  /**
   * Restore deactivated unit
   */
  restore: (id: string) => 
    apiClient.patch<Unit>(`/units/${id}/restore`),
};
