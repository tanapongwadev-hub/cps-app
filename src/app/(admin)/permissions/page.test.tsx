import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PermissionsPage from "./page";

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { displayName: "Normal User" } }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: () => ({
    permissions: ["user.view"],
    hasPermission: vi.fn(),
    hasAny: vi.fn(),
    hasAll: vi.fn(),
    isSuperAdmin: () => false,
  }),
}));

vi.mock("@/features/permissions/hooks/use-permissions", () => ({
  usePermissions: () => ({
    data: { items: [], meta: { page: 1, limit: 1000, totalItems: 0, totalPages: 0 } },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useDeletePermission: vi.fn(),
}));

vi.mock("@/features/permissions/components/permission-form-dialog", () => ({
  PermissionFormDialog: () => null,
}));

vi.mock("@/features/permissions/components/department-permission-dialog", () => ({
  DepartmentPermissionDialog: () => null,
}));

describe("PermissionsPage visibility", () => {
  it("hides the permission catalog from non-super-admin users", () => {
    render(<PermissionsPage />);

    expect(screen.getByText(/สิทธิ์ของฉัน/)).toBeInTheDocument();
    expect(screen.queryByText("แคตตาล็อกสิทธิ์")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "กำหนดแผนก" })).not.toBeInTheDocument();
  });
});
