/**
 * Products & BOMs API types
 * Frontend mirrors the NestJS backend DTOs (products schema v2)
 */

import { apiClient } from "@/services/api-client";

export interface ProductLookupOption {
  id: string;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  /** optional helper for some dropdowns (e.g. product model brand) */
  brand?: string | null;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  unitId: string;
  modelId: string;
  customerId: string;
  packing: number;
  locationId: string;
  safetyStock: number;
  productTypeId: string;
  lotSize: number;
  minStock: number;
  deliveryTypeId: string;
  scale: string | null;
  loadingPointId: string;
  processLineId: string;
  productImagePath: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  unit: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  model: Pick<ProductLookupOption, "id" | "code" | "nameTh" | "brand"> | null;
  customer: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  location: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  productType: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  deliveryType: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  loadingPoint: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
  processLine: Pick<ProductLookupOption, "id" | "code" | "nameTh"> | null;
}

export interface ProductPayload {
  code: string;
  name: string;
  unitId: string;
  modelId: string;
  customerId: string;
  locationId: string;
  productTypeId: string;
  deliveryTypeId: string;
  loadingPointId: string;
  processLineId: string;
  packing: number;
  lotSize: number;
  /** Optional: override the auto-computed safety_stock = lotSize */
  safetyStock?: number | null;
  /** Optional: override the auto-computed min_stock = packing */
  minStock?: number | null;
  scale?: string | null;
  productImagePath?: string | null;
  isActive?: boolean;
}

export interface UpdateProductPayload extends Partial<ProductPayload> {
  updatedAt: string;
}

export interface ListProductsParams {
  /** Local UI state — backend currently returns all items */
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  modelId?: string;
  customerId?: string;
  productTypeId?: string;
  locationId?: string;
  processLineId?: string;
  sortBy?: "code" | "name" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductLookups {
  units: Pick<ProductLookupOption, "id" | "code" | "nameTh">[];
  productModels: ProductLookupOption[];
  customers: ProductLookupOption[];
  locations: ProductLookupOption[];
  productTypes: ProductLookupOption[];
  deliveryTypes: ProductLookupOption[];
  loadingPoints: ProductLookupOption[];
  processLines: ProductLookupOption[];
}

export interface ProductImageUpload {
  imagePath: string;
  previewUrl: string;
}

export interface PaginatedProducts {
  items: Product[];
  meta: { totalItems: number };
}

function toQueryParams(params: ListProductsParams): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {};
  if (params.search) q.search = params.search;
  if (params.isActive !== undefined) q.isActive = params.isActive;
  if (params.modelId) q.modelId = params.modelId;
  if (params.customerId) q.customerId = params.customerId;
  if (params.productTypeId) q.productTypeId = params.productTypeId;
  if (params.locationId) q.locationId = params.locationId;
  if (params.processLineId) q.processLineId = params.processLineId;
  if (params.sortBy) q.sortBy = params.sortBy;
  if (params.sortOrder) q.sortOrder = params.sortOrder;
  return q;
}

export const productsApi = {
  list: (params: ListProductsParams = {}) =>
    apiClient.get<PaginatedProducts>("/products", { params: toQueryParams(params) }),

  get: (id: string) => apiClient.get<Product>(`/products/${id}`),

  lookups: () => apiClient.get<ProductLookups>("/products/lookups"),

  create: (data: ProductPayload) => apiClient.post<Product>("/products", data),

  update: (id: string, data: UpdateProductPayload) =>
    apiClient.patch<Product>(`/products/${id}`, data),

  deactivate: (id: string) => apiClient.delete<Product>(`/products/${id}`),

  restore: (id: string) => apiClient.patch<Product>(`/products/${id}/restore`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<ProductImageUpload>("/products/images", formData);
  },
};

// ============================================================================
// BOMs
// ============================================================================

export const bomsApi = {
  listByProduct: (productId: string) =>
    apiClient.get(`/boms/product/${productId}`),

  get: (id: string) => apiClient.get(`/boms/${id}`),

  create: (data: CreateBomPayload) => apiClient.post("/boms", data),

  update: (id: string, data: UpdateBomPayload) =>
    apiClient.patch(`/boms/${id}`, data),

  addItem: (bomId: string, data: CreateBomItemPayload) =>
    apiClient.post(`/boms/${bomId}/items`, data),

  removeItem: (bomId: string, itemId: string) =>
    apiClient.delete(`/boms/${bomId}/items/${itemId}`),

  activate: (id: string) => apiClient.patch(`/boms/${id}/activate`),

  deactivate: (id: string) => apiClient.patch(`/boms/${id}/deactivate`),

  remove: (id: string) => apiClient.delete(`/boms/${id}`),
};

// ============================================================================
// BOM types (unchanged)
// ============================================================================

export type BomStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface BomItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  sortOrder: number;
  quantity: number;
  unitId: string;
  unitNameTh: string;
  isScrap: boolean;
  wastagePercent: number | null;
  remark: string | null;
}

export interface ProductBom {
  id: string;
  productId: string;
  version: string;
  status: BomStatus;
  specification: string | null;
  remark: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  product: Pick<Product, "id" | "code" | "name">;
  items: BomItem[];
}

export interface CreateBomItemPayload {
  materialId: string;
  quantity: number;
  unitId: string;
  isScrap?: boolean;
  wastagePercent?: number | null;
  remark?: string | null;
}

export interface CreateBomPayload {
  productId: string;
  specification?: string | null;
  remark?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  items: CreateBomItemPayload[];
}

export interface UpdateBomPayload {
  specification?: string | null;
  remark?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  updatedAt: string;
}
