import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";

export async function setupRoleMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/roles" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toLowerCase();
    const status = params.status;
    let items = [...mockDb.roles];
    if (search) {
      items = items.filter(
        (r) => r.name.toLowerCase().includes(search) || r.code.toLowerCase().includes(search),
      );
    }
    if (status) items = items.filter((r) => r.status === status);
    return ok(paginate(items, params));
  }

  if (path === "/roles" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    if (mockDb.roles.some((r) => r.code === data.code)) {
      return fail("รหัส Role นี้มีอยู่ในระบบแล้ว", 409, "ROLE_CODE_EXISTS");
    }
    const newRole = {
      id: generateId("role"),
      code: data.code as string,
      name: data.name as string,
      description: data.description as string | undefined,
      status: (data.status as "active" | "inactive") ?? "active",
      isSystem: false,
      permissions: (data.permissions as string[]) ?? [],
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.roles.push(newRole);
    return ok(newRole, "สร้าง Role เรียบร้อย", 201);
  }

  const detailMatch = path.match(/^\/roles\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const role = mockDb.roles.find((r) => r.id === id);
      if (!role) return fail("ไม่พบ Role", 404, "ROLE_NOT_FOUND");
      return ok(role);
    }

    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.roles.findIndex((r) => r.id === id);
      if (idx === -1) return fail("ไม่พบ Role", 404, "ROLE_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.roles[idx];
      if (!existing) return fail("Not found", 404);
      if (existing.isSystem && data.permissions) {
        // System role: don't allow permission changes
        return fail("ไม่สามารถแก้ไขสิทธิ์ของ System Role ได้", 403, "SYSTEM_ROLE");
      }
      mockDb.roles[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      } as typeof existing;
      return ok(mockDb.roles[idx], "แก้ไข Role เรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.roles.findIndex((r) => r.id === id);
      if (idx === -1) return fail("ไม่พบ Role", 404, "ROLE_NOT_FOUND");
      const role = mockDb.roles[idx];
      if (!role) return fail("Not found", 404);
      if (role.isSystem) return fail("ไม่สามารถลบ System Role ได้", 403, "SYSTEM_ROLE");
      if ((role.userCount ?? 0) > 0) {
        return fail("Role นี้ยังมีผู้ใช้งานอยู่ ไม่สามารถลบได้", 409, "ROLE_IN_USE");
      }
      mockDb.roles.splice(idx, 1);
      return ok({ success: true }, "ลบ Role เรียบร้อย");
    }
  }

  // /roles/:id/clone
  const cloneMatch = path.match(/^\/roles\/([\w-]+)\/clone$/);
  if (cloneMatch && method === "POST") {
    await simulateLatency();
    const id = cloneMatch[1];
    if (!id) return fail("Invalid id", 400);
    const src = mockDb.roles.find((r) => r.id === id);
    if (!src) return fail("ไม่พบ Role", 404, "ROLE_NOT_FOUND");
    const clone = {
      ...src,
      id: generateId("role"),
      code: `${src.code}_COPY`,
      name: `${src.name} (สำเนา)`,
      isSystem: false,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.roles.push(clone);
    return ok(clone, "คัดลอก Role เรียบร้อย", 201);
  }

  return null;
}
