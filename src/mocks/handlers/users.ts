import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { UserDepartmentRole } from "@/types/auth";

export async function setupUserMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // /users (list / create)
  if (path === "/users" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toLowerCase();
    const status = params.status;
    const departmentId = params.departmentId;
    const roleId = params.roleId;

    let items = [...mockDb.users];
    if (search) {
      items = items.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
    }
    if (status) items = items.filter((u) => u.status === status);
    if (departmentId) items = items.filter((u) => u.departmentId === departmentId);
    if (roleId) items = items.filter((u) => (u.roleIds ?? []).includes(roleId as string));

    return ok(paginate(items, params));
  }

  if (path === "/users" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    const newUser = {
      id: generateId("user"),
      username: data.username as string,
      email: data.email as string,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      fullName: `${data.firstName} ${data.lastName}`,
      phone: data.phone as string | undefined,
      status: (data.status as "active" | "inactive" | "pending") ?? "active",
      emailVerified: false,
      phoneVerified: false,
      departmentId: data.departmentId as string | undefined,
      departmentName:
        mockDb.departments.find((d) => d.id === data.departmentId)?.name ?? undefined,
      roleIds: (data.roleIds as string[]) ?? [],
      roleNames: mockDb.roles
        .filter((r) => ((data.roleIds as string[]) ?? []).includes(r.id))
        .map((r) => r.name),
      permissions: mockDb.roles
        .filter((r) => ((data.roleIds as string[]) ?? []).includes(r.id))
        .flatMap((r) => r.permissions),
      avatarUrl: undefined,
      language: "th",
      timezone: "Asia/Bangkok",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.users.unshift(newUser);
    return ok(newUser, "สร้างผู้ใช้งานเรียบร้อย", 201);
  }

  // /users/:id
  const detailMatch = path.match(/^\/users\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const user = mockDb.users.find((u) => u.id === id);
      if (!user) return fail("ไม่พบผู้ใช้งาน", 404, "USER_NOT_FOUND");
      return ok(user);
    }

    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.users.findIndex((u) => u.id === id);
      if (idx === -1) return fail("ไม่พบผู้ใช้งาน", 404, "USER_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.users[idx];
      if (!existing) return fail("Not found", 404);
      const updated = {
        ...existing,
        ...data,
        fullName: `${data.firstName ?? existing.firstName} ${data.lastName ?? existing.lastName}`,
        roleNames: mockDb.roles
          .filter((r) => ((data.roleIds as string[]) ?? existing.roleIds).includes(r.id))
          .map((r) => r.name),
        permissions: mockDb.roles
          .filter((r) => ((data.roleIds as string[]) ?? existing.roleIds).includes(r.id))
          .flatMap((r) => r.permissions),
        updatedAt: new Date().toISOString(),
      };
      mockDb.users[idx] = updated;
      return ok(updated, "แก้ไขข้อมูลผู้ใช้งานเรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.users.findIndex((u) => u.id === id);
      if (idx === -1) return fail("ไม่พบผู้ใช้งาน", 404, "USER_NOT_FOUND");
      mockDb.users.splice(idx, 1);
      return ok({ success: true }, "ลบผู้ใช้งานเรียบร้อย");
    }
  }

  // /users/:id/status (activate / deactivate)
  const statusMatch = path.match(/^\/users\/([\w-]+)\/status$/);
  if (statusMatch && method === "PATCH") {
    const id = statusMatch[1];
    if (!id) return fail("Invalid id", 400);
    const idx = mockDb.users.findIndex((u) => u.id === id);
    if (idx === -1) return fail("ไม่พบผู้ใช้งาน", 404, "USER_NOT_FOUND");
    const data = (await getBody(body)) as { status: string };
    const existing = mockDb.users[idx];
    if (!existing) return fail("Not found", 404);
    mockDb.users[idx] = { ...existing, status: data.status as typeof existing.status };
    return ok(mockDb.users[idx], "อัพเดทสถานะเรียบร้อย");
  }

  // /users/:id/reset-password
  const resetMatch = path.match(/^\/users\/([\w-]+)\/reset-password$/);
  if (resetMatch && method === "POST") {
    await simulateLatency(300);
    return ok({ success: true }, "รีเซ็ตรหัสผ่านเรียบร้อย");
  }

  // GET /users/:id/assignments
  const assignmentsMatch = path.match(/^\/users\/([\w-]+)\/assignments$/);
  if (assignmentsMatch && method === "GET") {
    const userId = assignmentsMatch[1];
    if (!userId) return fail("Invalid userId", 400);
    await simulateLatency(150);
    const assignments = mockDb.userDepartmentRoles
      .filter((udr) => udr.userId === userId)
      .map((udr) => ({
        id: udr.id,
        userId: udr.userId,
        departmentId: udr.departmentId,
        departmentName: udr.departmentName,
        roleId: udr.roleId,
        roleName: udr.roleName,
        isPrimary: udr.isPrimary,
        status: udr.isActive ? "active" : "inactive",
        createdAt: udr.createdAt,
        updatedAt: udr.updatedAt,
      }));
    return ok(assignments);
  }

  // POST /users/:id/assignments
  if (assignmentsMatch && method === "POST") {
    const userId = assignmentsMatch[1];
    if (!userId) return fail("Invalid userId", 400);
    await simulateLatency(200);
    const data = (await getBody(body)) as {
      departmentId: string;
      roleId: string;
      isPrimary?: boolean;
    };
    const dept = mockDb.departments.find((d) => d.id === data.departmentId);
    const role = mockDb.roles.find((r) => r.id === data.roleId);
    if (!dept) return fail("ไม่พบแผนก", 404, "DEPARTMENT_NOT_FOUND");
    if (!role) return fail("ไม่พบบทบาท", 404, "ROLE_NOT_FOUND");

    // ถ้า isPrimary=true, unset primary ของ assignments อื่น
    if (data.isPrimary) {
      for (const udr of mockDb.userDepartmentRoles) {
        if (udr.userId === userId) udr.isPrimary = false;
      }
    }

    const newAssignment: UserDepartmentRole = {
      id: `udr-${Date.now()}`,
      userId,
      departmentId: data.departmentId,
      departmentName: dept.name,
      departmentCode: dept.code,
      roleId: data.roleId,
      roleName: role.name,
      roleCode: role.code,
      isPrimary: data.isPrimary ?? false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.userDepartmentRoles.push(newAssignment);
    return ok(newAssignment, "สร้าง assignment เรียบร้อย", 201);
  }

  return null;
}
