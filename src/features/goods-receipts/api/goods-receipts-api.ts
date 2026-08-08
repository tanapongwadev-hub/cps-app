import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

// ============================================================================
// Types
// ============================================================================

export interface GoodsReceiptSupplier {
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
}

export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  poNo: string | null;
  supplierDocNo: string | null;
  supplierDocDate: string | null;
  noSupplierDocument: boolean;
  filePath: string | null;
  fileName: string | null;
  materialId: string;
  materialCode: string;
  materialName: string;
  qtyDelivered: string;
  qtyReceived: string;
  qtyRejected: string;
  rejectReasonId: string | null;
  rejectReason?: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string | null;
  } | null;
  rejectNote: string | null;
  lotNo: string | null;
  productionDate: string | null;
  expiryDate: string | null;
  unitPrice: string;
  lineAmount: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptAttachment {
  id: string;
  goodsReceiptId: string;
  docType: "DELIVERY_NOTE" | "INVOICE" | "PACKING_LIST" | "CERTIFICATE" | "OTHER";
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdBy: string | null;
  createdAt: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNo: string | null;
  supplierId: string;
  supplier: GoodsReceiptSupplier;
  receiptDate: string;
  status: "draft" | "posted" | "cancelled";
  remark: string | null;
  cancelReason: string | null;
  postedBy: string | null;
  postedAt: string | null;
  itemCount: number;
  totalQtyReceived: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items?: GoodsReceiptItem[];
  attachments?: GoodsReceiptAttachment[];
}

export interface GoodsReceiptDetail extends GoodsReceipt {
  items: GoodsReceiptItem[];
  attachments: GoodsReceiptAttachment[];
}

export interface ListGoodsReceiptsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: "draft" | "posted" | "cancelled";
  supplierId?: string;
  materialId?: string;
  receiptDateFrom?: string;
  receiptDateTo?: string;
  hasRejection?: boolean;
  sortBy?: "receiptNo" | "receiptDate" | "supplierDocNo" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface GoodsReceiptLookups {
  suppliers: GoodsReceiptSupplier[];
  materials: {
    id: string;
    code: string;
    name: string;
    unit: {
      id: string;
      code: string;
      nameTh: string;
      nameEn: string | null;
    };
  }[];
  units: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string | null;
  }[];
  rejectReasons: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string | null;
  }[];
}

export interface GoodsReceiptItemPayload {
  materialId: string;
  poNo?: string | null;
  supplierDocNo?: string | null;
  supplierDocDate?: string | null;
  noSupplierDocument?: boolean;
  filePath?: string | null;
  fileName?: string | null;
  qtyDelivered?: string;
  qtyReceived: string;
  qtyRejected?: string;
  rejectReasonId?: string | null;
  rejectNote?: string | null;
  lotNo?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  unitPrice?: string;
  lineAmount?: string;
}

export interface CreateGoodsReceiptPayload {
  supplierId: string;
  receiptDate: string;
  remark?: string | null;
  items: GoodsReceiptItemPayload[];
}

export interface UpdateGoodsReceiptPayload extends Partial<CreateGoodsReceiptPayload> {
  updatedAt: string;
}

export interface CancelGoodsReceiptPayload {
  cancelReason: string;
}

// ============================================================================
// API
// ============================================================================

export const goodsReceiptsApi = {
  list: (params: ListGoodsReceiptsParams) => {
    const query: Record<string, string | number | boolean> = {
      page: params.page,
      limit: toLimit(params.pageSize),
    };
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.supplierId) query.supplierId = params.supplierId;
    if (params.materialId) query.materialId = params.materialId;
    if (params.receiptDateFrom) query.receiptDateFrom = params.receiptDateFrom;
    if (params.receiptDateTo) query.receiptDateTo = params.receiptDateTo;
    if (params.hasRejection !== undefined) query.hasRejection = params.hasRejection;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    return apiClient.get<PaginatedList<GoodsReceipt>>("/goods-receipts", { params: query });
  },

  get: (id: string) => apiClient.get<GoodsReceiptDetail>(`/goods-receipts/${id}`),

  lookups: (supplierId?: string) => {
    const params: Record<string, string> = {};
    if (supplierId) params.supplierId = supplierId;
    return apiClient.get<GoodsReceiptLookups>("/goods-receipts/lookups", { params });
  },

  create: (data: CreateGoodsReceiptPayload) =>
    apiClient.post<GoodsReceipt>("/goods-receipts", data),

  update: (id: string, data: UpdateGoodsReceiptPayload) =>
    apiClient.patch<GoodsReceipt>(`/goods-receipts/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/goods-receipts/${id}`),

  post: (id: string) => apiClient.post<GoodsReceipt>(`/goods-receipts/${id}/post`),

  cancel: (id: string, data: CancelGoodsReceiptPayload) =>
    apiClient.post<GoodsReceipt>(`/goods-receipts/${id}/cancel`, data),

  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload<{ filePath: string; fileName: string; previewUrl: string }>(
      "/goods-receipts/attachments",
      formData
    );
  },

  attachFile: (id: string, data: GoodsReceiptAttachmentPayload) =>
    apiClient.post<GoodsReceiptAttachment>(`/goods-receipts/${id}/attachments`, data),

  removeAttachment: (id: string, attachmentId: string) =>
    apiClient.delete<void>(`/goods-receipts/${id}/attachments/${attachmentId}`),
};
