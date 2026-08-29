import { describe, it, expect } from "vitest";
import {
  actionCodesFromSelectedIds,
  actionOrder,
  groupPermissionsByMenu,
  labelForAction,
  labelForMenu,
  readActionCode,
  selectedPermissionIdsFromActionCodes,
} from "./permission-utils";
import type { Permission } from "@/features/permissions/types";

describe("readActionCode", () => {
  it("returns string when given a string", () => {
    expect(readActionCode("READ")).toBe("READ");
  });
  it("returns the code from a ref object", () => {
    expect(readActionCode({ id: "x", code: "DELETE" })).toBe("DELETE");
  });
  it("returns null for null/undefined", () => {
    expect(readActionCode(null)).toBeNull();
    expect(readActionCode(undefined)).toBeNull();
  });
  it("returns null for objects without a string code", () => {
    expect(readActionCode({})).toBeNull();
    expect(readActionCode({ code: 123 })).toBeNull();
  });
});

describe("actionOrder", () => {
  it("orders CREATE < READ < UPDATE < DELETE", () => {
    const order = ["DELETE", "CREATE", "UPDATE", "READ"]
      .map(actionOrder)
      .sort((a, b) => a - b);
    expect(order).toEqual([0, 1, 2, 3]);
  });
  it("returns 99 for unknown codes", () => {
    expect(actionOrder("WHATEVER")).toBe(99);
  });
  it("handles null/undefined safely", () => {
    expect(actionOrder(null)).toBe(99);
    expect(actionOrder(undefined)).toBe(99);
  });
});

describe("labelForAction", () => {
  it("returns Thai label for known actions", () => {
    expect(labelForAction("CREATE")).toBe("สร้าง");
    expect(labelForAction("READ")).toBe("อ่าน");
    expect(labelForAction("UPDATE")).toBe("แก้ไข");
    expect(labelForAction("DELETE")).toBe("ลบ");
  });
  it("is case-insensitive", () => {
    expect(labelForAction("read")).toBe("อ่าน");
  });
  it("returns the input for unknown codes", () => {
    expect(labelForAction("FOOBAR")).toBe("FOOBAR");
  });
  it("returns - for null/undefined", () => {
    expect(labelForAction(null)).toBe("-");
    expect(labelForAction(undefined)).toBe("-");
  });
});

describe("labelForMenu", () => {
  it("prefers nameTh > nameEn > code", () => {
    expect(labelForMenu({ id: "1", code: "USER", nameTh: "ผู้ใช้" })).toBe("ผู้ใช้");
    expect(labelForMenu({ id: "1", code: "USER", nameEn: "User" })).toBe("User");
    expect(labelForMenu({ id: "1", code: "USER" })).toBe("USER");
  });
  it("returns - for null/undefined", () => {
    expect(labelForMenu(null)).toBe("-");
    expect(labelForMenu(undefined)).toBe("-");
  });
});

function makePerm(overrides: Partial<Permission>): Permission {
  return {
    id: "perm-1",
    code: "USER_READ",
    isActive: true,
    menu: { id: "m1", code: "USER", nameTh: "ผู้ใช้งาน" },
    action: { id: "a1", code: "READ", nameTh: "อ่าน" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupPermissionsByMenu", () => {
  it("groups permissions by menu.code", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", menu: { id: "m1", code: "USER", nameTh: "ผู้ใช้งาน" }, action: { id: "a", code: "READ" } }),
      makePerm({ id: "2", menu: { id: "m1", code: "USER", nameTh: "ผู้ใช้งาน" }, action: { id: "a", code: "CREATE" } }),
      makePerm({ id: "3", menu: { id: "m2", code: "ROLE", nameTh: "บทบาท" }, action: { id: "a", code: "READ" } }),
    ];
    const groups = groupPermissionsByMenu(perms);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.menu.code).toBe("ROLE"); // alphabetical Thai sort
    expect(groups[1]?.menu.code).toBe("USER");
    expect(groups[1]?.perms.map((p) => p.id)).toEqual(["2", "1"]); // CREATE before READ
  });

  it("skips permissions without a menu", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", menu: undefined }),
      makePerm({ id: "2", menu: { id: "m1", code: "USER" } }),
    ];
    const groups = groupPermissionsByMenu(perms);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.perms.map((p) => p.id)).toEqual(["2"]);
  });

  it("skips inactive permissions", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", menu: { id: "m1", code: "USER" }, isActive: true }),
      makePerm({ id: "2", menu: { id: "m1", code: "USER" }, isActive: false }),
    ];
    const groups = groupPermissionsByMenu(perms);
    expect(groups[0]?.perms).toHaveLength(1);
    expect(groups[0]?.perms[0]?.id).toBe("1");
  });
});

describe("selectedPermissionIdsFromActionCodes", () => {
  it("returns permission IDs whose action code matches any of the role's action codes", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", action: { id: "a", code: "READ" } }),
      makePerm({ id: "2", action: { id: "a", code: "CREATE" } }),
      makePerm({ id: "3", action: { id: "a", code: "DELETE" } }),
    ];
    expect(selectedPermissionIdsFromActionCodes(perms, ["READ"])).toEqual(["1"]);
    expect(selectedPermissionIdsFromActionCodes(perms, ["READ", "CREATE"])).toEqual(["1", "2"]);
  });

  it("is case-insensitive", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", action: { id: "a", code: "read" } }),
    ];
    expect(selectedPermissionIdsFromActionCodes(perms, ["READ"])).toEqual(["1"]);
  });

  it("returns empty array when no action codes", () => {
    const perms: Permission[] = [makePerm({})];
    expect(selectedPermissionIdsFromActionCodes(perms, undefined)).toEqual([]);
    expect(selectedPermissionIdsFromActionCodes(perms, [])).toEqual([]);
  });
});

describe("actionCodesFromSelectedIds", () => {
  it("returns union of action codes from selected permission IDs", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", action: { id: "a", code: "READ" } }),
      makePerm({ id: "2", action: { id: "a", code: "READ" } }), // different menu, same action
      makePerm({ id: "3", action: { id: "a", code: "CREATE" } }),
    ];
    expect(actionCodesFromSelectedIds(perms, ["1", "3"])).toEqual(["READ", "CREATE"]);
  });

  it("handles string action (legacy mock shape)", () => {
    const perms: Permission[] = [
      makePerm({ id: "1", action: "view" as unknown as Permission["action"] }),
    ];
    expect(actionCodesFromSelectedIds(perms, ["1"])).toEqual(["VIEW"]);
  });

  it("returns empty array for no selections", () => {
    const perms: Permission[] = [makePerm({})];
    expect(actionCodesFromSelectedIds(perms, [])).toEqual([]);
  });
});
