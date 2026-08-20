import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PermissionsPage from "./page";

let isSuperAdmin = false;
let permissions = ["user.view"];
let permissionItems: Array<{ id: string; code: string }> = [];

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
  useDeletePermission: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/features/permissions/components/permission-form-dialog", () => ({
  PermissionFormDialog: () => null,
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
});
