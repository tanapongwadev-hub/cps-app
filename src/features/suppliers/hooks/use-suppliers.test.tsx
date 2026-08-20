"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { showToast } from "@/lib/toast";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
  useRestoreSupplier,
} from "./use-suppliers";

vi.mock("@/lib/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../api/suppliers-api", () => ({
  suppliersApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    restore: vi.fn(),
  },
}));

import { suppliersApi } from "../api/suppliers-api";

const mockApi = suppliersApi as unknown as {
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

describe("useSuppliers hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useSuppliers calls api.list", async () => {
    mockApi.list.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    const { result } = renderHook(
      () => useSuppliers({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.list).toHaveBeenCalled();
  });

  it("useCreateSupplier shows success toast", async () => {
    mockApi.create.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateSupplier(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ code: "SUP-001", nameTh: "บริษัท" });
    });
    expect(mockApi.create).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("useUpdateSupplier calls update", async () => {
    mockApi.update.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: "1",
        data: { nameTh: "x", updatedAt: "2026-08-04T00:00:00.000Z" },
      });
    });
    expect(mockApi.update).toHaveBeenCalled();
  });

  it("useDeactivateSupplier and useRestoreSupplier call api", async () => {
    mockApi.deactivate.mockResolvedValue({});
    mockApi.restore.mockResolvedValue({});
    const wrapper = createWrapper();
    const { result: d } = renderHook(() => useDeactivateSupplier(), { wrapper });
    await act(async () => {
      await d.current.mutateAsync("1");
    });
    expect(mockApi.deactivate).toHaveBeenCalledWith("1");

    const { result: r } = renderHook(() => useRestoreSupplier(), { wrapper });
    await act(async () => {
      await r.current.mutateAsync("2");
    });
    expect(mockApi.restore).toHaveBeenCalledWith("2");
  });
});
