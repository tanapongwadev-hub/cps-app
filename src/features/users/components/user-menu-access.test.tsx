import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  UserAccessMenuItem,
  UserAccessSummary,
  UserAssignmentAccess,
} from "../api/users-api";
import { UserMenuAccess } from "./user-menu-access";

const { mockSummary, refetch } = vi.hoisted(() => ({
  mockSummary: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("../hooks/use-users", () => ({
  useUserAccessSummary: mockSummary,
}));

const departmentAssignment: UserAssignmentAccess = {
  assignmentId: "department-assignment",
  department: { id: "dept-1", code: "PROD", name: "ฝ่ายผลิต" },
  role: {
    id: "role-1",
    code: "MANAGER",
    name: "ผู้จัดการ",
    scopeType: "DEPARTMENT",
  },
  isActive: true,
  expiredAt: null,
  permissions: ["users.read"],
  menuCount: 2,
  menus: [
    {
      id: "users",
      code: "USERS",
      name: "จัดการผู้ใช้งาน",
      nameEn: "User management",
      path: "/user-management/users",
      icon: "Users",
      menuType: "MENU",
      sortOrder: 1,
      permissions: ["users.read"],
      children: [
        {
          id: "users-create",
          code: "USERS_CREATE",
          name: "เพิ่มผู้ใช้งาน",
          nameEn: "Create user",
          path: null,
          icon: null,
          menuType: "BUTTON",
          sortOrder: 1,
          permissions: ["users.create"],
          children: [],
        },
      ],
    },
  ],
};

const systemAssignment: UserAssignmentAccess = {
  assignmentId: "system-assignment",
  department: null,
  role: {
    id: "role-2",
    code: "AUDITOR",
    name: "ผู้ตรวจสอบ",
    scopeType: "SYSTEM",
  },
  isActive: true,
  expiredAt: null,
  permissions: [],
  menuCount: 0,
  menus: [],
};

function summary(assignments: UserAssignmentAccess[]): UserAccessSummary {
  return { userId: "7", assignments };
}

describe("UserMenuAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummary.mockReturnValue({ data: summary([]), isLoading: false, isError: false, refetch });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups nested accessible menus by assignment", () => {
    mockSummary.mockReturnValue({
      data: summary([departmentAssignment, systemAssignment]),
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getByText("ฝ่ายผลิต")).toBeInTheDocument();
    expect(screen.getByText("ผู้จัดการ")).toBeInTheDocument();
    expect(screen.getByText("ระบบ / ทุกแผนก")).toBeInTheDocument();
    expect(screen.getByText("จัดการผู้ใช้งาน")).toBeInTheDocument();
    expect(screen.getByText("เพิ่มผู้ใช้งาน")).toBeInTheDocument();
    expect(screen.getByText("/user-management/users")).toBeInTheDocument();
  });

  it("renders skeletons while the access summary loads", () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getAllByTestId("menu-access-skeleton").length).toBeGreaterThan(0);
  });

  it("hides an assignment menu when its expiry boundary passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T00:00:00.000Z"));
    const menuName = "expires-at-boundary";
    const expiringMenu: UserAccessMenuItem = {
      id: "expires-at-boundary",
      code: "EXPIRES_AT_BOUNDARY",
      name: menuName,
      nameEn: "Expires at boundary",
      path: null,
      icon: null,
      menuType: "MENU",
      sortOrder: 1,
      permissions: ["users.read"],
      children: [],
    };
    mockSummary.mockReturnValue({
      data: summary([
        {
          ...departmentAssignment,
          expiredAt: "2026-08-02T00:00:01.000Z",
          menus: [expiringMenu],
        },
      ]),
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getByText(menuName)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(
      screen.getByText("\u0e44\u0e21\u0e48\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19"),
    ).toBeInTheDocument();
    expect(screen.queryByText(menuName)).not.toBeInTheDocument();
  });

  it("retries after an access summary error", async () => {
    const user = userEvent.setup();
    mockSummary.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getByText("ไม่สามารถโหลดเมนูที่เข้าถึงได้")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลองใหม่" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("explains when the user has no assignments", () => {
    render(<UserMenuAccess userId="7" />);

    expect(screen.getByText("ไม่มี Assignment ที่ยังบันทึกไว้")).toBeInTheDocument();
  });

  it("explains when an available assignment has no accessible menus", () => {
    mockSummary.mockReturnValue({
      data: summary([systemAssignment]),
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getByText("ไม่มีเมนูที่เข้าถึงได้")).toBeInTheDocument();
  });

  it("hides menus from inactive and expired assignments", () => {
    const unavailableMenu: UserAccessMenuItem = {
      ...departmentAssignment.menus[0]!,
      id: "hidden-menu",
      name: "เมนูที่ไม่ควรแสดง",
    };
    mockSummary.mockReturnValue({
      data: summary([
        { ...departmentAssignment, assignmentId: "inactive", isActive: false, menus: [unavailableMenu] },
        {
          ...departmentAssignment,
          assignmentId: "expired",
          expiredAt: "2020-01-01T00:00:00.000Z",
          menus: [unavailableMenu],
        },
      ]),
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<UserMenuAccess userId="7" />);

    expect(screen.getAllByText("ไม่พร้อมใช้งาน")).toHaveLength(2);
    expect(screen.queryByText("เมนูที่ไม่ควรแสดง")).not.toBeInTheDocument();
  });
});
