/**
 * Materials API - using centralized endpoints
 * 
 * Refactored to use @/infra/api/endpoints for maintainability.
 * Following Vercel Best Practices for API layer.
 */

import { apiClient } from "@/infra/api/client";
import { endpoints } from "@/infra/api/endpoints";
import type { PaginatedResponse } from "@/infra/api";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

// ============================================================================
// Types
// ============================================================================

export interface MaterialLookupOption {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  symbol?: string | null;
}

export interface MaterialSupplierIdentity {
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

/** The persisted supplier-material association, including its own status. */
export interface MaterialSupplier {
  id: string;
  materialId: string;
  supplierId: string;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: MaterialSupplierIdentity;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  type: string | null;
  materialType: MaterialShape | null;
  ratio: number | null;
  unitId: string;
  deliveryTypeId: string | null;
  modelId: string | null;
  loadingPointId: string | null;
  processLineName: string | null;
  scale: string | null;
  imagePath: string | null;
  specification: string | null;
  description: string | null;
  packingQuantity: number | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  unit: MaterialLookupOption;
  deliveryType: MaterialLookupOption | null;
  model: MaterialLookupOption | null;
  loadingPoint: MaterialLookupOption | null;
  /** The current backend response maps active associations to Supplier rows. */
  suppliers: MaterialSupplierIdentity[];
}

export type MaterialType = "PC" | "OF" | "OF_MAT";

/**
 * Material physical shape — how the material is delivered.
 *
 * - `PCS`  : discrete pieces
 * - `PIPE` : pipe / bar stock (cut into N pieces per ratio)
 * - `SHEET`: flat sheet
 * - `COIL` : coil / roll
 */
export type MaterialShape = "PCS" | "PIPE" | "SHEET" | "COIL";

/** Materials that require a `ratio` value (i.e. anything other than PCS). */
export const MATERIAL_SHAPES_REQUIRING_RATIO: ReadonlySet<MaterialShape> =
  new Set<MaterialShape>(["PIPE", "SHEET", "COIL"]);

export function materialShapeRequiresRatio(shape: MaterialShape | null): boolean {
  if (!shape) return false;
  return MATERIAL_SHAPES_REQUIRING_RATIO.has(shape);
}

export interface MaterialPayload {
  code: string;
  name: string;
  type?: MaterialType | null;
  materialType?: MaterialShape | null;
  ratio?: number | null;
  unitId: string;
  deliveryTypeId?: string | null;
  modelId?: string | null;
  loadingPointId?: string | null;
  processLineName?: string | null;
  scale?: string | null;
  imagePath?: string | null;
  specification?: string | null;
  description?: string | null;
  packingQuantity?: number | null;
  supplierIds?: string[];
  isActive?: boolean;
}

export interface UpdateMaterialPayload extends Partial<MaterialPayload> {
  updatedAt: string;
}

export interface ListMaterialsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  type?: MaterialType;
  materialType?: MaterialShape;
  unitId?: string;
  modelId?: string;
  deliveryTypeId?: string;
  loadingPointId?: string;
  supplierId?: string;
  sortBy?: "code" | "name" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface MaterialLookups {
  units: MaterialLookupOption[];
  suppliers: MaterialSupplierIdentity[];
  models: MaterialLookupOption[];
  deliveryTypes: MaterialLookupOption[];
  loadingPoints: MaterialLookupOption[];
}

export interface MaterialImageUpload {
  imagePath: string;
  previewUrl: string;
}

// ============================================================================
// API Functions
// ============================================================================

export const materialsApi = {
  /**
   * List materials with pagination and filters
   * Using centralized endpoint from @/infra/api/endpoints
   */
  list: (params: ListMaterialsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.type) query.type = params.type;
    if (params.materialType) query.materialType = params.materialType;
    if (params.unitId) query.unitId = params.unitId;
    if (params.modelId) query.modelId = params.modelId;
    if (params.deliveryTypeId) query.deliveryTypeId = params.deliveryTypeId;
    if (params.loadingPointId) query.loadingPointId = params.loadingPointId;
    if (params.supplierId) query.supplierId = params.supplierId;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    
    return apiClient.get<PaginatedList<Material>>(endpoints.materials.list, { params: query });
  },

  /**
   * Get single material by ID
   */
  get: (id: string) => 
    apiClient.get<Material>(endpoints.materials.detail(id)),

  /**
   * Get lookup data for forms (units, suppliers, models, etc.)
   */
  lookups: () => 
    apiClient.get<MaterialLookups>(`${endpoints.materials.list}/lookups`),

  /**
   * Create new material
   */
  create: (data: MaterialPayload) => 
    apiClient.post<Material>(endpoints.materials.create, data),

  /**
   * Update existing material
   */
  update: (id: string, data: UpdateMaterialPayload) =>
    apiClient.patch<Material>(endpoints.materials.update(id), data),

  /**
   * Deactivate material (soft delete)
   */
  deactivate: (id: string) => 
    apiClient.delete<Material>(endpoints.materials.delete(id)),

  /**
   * Restore deactivated material
   */
  restore: (id: string) => 
    apiClient.patch<Material>(`${endpoints.materials.detail(id)}/restore`),

  /**
   * Upload material image
   */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<MaterialImageUpload>(
      `${endpoints.materials.list}/images`, 
      formData
    );
  },
};

// ============================================================================
// Stock Balance API
// ============================================================================

export interface StockBalance {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: string;
  unitCode: string;
  unitNameTh: string;
  lastMovementAt: string | null;
}

export const stockBalanceApi = {
  getByMaterialId: (materialId: string) =>
    apiClient.get<StockBalance>(`/stock-balances/${materialId}`),

  getAll: () => 
    apiClient.get<StockBalance[]>("/stock-balances"),
};
