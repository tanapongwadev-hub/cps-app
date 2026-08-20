import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_KEYS } from "@/constants/app";
import { usersApi } from "../api/users-api";
import { useUpdateUser, useUserAccessSummary } from "./use-users";

vi.mock("../api/users-api", () => ({
  usersApi: {
    getAccessSummary: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useUpdateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates list, detail, assignment, and access summary caches after one update", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.mocked(usersApi.update).mockResolvedValue({
      id: "7",
      username: "somchai",
      firstName: "Somchai",
      lastName: "Jaidee",
      email: "somchai@example.com",
      isActive: true,
      permissionVersion: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateUser(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "7",
        data: {
          firstName: "Somchai",
          lastName: "Jaidee",
          email: "somchai@example.com",
          assignments: [{ departmentId: "3", roleId: "5" }],
        },
      });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.USERS.ALL,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.USERS.DETAIL("7"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: [...QUERY_KEYS.USERS.ALL, "assignments", "7"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.USERS.ACCESS_SUMMARY("7"),
    });
  });
});

describe("useUserAccessSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the persisted access summary for the requested user", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(usersApi.getAccessSummary).mockResolvedValue({
      userId: "7",
      assignments: [],
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUserAccessSummary("7"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(usersApi.getAccessSummary).toHaveBeenCalledTimes(1);
    expect(usersApi.getAccessSummary).toHaveBeenCalledWith("7");
  });
});
