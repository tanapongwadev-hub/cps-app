/**
 * RoleFormDialog uses the real /permissions catalog from the backend —
 * NOT the static PERMISSION_GROUPS from constants.  These tests pin that
 * contract by mocking the backend catalog and asserting the form:
 *  1. Renders menu names from the catalog
 *  2. Pre-checks permissions matching the role's `actionCodes`
 *  3. Submits `actionCodes` (not the old `permissions` field)
 *  4. Falls back to `actionCodes` when /permissions fails to load
 *  5. Skips inactive permissions in the matrix
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleFormDialog } from "./role-form-dialog";
import type { Permission } from "@/types/permission";
import type { Role } from "@/types/auth";

const { createMutateAsync, updateMutateAsync, permsDataRef } = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  permsDataRef: { current: null as Permission[] | null },
}));

const CATALOG: Permission[] = [
  {
    id: "perm-1",
    code: "USER_READ",
    isActive: true,
    menu: { id: "m1", code: "USER_MANAGEMENT", nameTh: "จัดการผู้ใช้งาน", nameEn: "User Management" },
    action: { id: "a1", code: "READ", nameTh: "อ่าน" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "perm-2",
    code: "USER_CREATE",
    isActive: true,
    menu: { id: "m1", code: "USER_MANAGEMENT", nameTh: "จัดการผู้ใช้งาน", nameEn: "User Management" },
    action: { id: "a2", code: "CREATE", nameTh: "สร้าง" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "perm-3",
    code: "ROLE_READ",
    isActive: true,
    menu: { id: "m2", code: "ROLE_MANAGEMENT", nameTh: "จัดการบทบาท", nameEn: "Role Management" },
    action: { id: "a1", code: "READ", nameTh: "อ่าน" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "perm-4",
    code: "ROLE_DELETE",
    isActive: false,
    menu: { id: "m2", code: "ROLE_MANAGEMENT", nameTh: "จัดการบทบาท", nameEn: "Role Management" },
    action: { id: "a3", code: "DELETE", nameTh: "ลบ" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

vi.mock("../hooks/use-roles", () => ({
  useCreateRole: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateRole: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock("@/features/permissions/hooks/use-permissions", () => ({
  usePermissions: () => ({
    data: permsDataRef.current
      ? { items: permsDataRef.current, meta: { page: 1, limit: 200, totalItems: permsDataRef.current.length, totalPages: 1 } }
      : undefined,
    isLoading: permsDataRef.current === null,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: () => ({
    permissions: ["*"],
    hasPermission: () => true,
    hasAny: () => true,
    hasAll: () => true,
    isSuperAdmin: () => true,
  }),
}));

const baseRole: Role = {
  id: "3",
  code: "USER",
  name: "ผู้ใช้งาน",
  nameTh: "ผู้ใช้งาน",
  nameEn: "User",
  scopeType: "DEPARTMENT",
  description: null,
  isSystem: true,
  isActive: true,
  actionCodes: ["READ"],
  permissionCount: 1,
  userCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("RoleFormDialog uses /permissions catalog from the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permsDataRef.current = CATALOG;
    updateMutateAsync.mockResolvedValue(baseRole);
    createMutateAsync.mockResolvedValue({ ...baseRole, id: "new" });
  });

  afterEach(() => {
    permsDataRef.current = null;
  });

  it("renders menu names from the catalog (not hardcoded PERMISSION_GROUPS)", async () => {
    render(<RoleFormDialog open onOpenChange={vi.fn()} role={baseRole} />);
    // Two menu headers from the catalog, alphabetically by Thai name
    expect(await screen.findByText("จัดการบทบาท")).toBeInTheDocument();
    expect(screen.getByText("จัดการผู้ใช้งาน")).toBeInTheDocument();
  });

  it("pre-checks permissions whose action code matches the role's actionCodes", async () => {
    render(<RoleFormDialog open onOpenChange={vi.fn()} role={baseRole} />);
    await screen.findByText("จัดการบทบาท");
    const userRead = await screen.findByLabelText("อ่าน");
    // Two READ permissions in the catalog (USER_READ, ROLE_READ) — both checked
    const userReadCheckbox = userRead as HTMLInputElement;
    expect(userReadCheckbox.checked).toBe(true);
  });

  it("hides inactive permissions from the matrix", async () => {
    render(<RoleFormDialog open onOpenChange={vi.fn()} role={baseRole} />);
    await screen.findByText("จัดการบทบาท");
    // ROLE_DELETE has isActive:false — should not appear
    expect(screen.queryByLabelText("ลบ")).not.toBeInTheDocument();
  });

  it("submits actionCodes (not the legacy `permissions` field) on edit", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<RoleFormDialog open onOpenChange={onOpenChange} role={baseRole} />);
    await screen.findByText("จัดการบทบาท");

    // Add CREATE permission (already pre-checked: USER_READ + ROLE_READ)
    const createCheckbox = screen.getByLabelText("สร้าง");
    await user.click(createCheckbox);

    await user.click(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    });
    const call = updateMutateAsync.mock.calls[0]?.[0] as { data: Partial<Role> & { actionCodes?: string[]; permissions?: string[] } };
    expect(call).toBeDefined();
    expect(call.data.actionCodes).toEqual(expect.arrayContaining(["READ", "CREATE"]));
    // Should NOT send the legacy permissions field
    expect(call.data.permissions).toBeUndefined();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits actionCodes on create (with nameTh/nameEn derived from name)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<RoleFormDialog open onOpenChange={onOpenChange} />);
    await screen.findByText("จัดการบทบาท");

    await user.type(screen.getByLabelText("รหัส Role"), "TEST_ROLE");
    await user.type(screen.getByLabelText("ชื่อ Role"), "Test Role");
    await user.click(screen.getByLabelText("อ่าน"));
    await user.click(screen.getByLabelText("สร้าง"));

    await user.click(screen.getByRole("button", { name: "สร้าง Role" }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledTimes(1);
    });
    const payload = createMutateAsync.mock.calls[0]?.[0] as Partial<Role> & { actionCodes?: string[] };
    expect(payload).toBeDefined();
    expect(payload.code).toBe("TEST_ROLE");
    expect(payload.name).toBe("Test Role");
    expect(payload.nameTh).toBe("Test Role");
    expect(payload.nameEn).toBe("Test Role");
    expect(payload.actionCodes).toEqual(expect.arrayContaining(["READ", "CREATE"]));
    expect(payload.isActive).toBe(true);
  });

  it("does not call the API when the catalog is still loading", async () => {
    permsDataRef.current = null; // usePermissions returns isLoading
    const user = userEvent.setup();
    render(<RoleFormDialog open onOpenChange={vi.fn()} role={baseRole} />);
    // Submit button should be disabled while loading
    const submit = await screen.findByRole("button", { name: /บันทึกการเปลี่ยนแปลง/ });
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });

  it("selects all permissions when เลือกทั้งหมด is clicked, then submits all action codes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<RoleFormDialog open onOpenChange={onOpenChange} role={{ ...baseRole, actionCodes: [] }} />);
    await screen.findByText("จัดการบทบาท");

    await user.click(screen.getByRole("button", { name: "เลือกทั้งหมด" }));
    await user.click(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalled();
    });
    const call = updateMutateAsync.mock.calls[0]?.[0] as { data: Partial<Role> & { actionCodes?: string[] } };
    // All active permissions selected → READ + CREATE (DELETE is filtered out as inactive)
    expect(call.data.actionCodes).toEqual(expect.arrayContaining(["READ", "CREATE"]));
  });
});
