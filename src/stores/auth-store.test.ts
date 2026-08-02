import { describe, it, expect } from "vitest";
import {
  buildAuthSessionFromDepartmentSelection,
  isSuperAdminUser,
  userNeedsDepartmentSelection,
} from "./auth-store";
import type {
  SelectDepartmentResponse,
  User,
  UserDepartmentRole,
} from "@/types/auth";

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "u1",
  username: "tester",
  email: "t@example.com",
  firstName: "T",
  lastName: "E",
  fullName: "T E",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("isSuperAdminUser", () => {
  it("returns true when user.isSuperAdmin === true", () => {
    expect(isSuperAdminUser(makeUser({ isSuperAdmin: true }), [])).toBe(true);
  });
  it("returns true when permissions contain *", () => {
    expect(isSuperAdminUser(makeUser(), ["*"])).toBe(true);
  });
  it("returns true when permissions contain SUPER_ADMIN", () => {
    expect(isSuperAdminUser(makeUser(), ["USER_VIEW", "SUPER_ADMIN"])).toBe(true);
  });
  it("returns false for normal user with normal permissions", () => {
    expect(isSuperAdminUser(makeUser(), ["user.view"])).toBe(false);
  });
  it("returns false for null user", () => {
    expect(isSuperAdminUser(null, ["user.view"])).toBe(false);
  });
});

describe("userNeedsDepartmentSelection", () => {
  it("returns false for null user", () => {
    expect(userNeedsDepartmentSelection(null)).toBe(false);
  });

  it("returns false for superadmin (no departments)", () => {
    expect(userNeedsDepartmentSelection(makeUser({ isSuperAdmin: true }))).toBe(false);
  });

  it("returns false for superadmin even with multiple departments (shouldn't happen, but defensive)", () => {
    expect(
      userNeedsDepartmentSelection(
        makeUser({
          isSuperAdmin: true,
          departments: [
            { id: "1", code: "WE", name: "WE" },
            { id: "2", code: "PS", name: "PS" },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("returns false for user with 0 departments", () => {
    expect(userNeedsDepartmentSelection(makeUser())).toBe(false);
  });

  it("returns false for user with 1 department", () => {
    expect(
      userNeedsDepartmentSelection(
        makeUser({
          departments: [{ id: "1", code: "WE", name: "WE" }],
        }),
      ),
    ).toBe(false);
  });

  it("returns true for user with 2 departments", () => {
    expect(
      userNeedsDepartmentSelection(
        makeUser({
          departments: [
            { id: "1", code: "WE", name: "WE" },
            { id: "2", code: "PS", name: "PS" },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("returns true for user with 3+ departments", () => {
    expect(
      userNeedsDepartmentSelection(
        makeUser({
          departments: [
            { id: "1", code: "WE", name: "WE" },
            { id: "2", code: "PS", name: "PS" },
            { id: "3", code: "FN", name: "Finance" },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe("buildAuthSessionFromDepartmentSelection", () => {
  it("builds a session from the selected department response", () => {
    const user = makeUser();
    const currentDepartmentRole: UserDepartmentRole = {
      id: "76",
      userId: "u1",
      departmentId: "2",
      departmentName: "ฝ่ายปฏิบัติการ",
      departmentCode: "OPS",
      roleId: "3",
      roleName: "ผู้ใช้งาน",
      roleCode: "USER",
      isPrimary: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const response: SelectDepartmentResponse = {
      authentication: {
        accessToken: "selected-access",
        refreshToken: "selected-refresh",
        tokenType: "Bearer",
        expiresIn: 3600,
      },
      user,
      currentDepartmentRole,
      accessControl: {
        menus: [],
        permissions: ["ticket.read"],
        userDepartmentRoleId: currentDepartmentRole.id,
        departmentId: currentDepartmentRole.departmentId ?? undefined,
        roleId: currentDepartmentRole.roleId,
      },
    };

    expect(buildAuthSessionFromDepartmentSelection(response)).toMatchObject({
      user,
      currentDepartmentRole,
      accessToken: "selected-access",
      refreshToken: "selected-refresh",
      accessControl: response.accessControl,
    });
  });
});
