"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "./page";
import type { User } from "@/features/auth/types";

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/users/hooks/use-users", () => ({
  useUsers: vi.fn(),
  useDeleteUser: vi.fn(),
  useUpdateUserStatus: vi.fn(),
  useResetPassword: vi.fn(),
}));
vi.mock("@/features/sessions/hooks/use-sessions", () => ({
  useRevokeAllSessionsForUser: vi.fn(),
}));
vi.mock("@/features/departments/hooks/use-departments", () => ({ useDepartments: vi.fn() }));
vi.mock("@/features/roles/hooks/use-roles", () => ({ useRoles: vi.fn() }));

// UserFormDialog and UserDetailSheet have their own dedicated tests
// (user-form-dialog.test.tsx). Here we only care that this page opens them
// with the right props.
vi.mock("@/features/users/components/user-form-dialog", () => ({
  UserFormDialog: ({ open, user }: { open: boolean; user: User | null }) =>
    open ? <div data-testid="user-form-dialog">form:{user?.username ?? "new"}</div> : null,
}));
vi.mock("@/features/users/components/user-detail-sheet", () => ({
  UserDetailSheet: ({ open, user }: { open: boolean; user: User }) =>
    open ? <div data-testid="user-detail-sheet">detail:{user.username}</div> : null,
}));

import {
  useUsers,
  useDeleteUser,
  useUpdateUserStatus,
  useResetPassword,
} from "@/features/users/hooks/use-users";
import { useRevokeAllSessionsForUser } from "@/features/sessions/hooks/use-sessions";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useRoles } from "@/features/roles/hooks/use-roles";

function baseUser(overrides: Partial<User>): User {
  return {
    id: "u1",
    username: "somchai",
    email: "somchai@example.com",
    firstName: "Somchai",
    lastName: "Jaidee",
    isActive: true,
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as User;
}

const activeUser = baseUser({ id: "u1", username: "somchai", firstName: "Somchai", lastName: "Jaidee" });
const inactiveUser = baseUser({
  id: "u2",
  username: "malee",
  firstName: "Malee",
  lastName: "Suksan",
  isActive: false,
  status: "inactive",
});

describe("UsersPage", () => {
  let deleteMutateAsync: ReturnType<typeof vi.fn>;
  let statusMutate: ReturnType<typeof vi.fn>;
  let refetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    statusMutate = vi.fn();
    refetch = vi.fn();

    vi.mocked(useUsers).mockReturnValue({
      data: {
        items: [activeUser, inactiveUser],
        meta: { page: 1, limit: 10, totalItems: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useUsers>);
    vi.mocked(useDeleteUser).mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteUser>);
    vi.mocked(useUpdateUserStatus).mockReturnValue({
      mutate: statusMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserStatus>);
    vi.mocked(useResetPassword).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useResetPassword>);
    vi.mocked(useRevokeAllSessionsForUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useRevokeAllSessionsForUser>);
    vi.mocked(useDepartments).mockReturnValue({
      data: { items: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } },
    } as unknown as ReturnType<typeof useDepartments>);
    vi.mocked(useRoles).mockReturnValue({
      data: { items: [], meta: { page: 1, limit: 100, totalItems: 0, totalPages: 1 } },
    } as unknown as ReturnType<typeof useRoles>);
  });

  it("renders the user table with rows from the query", () => {
    render(<UsersPage />);
    expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    expect(screen.getByText("Malee Suksan")).toBeInTheDocument();
    expect(screen.getByText("ใช้งาน")).toBeInTheDocument();
    expect(screen.getByText("ระงับ")).toBeInTheDocument();
  });

  it("opens the create form dialog with no user when เพิ่มผู้ใช้งาน is clicked", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /เพิ่มผู้ใช้งาน/ }));
    expect(screen.getByTestId("user-form-dialog")).toHaveTextContent("form:new");
  });

  it("opens the edit form dialog prefilled from the row action menu", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "เมนู Somchai Jaidee" }));
    await user.click(screen.getByRole("menuitem", { name: "แก้ไข" }));

    expect(screen.getByTestId("user-form-dialog")).toHaveTextContent("form:somchai");
  });

  it("opens the detail sheet from the row action menu", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "เมนู Somchai Jaidee" }));
    await user.click(screen.getByRole("menuitem", { name: "ดูรายละเอียด" }));

    expect(screen.getByTestId("user-detail-sheet")).toHaveTextContent("detail:somchai");
  });

  it("toggles user status from the row action menu", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "เมนู Somchai Jaidee" }));
    await user.click(screen.getByRole("menuitem", { name: "ระงับการใช้งาน" }));

    expect(statusMutate).toHaveBeenCalledWith({ id: "u1", isActive: false });
  });

  it("deletes a user after confirming the delete dialog", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "เมนู Somchai Jaidee" }));
    await user.click(screen.getByRole("menuitem", { name: "ลบ" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลบ" }));

    expect(deleteMutateAsync).toHaveBeenCalledWith("u1");
  });

  it("refetches the list when รีเฟรช is clicked", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /รีเฟรช/ }));
    expect(refetch).toHaveBeenCalled();
  });
});
