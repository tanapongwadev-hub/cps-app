/**
 * Audit Logs Mock Handler
 * /audit-logs, /audit-logs/:id
 * Requires SUPER_ADMIN
 *
 * Note: This is the formal audit log (different from /activity-logs which is operational log)
 */
import { mockDb } from "../db";
import { ok, fail, paginate, simulateLatency, type ListQuery } from "./helpers";

export async function setupAuditLogMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /audit-logs
  if (path === "/audit-logs" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toString().toLowerCase();
    const userId = params.userId?.toString();
    const action = params.action?.toString();

    let items = [...mockDb.auditLogs];
    if (search) {
      items = items.filter(
        (l) =>
          l.description.toLowerCase().includes(search) ||
          l.userName.toLowerCase().includes(search) ||
          l.module.toLowerCase().includes(search),
      );
    }
    if (userId) items = items.filter((l) => l.userId === userId);
    if (action) items = items.filter((l) => l.action === action);
    return ok(paginate(items, params));
  }

  // GET /audit-logs/:id
  const detailMatch = path.match(/^\/audit-logs\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);
    if (method === "GET") {
      await simulateLatency(150);
      const log = mockDb.auditLogs.find((l) => l.id === id);
      if (!log) return fail("ไม่พบ audit log", 404, "AUDIT_LOG_NOT_FOUND");
      return ok(log);
    }
  }

  return null;
}
