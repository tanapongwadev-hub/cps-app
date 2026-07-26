/**
 * Auth Mock Handlers
 * Returns the same response shape as the real NestJS backend:
 *   { authentication: { accessToken, refreshToken, tokenType, expiresIn },
 *     user:          { id, username, firstName, lastName, displayName, email, isSuperAdmin, roles, departments },
 *     accessControl: { menus, permissions } }
 *
 * 2-step flow (department_selection_required) is still supported for mock
 * users that have multiple active assignments, via `userDepartmentRoles`.
 */
import { mockDb } from "../db";
import { ok, fail, getBody, simulateLatency, generateId } from "./helpers";
import type {
  AccessControl,
  DepartmentRoleOption,
  LoginResponse,
  User,
  UserDepartmentRole,
} from "@/types/auth";

const PASSWORD_MAP: Record<string, string> = {
  admin: "admin",
  password: "password123",
  // Default NestJS seed credentials (used when connecting to real backend,
  // but kept here as fallback for mock mode)
  superadmin: "change-me-secure-password",
};

const isValidCredentials = (password: string): boolean => {
  return Object.values(PASSWORD_MAP).includes(password);
};

const buildAccessControl = (
  userDepartmentRole: UserDepartmentRole | null,
): AccessControl => {
  const role = userDepartmentRole
    ? mockDb.roles.find((r) => r.id === userDepartmentRole.roleId)
    : undefined;
  const permissions = role?.permissions ?? [];
  // Filter menus by permissions
  const menus = mockDb.menus.filter((m) => {
    if (m.isHidden) return false;
    const required = m.requiredPermissions ?? [];
    if (required.length === 0) return true;
    if (permissions.includes("*")) return true;
    return required.some((p) => permissions.includes(p));
  });
  return {
    permissions,
    menus,
    userDepartmentRoleId: userDepartmentRole?.id,
    departmentId: userDepartmentRole?.departmentId,
    roleId: userDepartmentRole?.roleId,
  };
};

/** Normalize a mock user to the real backend's user shape. */
const shapeUser = (
  user: User,
  activeAssignments: UserDepartmentRole[],
): User => {
  const primary = activeAssignments.find((a) => a.isPrimary) ?? activeAssignments[0] ?? null;
  return {
    ...user,
    displayName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    isSuperAdmin: user.permissions?.includes("*") ?? false,
    departments: activeAssignments.map((a) => ({
      id: a.departmentId,
      code: a.departmentCode,
      name: a.departmentName,
    })),
    roles: activeAssignments.map((a) => ({
      id: a.roleId,
      code: a.roleCode,
      name: a.roleName,
    })),
    // Carry forward the primary assignment as the convenience fields too
    departmentId: primary?.departmentId,
    departmentName: primary?.departmentName,
    roleIds: activeAssignments.map((a) => a.roleId),
    roleNames: activeAssignments.map((a) => a.roleName),
  };
};

