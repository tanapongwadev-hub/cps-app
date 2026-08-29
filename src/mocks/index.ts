/**
 * Mock API setup
 * Wires the in-memory mock handler to the API client.
 * Switch to real backend by setting NEXT_PUBLIC_ENABLE_MOCK_API=false.
 */
import { setupAuthMocks } from "./handlers/auth";
import { setupUserMocks } from "./handlers/users";
import { setupRoleMocks } from "./handlers/roles";
import { setupDepartmentMocks } from "./handlers/departments";
import { setupMenuMocks } from "./handlers/menus";
import { setupDashboardMocks } from "./handlers/dashboard";
import { setupTicketMocks } from "./handlers/tickets";
import { setupActivityLogMocks } from "./handlers/activity-logs";
import { setupMasterDataMocks } from "./handlers/master-data";
import { setupPermissionMocks } from "./handlers/permissions";
import { setupSessionMocks } from "./handlers/sessions";
import { setupAuditLogMocks } from "./handlers/audit-logs";
import { setupMaterialsReceivingMocks } from "./handlers/materials-receiving";
import { setupProductsMocks, setupBomsMocks } from "./handlers/products";
import { ApiClient } from "@/services/api-client";

/**
 * Handler chain - เรียงตาม priority (specific ก่อน general)
 */
const handlerChain: Array<{
  name: string;
  setup: (path: string, method: string, body: unknown) => Promise<Response | null>;
}> = [
  { name: "auth", setup: setupAuthMocks },
  { name: "users", setup: setupUserMocks },
  { name: "roles", setup: setupRoleMocks },
  { name: "departments", setup: setupDepartmentMocks },
  { name: "menus", setup: setupMenuMocks },
  { name: "permissions", setup: setupPermissionMocks },
  { name: "sessions", setup: setupSessionMocks },
  { name: "audit-logs", setup: setupAuditLogMocks },
  { name: "dashboard", setup: setupDashboardMocks },
  { name: "tickets", setup: setupTicketMocks },
  { name: "activity-logs", setup: setupActivityLogMocks },
  { name: "materials-receiving", setup: setupMaterialsReceivingMocks },
  { name: "master-data", setup: setupMasterDataMocks },
  { name: "products", setup: setupProductsMocks },
  { name: "boms", setup: setupBomsMocks },
];

export function setupMockHandler(client: ApiClient) {
  const handler = async (url: string, options: { method?: string; body?: unknown } = {}) => {
    const method = (options.method ?? "GET").toString().toUpperCase();
    const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "");

    for (const { setup } of handlerChain) {
      const resp = await setup(path, method, options.body);
      if (resp) return resp;
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: `Mock endpoint not found: ${method} ${path}`,
        messageCode: "MOCK_NOT_FOUND",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  };

  client.setMockHandler(handler);
}
