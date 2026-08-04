"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { showToast } from "@/lib/toast";
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeactivateUnit,
  useRestoreUnit,
} from "./use-units";

vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../api/units-api", () => ({
  unitsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    restore: vi.fn(),
  },
}));

import { unitsApi } from "../api/units-api";

const mockApi = unitsApi as unknown as {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  deactivate: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
};
const mockToast = showToast as unknown as {
  success: ReturnType<typeof vi.fn>;
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("useUnits hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useUnits calls api.list", async () => {
    mockApi.list.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    const { result } = renderHook(
      () => useUnits({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.list).toHaveBeenCalled();
  });

  it("useCreateUnit invalidates queries and shows success toast", async () => {
    mockApi.create.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateUnit(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ code: "PCS", nameTh: "ชิ้น" });
    });
    expect(mockApi.create).toHaveBeenCalledWith({ code: "PCS", nameTh: "ชิ้น" });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("useUpdateUnit calls update", async () => {
    mockApi.update.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateUnit(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: "1",
        data: { nameTh: "x", updatedAt: "2026-08-04T00:00:00.000Z" },
      });
    });
    expect(mockApi.update).toHaveBeenCalledWith("1", {
      nameTh: "x",
      updatedAt: "2026-08-04T00:00:00.000Z",
    });
  });

  it("useDeactivateUnit and useRestoreUnit call api", async () => {
    mockApi.deactivate.mockResolvedValue({});
    mockApi.restore.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result: d } = renderHook(() => useDeactivateUnit(), { wrapper });
    await act(async () => {
      await d.current.mutateAsync("1");
    });
    expect(mockApi.deactivate).toHaveBeenCalledWith("1");

    const { result: r } = renderHook(() => useRestoreUnit(), { wrapper });
    await act(async () => {
      await r.current.mutateAsync("2");
    });
    expect(mockApi.restore).toHaveBeenCalledWith("2");
  });
});
