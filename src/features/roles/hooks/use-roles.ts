"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { Role } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";

export interface ListRolesParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/** map permission code ของ frontend ("user.view") เป็น action code ของ backend ("READ")
 *  ใช้เป็น fallback สำหรับ payload เก่าที่ยังส่ง `permissions: string[]` มา
 *  — payload ใหม่ส่ง `actionCodes` ตรง ๆ จาก catalog */
const PERMISSION_ACTION_MAP: Record<string, string> = {
  view: "READ",
  create: "CREATE",
  update: "UPDATE",
  delete: "DELETE",
};

function toActionCodes(permissions: string[]): string[] {
  const codes = new Set<string>();
  for (const p of permissions) {
    const action = p.split(".").pop()?.toLowerCase() ?? "";
    const mapped = PERMISSION_ACTION_MAP[action];
    if (mapped) codes.add(mapped);
  }
  return [...codes];
}

/** แปลงข้อมูลจากฟอร์ม (name/status/permissions) เป็น shape ของ backend จริง (nameTh/nameEn/isActive/actionCodes) */
function toRolePayload(data: Partial<Role>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  const name = data.name ?? data.nameTh ?? data.nameEn;
  if (name !== undefined) {
    payload.nameTh = data.nameTh ?? name;
    payload.nameEn = data.nameEn ?? name;
  }
  if (data.description !== undefined) payload.description = data.description;
  if (data.scopeType !== undefined) payload.scopeType = data.scopeType;
  if (data.status !== undefined || data.isActive !== undefined) {
    payload.isActive = data.isActive ?? data.status === "active";
  }
  if (data.actionCodes !== undefined) {
    payload.actionCodes = data.actionCodes;
  } else if (data.permissions !== undefined) {
    // Fallback: derive action codes from frontend dot-format permission codes
    payload.actionCodes = toActionCodes(data.permissions);
  }
  return payload;
}

const rolesApi = {
  /** List roles. The real backend returns { items, meta: { page, limit, totalItems, totalPages } }. */
  list: (params: ListRolesParams) =>
    apiClient.get<PaginatedList<Role>>("/roles", {
      params: {
        page: params.page,
        // Real backend uses `limit`, not `pageSize` — translate it here.
        limit: toLimit(params.pageSize),
        search: params.search,
        status: params.status,
      },
    }),
  get: (id: string) => apiClient.get<Role>(`/roles/${id}`),
  create: (data: Partial<Role>) => apiClient.post<Role>("/roles", toRolePayload(data)),
  update: (id: string, data: Partial<Role>) =>
    apiClient.patch<Role>(`/roles/${id}`, toRolePayload(data)),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/roles/${id}`),
  // Real backend ไม่มี POST /roles/:id/clone — ทำ clone ด้วย GET + POST ตาม API จริง
  clone: async (id: string) => {
    const detail = await rolesApi.get(id);
    const name = detail.nameTh ?? detail.name ?? detail.code;
    return rolesApi.create({
      code: `${detail.code}_COPY`,
      name: `${name} (สำเนา)`,
      description: detail.description ?? undefined,
      scopeType: detail.scopeType,
    });
  },
};

export function useRoles(params: ListRolesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.LIST(params),
    queryFn: () => rolesApi.list(params),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.DETAIL(id),
    queryFn: () => rolesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Role>) => rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("สร้าง Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้าง Role ได้", err.message);
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) =>
      rolesApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.DETAIL(vars.id) });
      showToast.success("แก้ไข Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถแก้ไข Role ได้", err.message);
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("ลบ Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบ Role ได้", err.message);
    },
  });
}

export function useCloneRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.clone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.ALL });
      showToast.success("คัดลอก Role เรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถคัดลอก Role ได้", err.message);
    },
  });
}
