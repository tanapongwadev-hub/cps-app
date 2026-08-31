import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PermissionsPage from "./page";

let isSuperAdmin = false;
let permissions = ["user.view"];
let permissionItems: Array<{
  id: string;
  code: string;
  module?: string;
  action?: string;
  menu?: { nameTh?: string };
}> = [];
let deletePermissionMutateAsync = vi.fn();

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { displayName: "Normal User" } }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: () => ({
    permissions,
    hasPermission: vi.fn(),
    hasAny: vi.fn(),
    hasAll: vi.fn(),
    isSuperAdmin: () => isSuperAdmin,
  }),
}));

vi.mock("@/features/permissions/hooks/use-permissions", () => ({
  usePermissions: () => ({
    data: {
      items: permissionItems,
      meta: { page: 1, limit: 1000, totalItems: permissionItems.length, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useDeletePermission: () => ({ isPending: false, mutateAsync: deletePermissionMutateAsync }),
}));

vi.mock("@/features/permissions/components/permission-form-dialog", () => ({
  PermissionFormDialog: ({
    open,
    permission,
  }: {
    open: boolean;
    permission: { code: string } | null;
  }) =>
    open ? (
      <div data-testid="permission-form-dialog">{permission ? `edit:${permission.code}` : "create"}</div>
    ) : null,
}));

vi.mock("@/features/permissions/components/department-permission-dialog", () => ({
  DepartmentPermissionDialog: ({
    open,
    permission,
  }: {
    open: boolean;
    permission: { code: string } | null;
  }) => (open ? <div data-testid="department-permission-dialog">{permission?.code}</div> : null),
}));

describe("PermissionsPage visibility", () => {
  beforeEach(() => {
    isSuperAdmin = false;
    permissions = ["user.view"];
    permissionItems = [];
    deletePermissionMutateAsync = vi.fn().mockResolvedValue(undefined);
  });

  it("hides the permission catalog from non-super-admin users", () => {
    render(<PermissionsPage />);

    expect(screen.getByText(/สิทธิ์ของฉัน/)).toBeInTheDocument();
    expect(screen.queryByText("แคตตาล็อกสิทธิ์")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "กำหนดแผนก" })).not.toBeInTheDocument();
  });

  it("keeps super-admin department assignment with the permission row actions", async () => {
    isSuperAdmin = true;
    permissions = ["*"];
    permissionItems = [{ id: "permission-1", code: "permission.read" }];
    const user = userEvent.setup();

    render(<PermissionsPage />);

    await user.click(screen.getByRole("tab", { name: "แคตตาล็อกสิทธิ์" }));

    expect(
      screen.getByText("permission.read").closest("table")?.querySelector("thead th:last-child"),
    ).toHaveClass("w-12", "text-right");
    expect(screen.queryByRole("button", { name: "กำหนดแผนก" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เมนู permission.read" }));
    expect(screen.getByRole("menuitem", { name: "กำหนดแผนก" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ลบ" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "กำหนดแผนก" }));

    expect(screen.getByTestId("department-permission-dialog")).toHaveTextContent("permission.read");
  });

  it("groups the user's own permissions by module in the สิทธิ์ของฉัน tab", () => {
    permissions = ["user.view"];
    permissionItems = [
      { id: "p1", code: "user.view", module: "user", action: "view", menu: { nameTh: "ผู้ใช้งาน" } },
    ];

    render(<PermissionsPage />);

    expect(screen.getByText(/ได้รับ 1 สิทธิ์/)).toBeInTheDocument();
    expect(screen.getByText("user.view")).toBeInTheDocument();
    expect(screen.getByText("ผู้ใช้งาน")).toBeInTheDocument();
  });

  it("shows the super-admin banner in the สิทธิ์ของฉัน tab instead of a permission list", () => {
    isSuperAdmin = true;
    permissions = ["*"];
    permissionItems = [{ id: "p1", code: "user.view" }];

    render(<PermissionsPage />);

    expect(screen.getByText("ผู้ใช้นี้มีสิทธิ์ SUPER ADMIN")).toBeInTheDocument();
  });

  it("opens the edit dialog and deletes a permission from the catalog", async () => {
    isSuperAdmin = true;
    permissions = ["*"];
    permissionItems = [{ id: "permission-1", code: "permission.read" }];
    const user = userEvent.setup();

    render(<PermissionsPage />);
    await user.click(screen.getByRole("tab", { name: "แคตตาล็อกสิทธิ์" }));

    await user.click(screen.getByRole("button", { name: "เมนู permission.read" }));
    await user.click(screen.getByRole("menuitem", { name: "แก้ไข" }));
    expect(screen.getByTestId("permission-form-dialog")).toHaveTextContent("edit:permission.read");

    await user.click(screen.getByRole("button", { name: "เมนู permission.read" }));
    await user.click(screen.getByRole("menuitem", { name: "ลบ" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/ยืนยันการลบ/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลบ" }));

    expect(deletePermissionMutateAsync).toHaveBeenCalledWith("permission-1");
  });
});