export async function setupAuthMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // POST /auth/login
  if (path === "/auth/login" && method === "POST") {
    await simulateLatency(400);
    const data = (await getBody(body)) as { username: string; password: string };
    const user = mockDb.users.find(
      (u) => u.username === data.username || u.email === data.username,
    );
    if (!user) return fail("ไม่พบผู้ใช้งานนี้ในระบบ", 404, "USER_NOT_FOUND");
    if (!isValidCredentials(data.password)) {
      return fail("รหัสผ่านไม่ถูกต้อง", 401, "INVALID_PASSWORD");
    }
    if (user.status === "inactive") {
      return fail("บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน", 403, "USER_INACTIVE");
    }

    // Find active department-role assignments
    const assignments = mockDb.userDepartmentRoles.filter(
      (udr) => udr.userId === user.id && udr.isActive,
    );

    if (assignments.length === 0) {
      return fail("ผู้ใช้งานยังไม่ได้รับมอบหมายแผนก/บทบาท", 403, "NO_ASSIGNMENT");
    }

    // Mock-only: multi-assignment triggers 2-step flow. Real backend never does this.
    if (assignments.length > 1) {
      const departmentSelectionToken = generateId("dst");
      mockDb.departmentSelectionTokens.set(departmentSelectionToken, user.id);

      const options: DepartmentRoleOption[] = assignments
        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        .map((udr) => ({
          userDepartmentRoleId: udr.id,
          department: {
            id: udr.departmentId,
            code: udr.departmentCode,
            name: udr.departmentName,
          },
          role: {
            id: udr.roleId,
            code: udr.roleCode,
            name: udr.roleName,
          },
          isPrimary: udr.isPrimary,
        }));

      // Mock returns 2-step shape wrapped in a special envelope. The hook detects
      // it via the absence of `authentication` and presence of `status`.
      return ok({
        status: "department_selection_required",
        departmentSelectionToken,
        user: shapeUser(user, assignments),
        userDepartmentRoles: options,
      });
    }

    // 1-step success: same shape as real backend
    const udr = assignments[0] ?? null;
    const accessControl = buildAccessControl(udr);
    const response: LoginResponse = {
      authentication: {
        accessToken: mockDb.accessToken,
        refreshToken: mockDb.refreshToken,
        tokenType: "Bearer",
        expiresIn: 3600,
      },
      user: shapeUser(user, assignments),
      accessControl,
    };
    return ok(response);
  }

  // POST /auth/select-department (mock-only — 2-step flow)
  if (path === "/auth/select-department" && method === "POST") {
    await simulateLatency(300);
    const data = (await getBody(body)) as {
      departmentSelectionToken: string;
      userDepartmentRoleId: string;
    };
    const userId = mockDb.departmentSelectionTokens.get(data.departmentSelectionToken);
    if (!userId) {
      return fail("Invalid or expired selection token", 401, "INVALID_TOKEN");
    }
    const user = mockDb.users.find((u) => u.id === userId);
    if (!user) return fail("User not found", 404, "USER_NOT_FOUND");

    const udr = mockDb.userDepartmentRoles.find(
      (u) => u.id === data.userDepartmentRoleId && u.userId === userId,
    );
    if (!udr) return fail("Invalid assignment", 400, "INVALID_ASSIGNMENT");

    mockDb.departmentSelectionTokens.delete(data.departmentSelectionToken);

    const assignments = mockDb.userDepartmentRoles.filter(
      (u) => u.userId === userId && u.isActive,
    );
    const accessControl = buildAccessControl(udr);
    const response: LoginResponse = {
      authentication: {
        accessToken: mockDb.accessToken,
        refreshToken: mockDb.refreshToken,
        tokenType: "Bearer",
        expiresIn: 3600,
      },
      user: shapeUser(user, assignments),
      accessControl,
    };
    return ok(response);
  }

  // POST /auth/switch-department (mock-only)
  if (path === "/auth/switch-department" && method === "POST") {
    await simulateLatency(200);
    const data = (await getBody(body)) as { userDepartmentRoleId: string };
    const udr = mockDb.userDepartmentRoles.find(
      (u) => u.id === data.userDepartmentRoleId && u.isActive,
    );
    if (!udr) return fail("Assignment not found", 404, "NOT_FOUND");
    const user = mockDb.users.find((u) => u.id === udr.userId);
    if (!user) return fail("User not found", 404, "USER_NOT_FOUND");

    const assignments = mockDb.userDepartmentRoles.filter(
      (u) => u.userId === user.id && u.isActive,
    );
    const accessControl = buildAccessControl(udr);
    const response: LoginResponse = {
      authentication: {
        accessToken: mockDb.accessToken,
        refreshToken: mockDb.refreshToken,
        tokenType: "Bearer",
        expiresIn: 3600,
      },
      user: shapeUser(user, assignments),
      accessControl,
    };
    return ok(response);
  }

  // POST /auth/refresh
  if (path === "/auth/refresh" || path === "/auth/refresh-token") {
    if (method === "POST") {
      await simulateLatency(150);
      return ok({
        accessToken: mockDb.accessToken,
        refreshToken: mockDb.refreshToken,
        expiresIn: 3600,
      });
    }
  }

  // POST /auth/logout
  if (path === "/auth/logout" && method === "POST") {
    await simulateLatency(100);
    return ok({ success: true });
  }

  // GET /auth/me
  if (path === "/auth/me" && method === "GET") {
    await simulateLatency(200);
    const user = mockDb.users.find((u) => u.status === "active");
    if (!user) return fail("Unauthorized", 401, "UNAUTHORIZED");

    const assignments = mockDb.userDepartmentRoles.filter(
      (u) => u.userId === user.id && u.isActive,
    );
    const currentDepartmentRole = assignments.find((u) => u.isPrimary) ?? assignments[0] ?? null;
    const accessControl = buildAccessControl(currentDepartmentRole);
    return ok({
      user: shapeUser(user, assignments),
      userDepartmentRoles: assignments,
      currentDepartmentRole,
      accessControl,
    });
  }

  // GET /auth/me/menus
  if (path === "/auth/me/menus" && method === "GET") {
    await simulateLatency(150);
    const user = mockDb.users.find((u) => u.status === "active");
    if (!user) return fail("Unauthorized", 401, "UNAUTHORIZED");
    const currentDepartmentRole = mockDb.userDepartmentRoles.find(
      (u) => u.userId === user.id && u.isPrimary,
    );
    return ok(buildAccessControl(currentDepartmentRole ?? null).menus);
  }

  // GET /auth/me/permissions
  if (path === "/auth/me/permissions" && method === "GET") {
    await simulateLatency(150);
    const user = mockDb.users.find((u) => u.status === "active");
    if (!user) return fail("Unauthorized", 401, "UNAUTHORIZED");
    const currentDepartmentRole = mockDb.userDepartmentRoles.find(
      (u) => u.userId === user.id && u.isPrimary,
    );
    return ok(buildAccessControl(currentDepartmentRole ?? null).permissions);
  }

  // POST /auth/change-password
  if (path === "/auth/change-password" && method === "POST") {
    await simulateLatency(400);
    return ok({ success: true }, "เปลี่ยนรหัสผ่านเรียบร้อย");
  }

  // POST /auth/forgot-password
  if (path === "/auth/forgot-password" && method === "POST") {
    await simulateLatency(500);
    return ok({ success: true }, "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว");
  }

  // POST /auth/reset-password
  if (path === "/auth/reset-password" && method === "POST") {
    await simulateLatency(400);
    return ok({ success: true }, "รีเซ็ตรหัสผ่านเรียบร้อย");
  }

  return null;
}
