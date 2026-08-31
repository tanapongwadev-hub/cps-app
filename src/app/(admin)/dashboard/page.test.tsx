"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        firstName: "Somchai",
        lastName: "Jaidee",
        username: "somchai",
        email: "somchai@example.com",
        isSuperAdmin: false,
      },
    }),
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

vi.mock("@/features/users/hooks/use-users", () => ({ useUsers: vi.fn() }));
vi.mock("@/features/departments/hooks/use-departments", () => ({ useDepartments: vi.fn() }));
vi.mock("@/features/roles/hooks/use-roles", () => ({ useRoles: vi.fn() }));
vi.mock("@/features/sessions/hooks/use-sessions", () => ({ useSessions: vi.fn() }));

import { useUsers } from "@/features/users/hooks/use-users";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useSessions } from "@/features/sessions/hooks/use-sessions";

function queryResult(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUsers).mockReturnValue(
      queryResult({
        data: {
          items: [
            {
              id: "u1",
              firstName: "Somchai",
              lastName: "Jaidee",
              username: "somchai",
              email: "somchai@example.com",
              isActive: true,
              status: "active",
              lastLoginAt: "2026-08-30T00:00:00.000Z",
            },
          ],
          meta: { page: 1, limit: 5, totalItems: 42, totalPages: 9 },
        },
      }) as unknown as ReturnType<typeof useUsers>,
    );
    vi.mocked(useDepartments).mockReturnValue(
      queryResult({
        data: { items: [], meta: { page: 1, limit: 20, totalItems: 7, totalPages: 1 } },
      }) as unknown as ReturnType<typeof useDepartments>,
    );
    vi.mocked(useRoles).mockReturnValue(
      queryResult({
        data: { items: [], meta: { page: 1, limit: 1, totalItems: 5, totalPages: 5 } },
      }) as unknown as ReturnType<typeof useRoles>,
    );
    vi.mocked(useSessions).mockReturnValue(
      queryResult({
        data: {
          items: [{ id: "s1", status: "active", userEmail: "somchai@example.com" }],
          meta: { page: 1, limit: 5, totalItems: 3, totalPages: 1 },
        },
      }) as unknown as ReturnType<typeof useSessions>,
    );
  });

  it("renders the greeting hero and KPI counts from the backend", () => {
    render(<DashboardPage />);

    // The hero name sits next to a 👋 emoji span, so match via the heading's
    // full text content rather than an exact getByText (which would need an
    // element whose *entire* text is just the name).
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Somchai Jaidee");

    // The hero's "quick stats" row renders usersCount/departmentsCount/
    // rolesCount directly (not through the KPI cards' count-up animation,
    // which needs real rAF frames to settle and isn't worth faking here).
    expect(screen.getByText("42 ผู้ใช้")).toBeInTheDocument();
    expect(screen.getByText("7 แผนก")).toBeInTheDocument();
    expect(screen.getByText("5 บทบาท")).toBeInTheDocument();

    // The active-sessions KPI card's hint text is also a plain (non-animated)
    // render of sessionsCount.
    expect(screen.getByText("จากทั้งหมด 3 เซสชัน")).toBeInTheDocument();
  });

  it("shows a skeleton in the users KPI card while loading", () => {
    vi.mocked(useUsers).mockReturnValue(
      queryResult({ data: undefined, isLoading: true }) as unknown as ReturnType<typeof useUsers>,
    );
    render(<DashboardPage />);
    expect(screen.getByText("ผู้ใช้งานทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("— ผู้ใช้")).toBeInTheDocument();
  });

  it("lists recent users with a link to their profile", () => {
    render(<DashboardPage />);
    const link = screen.getByRole("link", { name: /Somchai Jaidee/ });
    expect(link).toHaveAttribute("href", "/user-management/users?id=u1");
  });

  it("renders quick actions linking to the right routes", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("link", { name: /เพิ่มผู้ใช้งาน/ })).toHaveAttribute(
      "href",
      "/user-management/users",
    );
    expect(screen.getByRole("link", { name: /จัดการเมนู/ })).toHaveAttribute(
      "href",
      "/system/menu-management",
    );
  });

  it("refetches every dashboard query when รีเฟรช is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: /รีเฟรช/ }));

    expect(vi.mocked(useUsers).mock.results[0]?.value.refetch).toHaveBeenCalled();
    expect(vi.mocked(useDepartments).mock.results[0]?.value.refetch).toHaveBeenCalled();
    expect(vi.mocked(useRoles).mock.results[0]?.value.refetch).toHaveBeenCalled();
    expect(vi.mocked(useSessions).mock.results[0]?.value.refetch).toHaveBeenCalled();
  });
});
