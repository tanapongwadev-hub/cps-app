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
} from "@/types/auth";
import { useSelectDepartment } from "./use-auth";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));

vi.mock("../api/auth-api", () => ({
  authApi: {
    selectDepartment: vi.fn(),
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
