import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/auth";
import { UserFormDialog } from "./user-form-dialog";

const { replace, updateMutateAsync, assignmentData } = vi.hoisted(() => ({
  replace: vi.fn(),
  updateMutateAsync: vi.fn(),
  assignmentData: [
    {
      id: "assignment-1",
      userId: "7",
      departmentId: "dept-1",
      roleId: "role-1",
      isActive: true,
      department: {
        id: "dept-1",
        code: "PROD",
        name: "Production",
        nameTh: "ฝ่ายผลิต",
      },
      role: {
        id: "role-1",
        code: "MANAGER",
        name: "Manager",
        nameTh: "ผู้จัดการ",
        scopeType: "DEPARTMENT",
      },
    },
  ],
}));

const { userMenuAccess } = vi.hoisted(() => ({ userMenuAccess: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("../hooks/use-users", () => ({
  useCreateUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateUser: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
  useUserAssignments: () => ({
    data: assignmentData,
    isLoading: false,
  }),
  useAddUserAssignment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/users/hooks/use-departments", () => ({
  useDepartments: () => ({
    data: {
      items: [
        {
          id: "dept-1",
          code: "PROD",
          name: "Production",
          nameTh: "ฝ่ายผลิต",
          status: "active",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/features/roles/hooks/use-roles", () => ({
  useRoles: () => ({
    data: {
      items: [
        {
          id: "role-1",
          code: "MANAGER",
          name: "Manager",
          nameTh: "ผู้จัดการ",
          scopeType: "DEPARTMENT",
          status: "active",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("./user-menu-access", () => ({
  UserMenuAccess: ({ userId }: { userId: string }) => {
    userMenuAccess(userId);
    return <div>mock user menu access</div>;
  },
}));

const editedUser: User = {
  id: "7",
  username: "somchai",
  firstName: "Somchai",
  lastName: "Jaidee",
  email: "somchai@example.com",
  telephone: "0812345678",
  isActive: true,
  permissionVersion: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("UserFormDialog aggregate edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    updateMutateAsync.mockResolvedValue({
      ...editedUser,
      permissionVersion: 4,
    });
  });

  afterEach(() => {
    useAuthStore.getState().logout();
  });

  it("hydrates assignments and submits one aggregate update", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <UserFormDialog
        open
        onOpenChange={onOpenChange}
        user={editedUser}
      />,
    );

    await user.click(
      screen.getByRole("tab", { name: "แผนก & บทบาท" }),
    );
    expect(await screen.findByText("ฝ่ายผลิต · ผู้จัดการ")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }),
    );

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: "7",
      data: {
        firstName: "Somchai",
        lastName: "Jaidee",
        email: "somchai@example.com",
        telephone: "0812345678",
        assignments: [
          {
            id: "assignment-1",
            departmentId: "dept-1",
            roleId: "role-1",
          },
        ],
      },
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("logs out a self-edit only when permissionVersion changes", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: editedUser,
      isAuthenticated: true,
      accessToken: "access",
      refreshToken: "refresh",
    });
    updateMutateAsync.mockResolvedValue({
      ...editedUser,
      permissionVersion: 5,
    });
    render(
      <UserFormDialog open onOpenChange={vi.fn()} user={editedUser} />,
    );

    await user.click(
      screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }),
    );

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows the selected user's menu access in the third edit tab", async () => {
    const user = userEvent.setup();
    render(<UserFormDialog open onOpenChange={vi.fn()} user={editedUser} />);

    await user.click(screen.getByRole("tab", { name: "เมนูที่เข้าถึงได้" }));

    expect(userMenuAccess).toHaveBeenLastCalledWith("7");
  });
});
