/**
 * Centralized API Endpoints
 * 
 * Single source of truth for all API endpoint paths.
 * Following Vercel Best Practices for maintainability.
 * 
 * @example
 * ```ts
 * import { endpoints } from '@/infra/api';
 * 
 * // Auth
 * apiClient.get(endpoints.auth.me)
 * apiClient.post(endpoints.auth.login, credentials)
 * 
 * // Materials
 * apiClient.get(endpoints.materials.list)
 * apiClient.post(endpoints.materials.create, data)
 * ```
 */

const BASE = {
  AUTH: "/auth",
  USERS: "/users",
  MATERIALS: "/materials",
  MATERIALS_RECEIVING: "/materials-receiving",
  MATERIALS_DISBURSEMENT: "/materials-disbursement",
  MASTER_DATA: "/master-data",
  DASHBOARD: "/dashboard",
  REPORTS: "/reports",
  PERMISSIONS: "/permissions",
  SESSIONS: "/sessions",
  ACTIVITY_LOGS: "/activity-logs",
} as const;

export const endpoints = {
  // Auth endpoints
  auth: {
    login: `${BASE.AUTH}/login`,
    logout: `${BASE.AUTH}/logout`,
    refresh: `${BASE.AUTH}/refresh`,
    me: `${BASE.AUTH}/me`,
    selectDepartment: `${BASE.AUTH}/select-department`,
    switchDepartment: `${BASE.AUTH}/switch-department`,
    forgotPassword: `${BASE.AUTH}/forgot-password`,
    resetPassword: `${BASE.AUTH}/reset-password`,
  },

  // User management endpoints
  users: {
    list: BASE.USERS,
    detail: (id: string) => `${BASE.USERS}/${id}`,
    create: BASE.USERS,
    update: (id: string) => `${BASE.USERS}/${id}`,
    delete: (id: string) => `${BASE.USERS}/${id}`,
    activate: (id: string) => `${BASE.USERS}/${id}/activate`,
    deactivate: (id: string) => `${BASE.USERS}/${id}/deactivate`,
    assignments: (id: string) => `${BASE.USERS}/${id}/assignments`,
    changePassword: (id: string) => `${BASE.USERS}/${id}/change-password`,
  },

  // Materials endpoints
  materials: {
    list: BASE.MATERIALS,
    detail: (id: string) => `${BASE.MATERIALS}/${id}`,
    create: BASE.MATERIALS,
    update: (id: string) => `${BASE.MATERIALS}/${id}`,
    delete: (id: string) => `${BASE.MATERIALS}/${id}`,
    categories: `${BASE.MASTER_DATA}/categories`,
    units: `${BASE.MASTER_DATA}/units`,
    suppliers: `${BASE.MASTER_DATA}/suppliers`,
    organizations: `${BASE.MASTER_DATA}/organizations`,
    materialModels: `${BASE.MASTER_DATA}/material-models`,
    deliveryTypes: `${BASE.MASTER_DATA}/delivery-types`,
    loadingPoints: `${BASE.MASTER_DATA}/loading-points`,
    rejectReasons: `${BASE.MASTER_DATA}/reject-reasons`,
    statusItems: `${BASE.MASTER_DATA}/status-items`,
  },

  // Materials Receiving endpoints
  materialsReceiving: {
    list: BASE.MATERIALS_RECEIVING,
    detail: (id: string) => `${BASE.MATERIALS_RECEIVING}/${id}`,
    create: BASE.MATERIALS_RECEIVING,
    update: (id: string) => `${BASE.MATERIALS_RECEIVING}/${id}`,
    delete: (id: string) => `${BASE.MATERIALS_RECEIVING}/${id}`,
    approve: (id: string) => `${BASE.MATERIALS_RECEIVING}/${id}/approve`,
    reject: (id: string) => `${BASE.MATERIALS_RECEIVING}/${id}/reject`,
    report: `${BASE.REPORTS}/materials-receiving`,
    unifiedReport: `${BASE.REPORTS}/materials-unified`,
  },

  // Materials Disbursement endpoints
  materialsDisbursement: {
    list: BASE.MATERIALS_DISBURSEMENT,
    detail: (id: string) => `${BASE.MATERIALS_DISBURSEMENT}/${id}`,
    create: BASE.MATERIALS_DISBURSEMENT,
    update: (id: string) => `${BASE.MATERIALS_DISBURSEMENT}/${id}`,
    delete: (id: string) => `${BASE.MATERIALS_DISBURSEMENT}/${id}`,
    approve: (id: string) => `${BASE.MATERIALS_DISBURSEMENT}/${id}/approve`,
    reject: (id: string) => `${BASE.MATERIALS_DISBURSEMENT}/${id}/reject`,
    report: `${BASE.REPORTS}/materials-disbursement`,
  },

  // Dashboard endpoints
  dashboard: {
    stats: `${BASE.DASHBOARD}/stats`,
    recentActivity: `${BASE.DASHBOARD}/recent-activity`,
    kpis: `${BASE.DASHBOARD}/kpis`,
  },

  // Permissions endpoints
  permissions: {
    list: BASE.PERMISSIONS,
    roles: `${BASE.PERMISSIONS}/roles`,
    roleDetail: (id: string) => `${BASE.PERMISSIONS}/roles/${id}`,
    menus: `${BASE.PERMISSIONS}/menus`,
    departments: `${BASE.PERMISSIONS}/departments`,
    departmentPermissions: (id: string) => `${BASE.PERMISSIONS}/departments/${id}/permissions`,
  },

  // Sessions endpoints
  sessions: {
    list: BASE.SESSIONS,
    detail: (id: string) => `${BASE.SESSIONS}/${id}`,
    revoke: (id: string) => `${BASE.SESSIONS}/${id}/revoke`,
    revokeAll: `${BASE.SESSIONS}/revoke-all`,
  },

  // Activity logs endpoints
  activityLogs: {
    list: BASE.ACTIVITY_LOGS,
    detail: (id: string) => `${BASE.ACTIVITY_LOGS}/${id}`,
    export: `${BASE.ACTIVITY_LOGS}/export`,
  },

  // Master data CRUD endpoints (reusable pattern)
  masterData: {
    categories: BASE.MASTER_DATA,
    units: `${BASE.MASTER_DATA}/units`,
    suppliers: `${BASE.MASTER_DATA}/suppliers`,
    organizations: `${BASE.MASTER_DATA}/organizations`,
    materialModels: `${BASE.MASTER_DATA}/material-models`,
    deliveryTypes: `${BASE.MASTER_DATA}/delivery-types`,
    loadingPoints: `${BASE.MASTER_DATA}/loading-points`,
    rejectReasons: `${BASE.MASTER_DATA}/reject-reasons`,
    statusItems: `${BASE.MASTER_DATA}/status-items`,
  },
} as const;

/**
 * Helper to build dynamic endpoint
 */
export function buildEndpoint<T extends string>(
  base: string,
  params?: Record<string, string | number | undefined>
): string {
  if (!params) return base;
  
  let path = base;
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      path = path.replace(`{${key}}`, String(value));
    }
  });
  
  return path;
}
