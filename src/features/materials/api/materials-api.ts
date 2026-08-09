import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

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

export interface MaterialPayload {
  code: string;
  name: string;
  type?: MaterialType | null;
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

export const materialsApi = {
  list: (params: ListMaterialsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.isActive !== undefined) query.isActive = params.isActive;
    if (params.type) query.type = params.type;
    if (params.unitId) query.unitId = params.unitId;
    if (params.modelId) query.modelId = params.modelId;
    if (params.deliveryTypeId) query.deliveryTypeId = params.deliveryTypeId;
    if (params.loadingPointId) query.loadingPointId = params.loadingPointId;
    if (params.supplierId) query.supplierId = params.supplierId;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<Material>>("/materials", { params: query });
  },

  get: (id: string) => apiClient.get<Material>(`/materials/${id}`),

  lookups: () => apiClient.get<MaterialLookups>("/materials/lookups"),

  create: (data: MaterialPayload) => apiClient.post<Material>("/materials", data),

  update: (id: string, data: UpdateMaterialPayload) =>
    apiClient.patch<Material>(`/materials/${id}`, data),

  deactivate: (id: string) => apiClient.delete<Material>(`/materials/${id}`),

  restore: (id: string) => apiClient.patch<Material>(`/materials/${id}/restore`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<MaterialImageUpload>("/materials/images", formData);
  },
};
