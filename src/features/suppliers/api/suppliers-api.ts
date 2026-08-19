/**
 * Suppliers API - using centralized endpoints
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

// ============================================================================
// API Functions - using centralized endpoints
// ============================================================================

export const suppliersApi = {
  /**
   * List suppliers with pagination and filters
   * Using centralized endpoint from @/infra/api/endpoints
   */
  list: (params: ListSuppliersParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    
    return apiClient.get<PaginatedList<Supplier>>(endpoints.materials.suppliers, { params: query });
  },

  /**
   * Get single supplier by ID
   */
  get: (id: string) => 
    apiClient.get<Supplier>(`/suppliers/${id}`),

  /**
   * Create new supplier
   */
  create: (data: SupplierPayload) => 
    apiClient.post<Supplier>(endpoints.materials.suppliers, data),

  /**
   * Update existing supplier
   */
  update: (id: string, data: UpdateSupplierPayload) => 
    apiClient.patch<Supplier>(`/suppliers/${id}`, data),

  /**
   * Deactivate supplier (soft delete)
   */
  deactivate: (id: string) => 
    apiClient.delete<Supplier>(`/suppliers/${id}`),

  /**
   * Restore deactivated supplier
   */
  restore: (id: string) => 
    apiClient.patch<Supplier>(`/suppliers/${id}/restore`),
};
