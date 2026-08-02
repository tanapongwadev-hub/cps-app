import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import { materialsApi } from "../api/materials-api";
import {
  useCreateMaterial,
  useDeactivateMaterial,
  useMaterial,
  useMaterialLookups,
  useMaterials,
  useRestoreMaterial,
  useUpdateMaterial,
  useUploadMaterialImage,
} from "./use-materials";

vi.mock("../api/materials-api", () => ({
  materialsApi: {
    list: vi.fn(),
    get: vi.fn(),
    lookups: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    restore: vi.fn(),
    uploadImage: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn() },
}));

const material = {
  id: "11",
  code: "MAT-001",
  name: "Steel coil",
  unitId: "1",
  deliveryTypeId: null,
  modelId: null,
  loadingPointId: null,
  processLineName: null,
  scale: null,
  imagePath: null,
  specification: null,
  description: null,
  isActive: true,
  createdBy: "1",
  updatedBy: "1",
  createdAt: "2026-08-02T10:00:00.000Z",
  updatedAt: "2026-08-02T10:00:00.000Z",
  unit: { id: "1", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram", symbol: "kg" },
  deliveryType: null,
  model: null,
  loadingPoint: null,
  suppliers: [],
};

function wrapperFor(queryClient: QueryClient) {
  function MaterialQueryClientProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return MaterialQueryClientProvider;
}

function newQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe("material query hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses Material list, detail, and lookup keys and does not request an empty detail id", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsApi.list).mockResolvedValue({
      items: [material],
      meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });
    vi.mocked(materialsApi.get).mockResolvedValue(material);
    vi.mocked(materialsApi.lookups).mockResolvedValue({
      units: [material.unit],
      suppliers: [],
      models: [],
      deliveryTypes: [],
      loadingPoints: [],
    });
    const params = { page: 1, pageSize: 10 };
    const { result } = renderHook(
      () => ({
        list: useMaterials(params),
        detail: useMaterial(""),
        lookups: useMaterialLookups(),
      }),
      { wrapper: wrapperFor(queryClient) },
    );

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.lookups.isSuccess).toBe(true));

    expect(queryClient.getQueryState(QUERY_KEYS.MATERIALS.LIST(params))).toBeDefined();
    expect(queryClient.getQueryState(QUERY_KEYS.MATERIALS.LOOKUPS)).toBeDefined();
    expect(result.current.detail.fetchStatus).toBe("idle");
    expect(materialsApi.get).not.toHaveBeenCalled();
  });
});

describe("material mutation hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates material lists and the affected detail after update, deactivate, and restore", async () => {
    const queryClient = newQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    vi.mocked(materialsApi.update).mockResolvedValue(material);
    vi.mocked(materialsApi.deactivate).mockResolvedValue({ ...material, isActive: false });
    vi.mocked(materialsApi.restore).mockResolvedValue(material);
    const { result } = renderHook(
      () => ({
        update: useUpdateMaterial(),
        deactivate: useDeactivateMaterial(),
        restore: useRestoreMaterial(),
      }),
      { wrapper: wrapperFor(queryClient) },
    );

    await act(async () => {
      await result.current.update.mutateAsync({
        id: "11",
        data: { name: "Steel sheet", updatedAt: material.updatedAt },
      });
      await result.current.deactivate.mutateAsync("11");
      await result.current.restore.mutateAsync("11");
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.MATERIALS.ALL });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.MATERIALS.DETAIL("11") });
    expect(showToast.success).toHaveBeenCalledWith("แก้ไขวัสดุเรียบร้อย");
    expect(showToast.success).toHaveBeenCalledWith("ปิดใช้งานวัสดุเรียบร้อย");
    expect(showToast.success).toHaveBeenCalledWith("เปิดใช้งานวัสดุเรียบร้อย");
  });

  it("invalidates only lists after create without deriving a detail id", async () => {
    const queryClient = newQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    vi.mocked(materialsApi.create).mockResolvedValue(material);
    const { result } = renderHook(() => useCreateMaterial(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ code: "MAT-001", name: "Steel coil", unitId: "1" });
    });

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.MATERIALS.ALL });
    expect(showToast.success).toHaveBeenCalledWith("สร้างวัสดุเรียบร้อย");
  });

  it("reports mutation errors and leaves Material cache untouched after image upload", async () => {
    const queryClient = newQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    vi.mocked(materialsApi.uploadImage).mockResolvedValue({
      imagePath: "/uploads/materials/.tmp/steel.png",
      previewUrl: "/uploads/materials/.tmp/steel.png",
    });
    vi.mocked(materialsApi.deactivate).mockRejectedValue(new Error("forbidden"));
    const { result } = renderHook(
      () => ({ upload: useUploadMaterialImage(), deactivate: useDeactivateMaterial() }),
      { wrapper: wrapperFor(queryClient) },
    );

    await act(async () => {
      await result.current.upload.mutateAsync(
        new File(["image"], "steel.png", { type: "image/png" }),
      );
    });
    await act(async () => {
      await expect(result.current.deactivate.mutateAsync("11")).rejects.toThrow("forbidden");
    });

    expect(invalidate).not.toHaveBeenCalled();
    expect(showToast.error).toHaveBeenCalledWith("ไม่สามารถปิดใช้งานวัสดุได้", "forbidden");
  });
});
