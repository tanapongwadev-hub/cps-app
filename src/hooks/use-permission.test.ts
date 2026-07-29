import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
} from "./use-permission";
import { isSuperAdminUser } from "@/stores/auth-store";
import type { User } from "@/types/auth";
import { PERMISSIONS } from "@/constants/permissions";

describe("hasPermission", () => {
  it("returns true for super admin", () => {
    expect(hasPermission(["*"], "user.view")).toBe(true);
  });

  it("returns true for SUPER_ADMIN permission string (real backend)", () => {
    expect(hasPermission(["AUDIT_LOG_READ", "SUPER_ADMIN"], "user.view")).toBe(true);
  });

  it("returns true for matching permission", () => {
    expect(hasPermission(["user.view", "user.create"], "user.view")).toBe(true);
  });

  it("returns false for missing permission", () => {
    expect(hasPermission(["user.view"], "user.delete")).toBe(false);
  });

  it("accepts array of permissions (any match)", () => {
    expect(hasPermission(["user.view"], ["user.view", "user.create"])).toBe(true);
    expect(hasPermission(["user.update"], ["user.view", "user.create"])).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("returns true if any matches", () => {
    expect(hasAnyPermission(["user.view"], ["user.view", "user.delete"])).toBe(true);
  });
  it("returns false if none matches", () => {
    expect(hasAnyPermission(["ticket.view"], ["user.create", "user.delete"])).toBe(false);
  });
  it("returns true for super admin", () => {
    expect(hasAnyPermission(["*"], ["user.create"])).toBe(true);
  });
});

describe("hasAllPermissions", () => {
  it("returns true if all match", () => {
    expect(hasAllPermissions(["user.view", "user.create"], ["user.view", "user.create"])).toBe(true);
  });
  it("returns false if one missing", () => {
    expect(hasAllPermissions(["user.view"], ["user.view", "user.create"])).toBe(false);
  });
  it("returns true for super admin", () => {
    expect(hasAllPermissions(["*"], ["user.view"])).toBe(true);
  });
  it("returns true for empty list", () => {
    expect(hasAllPermissions(["user.view"], [])).toBe(true);
  });
});

describe("isSuperAdmin", () => {
  it("returns true for *", () => {
    expect(isSuperAdmin(["*"])).toBe(true);
  });
  it("returns true for SUPER_ADMIN", () => {
    expect(isSuperAdmin(["USER_MANAGEMENT_READ", "SUPER_ADMIN"])).toBe(true);
  });
  it("returns false for normal user", () => {
    expect(isSuperAdmin(["user.view"])).toBe(false);
  });
});

describe("isSuperAdminUser", () => {
  const baseUser: User = {
    id: "u1",
    username: "tester",
    email: "t@example.com",
    firstName: "T",
    lastName: "E",
    fullName: "T E",
    isActive: true,
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("returns true when user.isSuperAdmin === true", () => {
    expect(isSuperAdminUser({ ...baseUser, isSuperAdmin: true }, [])).toBe(true);
  });

  it("returns true when permissions contain *", () => {
    expect(isSuperAdminUser(baseUser, ["*"])).toBe(true);
  });

  it("returns true when permissions contain SUPER_ADMIN", () => {
    expect(isSuperAdminUser(baseUser, ["AUDIT_LOG_READ", "SUPER_ADMIN"])).toBe(true);
  });

  it("returns false for normal user with normal permissions", () => {
    expect(isSuperAdminUser(baseUser, ["user.view"])).toBe(false);
  });

  it("returns false for null user with normal permissions", () => {
    expect(isSuperAdminUser(null, ["user.view"])).toBe(false);
  });
});

describe("PERMISSIONS constants", () => {
  it("has expected permission codes", () => {
    expect(PERMISSIONS.USER_VIEW).toBe("user.view");
    expect(PERMISSIONS.ROLE_CREATE).toBe("role.create");
    expect(PERMISSIONS.TICKET_VIEW).toBe("ticket.view");
  });
  it("super admin is *", () => {
    expect(PERMISSIONS.SUPER_ADMIN).toBe("*");
  });
});
