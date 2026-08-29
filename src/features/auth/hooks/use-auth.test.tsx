import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { ApiClientError } from "@/services/api-client";
import type {
  SelectDepartmentResponse,
  User,
  UserDepartmentRole,
} from "@/features/auth/types";
import { useSelectDepartment, useSwitchDepartment } from "./use-auth";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));

vi.mock("../api/auth-api", () => ({
  authApi: {
    selectDepartment: vi.fn(),
    switchDepartment: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const selectedUser: User = {
  id: "46",
  username: "page.render",
  firstName: "Page",
  lastName: "Render",
  email: "page.render@test.local",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const currentDepartmentRole: UserDepartmentRole = {
  id: "76",
  userId: "46",
  departmentId: "2",
  departmentName: "ฝ่ายปฏิบัติการ",
  departmentCode: "OPS",
  roleId: "3",
  roleName: "ผู้ใช้งาน",
  roleCode: "USER",
  isPrimary: false,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const selectionResponse: SelectDepartmentResponse = {
  authentication: {
    accessToken: "selected-access",
    refreshToken: "selected-refresh",
    tokenType: "Bearer",
    expiresIn: 3600,
  },
  user: selectedUser,
  currentDepartmentRole,
  accessControl: {
    menus: [],
    permissions: ["ticket.read"],
    userDepartmentRoleId: "76",
    departmentId: "2",
    roleId: "3",
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useSelectDepartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    useAuthStore.getState().setPendingSelection(null);
  });

  it("stores the selected session without calling auth me", async () => {
    vi.mocked(authApi.selectDepartment).mockResolvedValue(selectionResponse);
    vi.mocked(authApi.me).mockResolvedValue({
      user: selectedUser,
      currentDepartmentRole,
      accessControl: selectionResponse.accessControl,
    });
    const { result } = renderHook(() => useSelectDepartment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        departmentSelectionToken: "selection-token",
        userDepartmentRoleId: "76",
      });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(authApi.me).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBe("selected-access");
    expect(useAuthStore.getState().currentDepartmentRole?.id).toBe("76");
    expect(routerPush).toHaveBeenCalledWith("/dashboard");
  });

  it("does not create a session when department selection fails", async () => {
    useAuthStore.getState().setPendingSelection({
      mode: "select",
      departmentSelectionToken: "expired-token",
      options: [],
    });
    vi.mocked(authApi.selectDepartment).mockRejectedValue(
      new ApiClientError("Unauthorized", {
        status: 401,
        code: "HTTP_401",
      }),
    );
    const { result } = renderHook(() => useSelectDepartment(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        departmentSelectionToken: "expired-token",
        userDepartmentRoleId: "76",
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().pendingSelection?.mode).toBe("select");
  });
});

describe("useSwitchDepartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    useAuthStore.getState().setSession({
      user: selectedUser,
      currentDepartmentRole,
      accessControl: {
        menus: [],
        permissions: ["materials.we.read"],
        userDepartmentRoleId: "76",
        departmentId: "2",
        roleId: "3",
      },
      accessToken: "we-access",
      refreshToken: "we-refresh",
      expiresAt: Date.now() + 60_000,
    });
  });

  it("stores tokens and access control from the selected assignment response", async () => {
    const pcRole: UserDepartmentRole = {
      ...currentDepartmentRole,
      id: "92",
      departmentId: "6",
      departmentName: "แผนก PC",
      departmentCode: "PC",
    };
    const pcResponse: SelectDepartmentResponse = {
      authentication: {
        accessToken: "pc-access",
        refreshToken: "pc-refresh",
        tokenType: "Bearer",
        expiresIn: 3600,
      },
      user: selectedUser,
      currentDepartmentRole: pcRole,
      accessControl: {
        menus: [
          {
            id: "13",
            parentId: null,
            code: "MATERIALS_MANAGEMENTS",
            nameTh: "จัดการอะไหล่",
            nameEn: "Materials Management",
            name: "จัดการอะไหล่",
            menuType: "MAIN",
            path: "/materials",
            icon: "package",
            sortOrder: 10,
            isVisible: true,
            isActive: true,
            permissions: [],
            children: [
              {
                id: "27",
                parentId: "13",
                code: "MATERIALS_PC_MANAGEMENTS",
                nameTh: "จัดการอะไหล่ PC",
                nameEn: "Material PC",
                name: "จัดการอะไหล่ PC",
                menuType: "MENU",
                path: "/materials/pc",
                icon: null,
                sortOrder: 1,
                isVisible: true,
                isActive: true,
                permissions: ["MATERIALS_PC_MANAGEMENTS.read"],
                children: [],
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
              },
            ],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        permissions: ["MATERIALS_PC_MANAGEMENTS.read"],
        userDepartmentRoleId: "92",
        departmentId: "6",
        roleId: "3",
      },
    };
    vi.mocked(authApi.switchDepartment).mockResolvedValue(pcResponse);
    vi.mocked(authApi.me).mockResolvedValue({
      user: selectedUser,
      currentDepartmentRole,
      accessControl: {
        menus: [],
        permissions: ["materials.we.read"],
        userDepartmentRoleId: "76",
        departmentId: "2",
        roleId: "3",
      },
    });
    const { result } = renderHook(() => useSwitchDepartment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ userDepartmentRoleId: "92" });
    });

    expect(authApi.me).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBe("pc-access");
    expect(useAuthStore.getState().refreshToken).toBe("pc-refresh");
    expect(useAuthStore.getState().currentDepartmentRole?.id).toBe("92");
    expect(useAuthStore.getState().menu[0]?.children?.[0]?.code).toBe(
      "MATERIALS_PC_MANAGEMENTS",
    );
  });
});
