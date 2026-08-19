/**
 * Delivery Types API - using centralized endpoints
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

export interface DeliveryType {
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

export interface DeliveryTypePayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateDeliveryTypePayload extends Partial<DeliveryTypePayload> {
  updatedAt: string;
}

export interface ListDeliveryTypesParams {
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

export const deliveryTypesApi = {
  /**
   * List delivery types with pagination and filters
   */
  list: (params: ListDeliveryTypesParams) => {
    const query: Record<string, string | number | boolean> = { 
      page: params.page, 
      limit: toLimit(params.pageSize) 
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    
    return apiClient.get<PaginatedList<DeliveryType>>(endpoints.materials.deliveryTypes, { params: query });
  },

  get: (id: string) => 
    apiClient.get<DeliveryType>(`/delivery-types/${id}`),

  create: (data: DeliveryTypePayload) => 
    apiClient.post<DeliveryType>(endpoints.materials.deliveryTypes, data),

  update: (id: string, data: UpdateDeliveryTypePayload) => 
    apiClient.patch<DeliveryType>(`/delivery-types/${id}`, data),

  deactivate: (id: string) => 
    apiClient.delete<DeliveryType>(`/delivery-types/${id}`),

  restore: (id: string) => 
    apiClient.patch<DeliveryType>(`/delivery-types/${id}/restore`),
};
