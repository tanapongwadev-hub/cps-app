import { apiClient } from "@/services/api-client";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export type OrganizationType = "headquarters" | "branch" | "subsidiary" | "department";

export interface Organization {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  parentId: string | null;
  type: OrganizationType;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPayload {
  code: string;
  nameTh: string;
  nameEn?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  parentId?: string | null;
  type?: OrganizationType;
  isActive?: boolean;
}

export interface UpdateOrganizationPayload extends Partial<OrganizationPayload> {
  updatedAt: string;
}

export interface ListOrganizationsParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  type?: OrganizationType;
  sortBy?: "code" | "nameTh" | "type" | "isActive" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const organizationsApi = {
  list: (p: ListOrganizationsParams) => {
    const q: Record<string, string | number | boolean> = { page: p.page, limit: toLimit(p.pageSize) };
    if (p.search) q.search = p.search;
    if (p.isActive !== undefined) q.isActive = p.isActive;
    if (p.type) q.type = p.type;
    if (p.sortBy) q.sortBy = p.sortBy;
    if (p.sortOrder) q.sortOrder = p.sortOrder;
    return apiClient.get<PaginatedList<Organization>>("/organizations", { params: q });
  },
  get: (id: string) => apiClient.get<Organization>(`/organizations/${id}`),
  create: (d: OrganizationPayload) => apiClient.post<Organization>("/organizations", d),
  update: (id: string, d: UpdateOrganizationPayload) => apiClient.patch<Organization>(`/organizations/${id}`, d),
  deactivate: (id: string) => apiClient.delete<Organization>(`/organizations/${id}`),
  restore: (id: string) => apiClient.patch<Organization>(`/organizations/${id}/restore`),
};
