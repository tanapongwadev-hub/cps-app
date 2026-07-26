/**
 * Sessions Mock Handler
 * /sessions, /sessions/:id, PATCH /sessions/:id/revoke, POST /sessions/revoke-all/:userId
 * Requires SUPER_ADMIN
 */
import { mockDb } from "../db";
import { ok, fail, getBody, paginate, simulateLatency, type ListQuery } from "./helpers";

export async function setupSessionMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /sessions
  if (path === "/sessions" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const userId = params.userId?.toString();
    let items = [...mockDb.sessions];
    if (userId) items = items.filter((s) => s.userId === userId);
    return ok(paginate(items, params));
  }

  // POST /sessions/revoke-all/:userId
  const revokeAllMatch = path.match(/^\/sessions\/revoke-all\/([\w-]+)$/);
  if (revokeAllMatch && method === "POST") {
    const userId = revokeAllMatch[1];
    if (!userId) return fail("Invalid userId", 400);

    await simulateLatency(200);
    let count = 0;
    for (const session of mockDb.sessions) {
      if (session.userId === userId && session.status === "active") {
        session.status = "revoked";
        session.revokedAt = new Date().toISOString();
        session.revokedBy = "current-user";
        session.revokedReason = "Bulk revoke";
        count++;
      }
    }
    return ok({ revoked: count }, `Revoked ${count} session(s)`);
  }

  // PATCH /sessions/:id/revoke
  const revokeMatch = path.match(/^\/sessions\/([\w-]+)\/revoke$/);
  if (revokeMatch && method === "PATCH") {
    const id = revokeMatch[1];
    if (!id) return fail("Invalid id", 400);
    await simulateLatency(150);
    const session = mockDb.sessions.find((s) => s.id === id);
    if (!session) return fail("ไม่พบ session", 404, "SESSION_NOT_FOUND");
    const data = (await getBody(body)) as { reason?: string };
    session.status = "revoked";
    session.revokedAt = new Date().toISOString();
    session.revokedBy = "current-user";
    session.revokedReason = data.reason;
    return ok(session, "Revoke session สำเร็จ");
  }

  // GET /sessions/:id
  const detailMatch = path.match(/^\/sessions\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);
    if (method === "GET") {
      await simulateLatency(150);
      const session = mockDb.sessions.find((s) => s.id === id);
      if (!session) return fail("ไม่พบ session", 404, "SESSION_NOT_FOUND");
      return ok(session);
    }
  }

  return null;
}
