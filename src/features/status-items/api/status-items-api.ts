import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface StatusItem {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  color: string;
  module: string;
  isDefault: boolean;
  sortOrder: number;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusItemPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  color?: string;
  module: string;
  isDefault?: boolean;
  sortOrder?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateStatusItemPayload extends Partial<StatusItemPayload> {
  updatedAt: string;
}

export interface ListStatusItemsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  module?: string;
  sortBy?: "code" | "nameTh" | "module" | "sortOrder" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const statusItemsApi = {
  list: (p: ListStatusItemsParams) => {
    const q: Record<string, string | number | boolean> = { page: p.page, limit: toLimit(p.pageSize) };
    if (p.search) q.search = p.search;
    if (p.isActive !== undefined) q.isActive = p.isActive;
    if (p.module) q.module = p.module;
    if (p.sortBy) q.sortBy = p.sortBy;
    if (p.sortOrder) q.sortOrder = p.sortOrder;
    return apiClient.get<PaginatedList<StatusItem>>("/status-items", { params: q });
  },
  get: (id: string) => apiClient.get<StatusItem>(`/status-items/${id}`),
  create: (d: StatusItemPayload) => apiClient.post<StatusItem>("/status-items", d),
  update: (id: string, d: UpdateStatusItemPayload) => apiClient.patch<StatusItem>(`/status-items/${id}`, d),
  deactivate: (id: string) => apiClient.delete<StatusItem>(`/status-items/${id}`),
  restore: (id: string) => apiClient.patch<StatusItem>(`/status-items/${id}/restore`),
};
