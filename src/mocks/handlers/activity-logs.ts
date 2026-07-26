import { mockDb } from "../db";
import { ok, paginate, simulateLatency, type ListQuery } from "./helpers";

export async function setupActivityLogMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/activity-logs" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toLowerCase();
    const action = params.action;
    const mod = params.module;
    const userId = params.userId;
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;

    let items = [...mockDb.activityLogs];
    if (search) {
      items = items.filter(
        (l) =>
          l.description.toLowerCase().includes(search) ||
          l.userName.toLowerCase().includes(search) ||
          l.module.toLowerCase().includes(search),
      );
    }
    if (action) items = items.filter((l) => l.action === action);
    if (mod) items = items.filter((l) => l.module === mod);
    if (userId) items = items.filter((l) => l.userId === userId);
    if (dateFrom) items = items.filter((l) => l.timestamp >= dateFrom);
    if (dateTo) items = items.filter((l) => l.timestamp <= dateTo);

    return ok(paginate(items, params));
  }
  return null;
}
