import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { User, UserAssignment, UserDepartmentRole } from "@/types/auth";

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
          (u.fullName ?? `${u.firstName} ${u.lastName}`).toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
    }
    if (status === "active") items = items.filter((u) => u.isActive);
    else if (status === "inactive") items = items.filter((u) => !u.isActive);
    if (departmentId) items = items.filter((u) => u.departmentId === departmentId);
    if (roleId) items = items.filter((u) => (u.roleIds ?? []).includes(roleId as string));

    return ok(paginate(items, params));
  }

  if (path === "/users" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    // The real backend stores (userId, departmentId, roleId) tuples in
    // `userDepartmentRoles`. The mock keep using `roleIds[] + departmentId`
    // on the user for backwards compatibility.
    const assignments = (data.assignments as { departmentId: string; roleId: string }[]) ?? [];
    const departmentId = assignments[0]?.departmentId as string | undefined;
    const roleIds = Array.from(new Set(assignments.map((a) => a.roleId)));
    const newUser: User = {
      id: generateId("user"),
      username: data.username as string,
      email: data.email as string,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      fullName: `${data.firstName} ${data.lastName}`,
      telephone: (data.telephone as string | undefined) ?? (data.phone as string | undefined),
      phone: data.phone as string | undefined,
      isActive: true,
      status: "active",
      emailVerified: false,
      phoneVerified: false,
      departmentId,
      departmentName: mockDb.departments.find((d) => d.id === departmentId)?.name ?? undefined,
      roleIds,
      roleNames: mockDb.roles
        .filter((r) => roleIds.includes(r.id))
        .map((r) => r.name),
      permissions: Array.from(
        new Set(
          mockDb.roles
            .filter((r) => roleIds.includes(r.id))
            .flatMap((r) => r.permissions),
        ),
      ).filter((p): p is string => typeof p === "string"),
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
        permissions: Array.from(
          new Set(
            mockDb.roles
              .filter((r) => ((data.roleIds as string[]) ?? existing.roleIds).includes(r.id))
              .flatMap((r) => r.permissions),
          ),
        ).filter((p): p is string => typeof p === "string"),
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
    const data = (await getBody(body)) as { isActive?: boolean };
    const existing = mockDb.users[idx];
    if (!existing) return fail("Not found", 404);
    const isActive = data.isActive ?? !existing.isActive;
    mockDb.users[idx] = {
      ...existing,
      isActive,
      status: isActive ? "active" : "inactive",
    };
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
    const assignments: UserAssignment[] = mockDb.userDepartmentRoles
      .filter((udr) => udr.userId === userId)
      .map((udr) => {
        const dept = mockDb.departments.find((d) => d.id === udr.departmentId);
        const role = mockDb.roles.find((r) => r.id === udr.roleId);
        return {
          id: udr.id,
          userId: udr.userId,
          departmentId: udr.departmentId,
          roleId: udr.roleId,
          isActive: udr.isActive,
          assignedAt: udr.createdAt,
          createdAt: udr.createdAt,
          updatedAt: udr.updatedAt,
          department: dept
            ? {
                id: dept.id,
                code: dept.code,
                name: dept.name,
                nameTh: dept.nameTh,
                nameEn: dept.nameEn,
              }
            : undefined,
          role: role
            ? {
                id: role.id,
                code: role.code,
                name: role.name,
                nameTh: role.nameTh,
                nameEn: role.nameEn,
              }
            : undefined,
        };
      });
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
