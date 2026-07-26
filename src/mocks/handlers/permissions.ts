/**
 * Permissions Mock Handler
 * /permissions, /permissions/:id
 * Requires SUPER_ADMIN
 */
import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { Permission } from "@/types/permission";

export async function setupPermissionMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /permissions
  if (path === "/permissions" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toString().toLowerCase();
    let items = [...mockDb.permissions];
    if (search) {
      items = items.filter((p) => {
        const code = p.code?.toLowerCase() ?? "";
        const name = p.name?.toLowerCase() ?? "";
        const moduleName = p.module?.toLowerCase() ?? "";
        return code.includes(search) || name.includes(search) || moduleName.includes(search);
      });
    }
    return ok(paginate(items, params));
  }

  // GET /permissions/:id
  const detailMatch = path.match(/^\/permissions\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const perm = mockDb.permissions.find((p) => p.id === id);
      if (!perm) return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
      return ok(perm);
    }
  }

  return null;
}

// Keep generateId available for future handlers
void generateId;
