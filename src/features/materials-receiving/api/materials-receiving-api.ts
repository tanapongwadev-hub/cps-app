import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

// ============================================================================
// Types
// ============================================================================

export type MaterialsReceivingStatus = "draft" | "confirmed" | "cancelled";

/** Material physical shape — matches `MaterialShape` in materials module. */
export type MaterialsReceivingMaterialShape =
  | "PCS"
  | "PIPE"
  | "SHEET"
  | "COIL";

export interface MaterialsReceivingSupplier {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
}

export interface MaterialsReceivingMaterial {
  id: string;
  code: string;
  name: string;
}

export interface MaterialsReceivingUnit {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
}

export interface MaterialsReceivingPackage {
  id: string;
  materialReceivingId: string;
  packageNo: number;
  lotDetailNo: string | null;
  quantity: string;
  qrCode: string | null;
  status: string;
}

/** QR Code payload embedded in the QR image (matches backend QrPayload v1.0) */
export interface MaterialsReceivingQrPayload {
  version: string;
  internalLotNo: string;
  materialCode: string;
  receiveQuantity: string;
  supplierLotNo: string | null;
}

/** QR payload for pieces QR Code — used for material_type = PIPE/SHEET/COIL only (matches backend PiecesQrPayload v2.0) */
export interface MaterialsReceivingPiecesQrPayload {
  version: string;
  internalLotNo: string;
  runNo: string | null;
  materialCode: string;
  piecesQuantity: string;
  materialType: string;
}

export interface MaterialsReceiving {
  id: string;
  internalLotNo: string;
  organizationId: string;
  supplierId: string;
  materialId: string;
  unitId: string;
  receiveQuantity: string;
  packingQuantity: number;
  packageCount: number;
  /**
   * จำนวนชิ้นที่ใช้ได้จริง (สำหรับ PIPE/SHEET/COIL = receiveQuantity × ratio)
   * สำหรับ PCS จะเป็น null
   */
  piecesQuantity: string | null;
  supplierLotNo: string | null;
  supplierProductionDate: string | null;
  receiveDate: string;
  status: MaterialsReceivingStatus;
  /** เลขที่ PO — header ของเอกสาร (optional) */
  poNo: string | null;
  /** Snapshot of material.materialType at receive time */
  materialType: MaterialsReceivingMaterialShape | null;
  /** Snapshot of material.ratio at receive time (only for PIPE/SHEET/COIL) */
  ratio: number | null;
  /** Path ของไฟล์แนบ (รูป / เอกสาร PO) */
  attachmentUrl: string | null;
  /** ชื่อไฟล์เดิมของไฟล์แนบ */
  attachmentName: string | null;
  remark: string | null;
  qrCode: string | null;
  qrPayload: MaterialsReceivingQrPayload | null;
  /**
   * QR Code ชุดที่ 2 สำหรับ piecesQuantity (PIPE/SHEET/COIL เท่านั้น)
   * อ้างอิง internalLotNo + runNo เดียวกันกับ QR หลัก
   */
  piecesQrCode: string | null;
  /** Payload ของ pieces QR Code (version 2.0) */
  piecesQrPayload: MaterialsReceivingPiecesQrPayload | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: MaterialsReceivingSupplier | null;
  material?: MaterialsReceivingMaterial | null;
  unit?: MaterialsReceivingUnit | null;
}

export interface MaterialsReceivingDetail extends MaterialsReceiving {
  packages: MaterialsReceivingPackage[];
  supplier: MaterialsReceivingSupplier | null;
  material: MaterialsReceivingMaterial | null;
  unit: MaterialsReceivingUnit | null;
}

export interface ListMaterialsReceivingParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: MaterialsReceivingStatus;
  supplierId?: string;
  materialId?: string;
  internalLotNo?: string;
  receiveDateFrom?: string;
  receiveDateTo?: string;
  hasPackages?: boolean;
  sortBy?: "internalLotNo" | "receiveDate" | "supplierLotNo" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface MaterialsReceivingLookups {
  suppliers: MaterialsReceivingSupplier[];
  materials: {
    id: string;
    code: string;
    name: string;
    packingQuantity: number | null;
    materialType: MaterialsReceivingMaterialShape | null;
    ratio: number | null;
    unitId: string;
  }[];
  units: MaterialsReceivingUnit[];
}

export interface CreateMaterialsReceivingPayload {
  materialId: string;
  /**
   * Optional — auto-derived from material's supplier list when omitted.
   * Required only when the material has more than one active supplier.
   */
  supplierId?: string;
  receiveQuantity: string;
  supplierProductionDate: string;
  receiveDate: string;
  /** เลขที่ PO — header ของเอกสาร (optional) */
  poNo?: string | null;
  /** Override ratio ต่อครั้งที่รับเข้า (snapshot) */
  ratioOverride?: number;
  /** URL ของไฟล์แนบ (upload แล้ว) */
  attachmentUrl?: string | null;
  /** ชื่อไฟล์เดิมของไฟล์แนบ */
  attachmentName?: string | null;
  packingQuantityOverride?: number;
  remark?: string | null;
}

export interface UpdateMaterialsReceivingPayload {
  supplierId?: string;
  receiveQuantity?: string;
  supplierProductionDate?: string;
  receiveDate?: string;
  poNo?: string | null;
  ratioOverride?: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  packingQuantityOverride?: number;
  remark?: string | null;
  updatedAt: string;
}

export interface CancelMaterialsReceivingPayload {
  cancelReason: string;
}

// ============================================================================
// API
// ============================================================================

export const materialsReceivingApi = {
  list: (params: ListMaterialsReceivingParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.supplierId) query.supplierId = params.supplierId;
    if (params.materialId) query.materialId = params.materialId;
    if (params.internalLotNo) query.internalLotNo = params.internalLotNo;
    if (params.receiveDateFrom) query.receiveDateFrom = params.receiveDateFrom;
    if (params.receiveDateTo) query.receiveDateTo = params.receiveDateTo;
    if (params.hasPackages !== undefined) query.hasPackages = params.hasPackages;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<MaterialsReceiving>>(
      "/materials-receiving",
      { params: query },
    );
  },

  get: (id: string) =>
    apiClient.get<MaterialsReceivingDetail>(`/materials-receiving/${id}`),

  getByLotNo: (internalLotNo: string) =>
    apiClient.get<MaterialsReceivingDetail>(
      `/materials-receiving/by-lot/${encodeURIComponent(internalLotNo)}`,
    ),

  lookups: () =>
    apiClient.get<MaterialsReceivingLookups>("/materials-receiving/lookups"),

  getSuppliersByMaterial: (materialId: string) =>
    apiClient.get<MaterialsReceivingSupplier[]>(
      "/materials-receiving/suppliers",
      { params: { materialId } },
    ),

  create: (data: CreateMaterialsReceivingPayload) =>
    apiClient.post<MaterialsReceiving>("/materials-receiving", data),

  update: (id: string, data: UpdateMaterialsReceivingPayload) =>
    apiClient.patch<MaterialsReceiving>(`/materials-receiving/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/materials-receiving/${id}`),

  confirm: (id: string) =>
    apiClient.post<MaterialsReceiving>(`/materials-receiving/${id}/confirm`),

  cancel: (id: string, data: CancelMaterialsReceivingPayload) =>
    apiClient.post<MaterialsReceiving>(`/materials-receiving/${id}/cancel`, data),
};
