/**
 * Roles API service.
 *
 * The real backend (NestJS) uses a slightly different shape than what the UI
 * collects:
 *   - UI:  { name, status, permissions: string[] }
 *   - API: { nameTh, nameEn, isActive, actionCodes: string[] }
 *
 * Translation happens in `toRolePayload` below. Legacy payloads that still
 * send `permissions` (dot-format codes) are translated via
 * `toActionCodes` as a fallback.
 */
import { apiClient } from "@/services/api-client";
import type { Role } from "@/features/auth/types";
import type { PaginatedList } from "@/types/paginated";
import { toLimit } from "@/types/paginated";

export interface ListRolesParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Map frontend permission code suffix (`"user.view" → "view"`) to backend
 *  action code (`"READ"`). Used for legacy payloads that still send
 *  `permissions: string[]` in the old dot-format. */
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

/** Translate the UI form shape into the backend's flat payload. */
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

export const rolesApi = {
  /** List roles. The real backend returns
   *  `{ items, meta: { page, limit, totalItems, totalPages } }`. */
  list: (params: ListRolesParams) =>
    apiClient.get<PaginatedList<Role>>("/roles", {
      params: {
        page: params.page,
        // Real backend uses `limit`, not `pageSize` — translate here.
        limit: toLimit(params.pageSize),
        search: params.search,
        status: params.status,
      },
    }),

  get: (id: string) => apiClient.get<Role>(`/roles/${id}`),

  create: (data: Partial<Role>) =>
    apiClient.post<Role>("/roles", toRolePayload(data)),

  update: (id: string, data: Partial<Role>) =>
    apiClient.patch<Role>(`/roles/${id}`, toRolePayload(data)),

  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/roles/${id}`),

  /** The real backend has no `POST /roles/:id/clone` — emulate it via
   *  GET detail + POST create with a derived name. */
  clone: async (id: string): Promise<Role> => {
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
