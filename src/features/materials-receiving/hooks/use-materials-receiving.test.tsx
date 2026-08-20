/**
 * MaterialsReceiving hooks tests
 * ครอบคลุม:
 *  1. useMaterialsReceivings — list query
 *  2. useMaterialsReceivingDetail — detail query (skip when id is empty)
 *  3. useMaterialsReceivingLookups — lookups query
 *  4. useCreateMaterialsReceiving — invalidate list on success, toast on success/error
 *  5. useUpdateMaterialsReceiving — include updatedAt
 *  6. useConfirmMaterialsReceiving — invalidate detail + toast
 *  7. useCancelMaterialsReceiving — pass cancel reason
 */
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@/lib/toast";
import { materialsReceivingApi } from "../api/materials-receiving-api";
import {
  useCancelMaterialsReceiving,
  useConfirmMaterialsReceiving,
  useCreateMaterialsReceiving,
  useDeleteMaterialsReceiving,
  useMaterialsReceivingDetail,
  useMaterialsReceivingLookups,
  useMaterialsReceivings,
  useUpdateMaterialsReceiving,
} from "./use-materials-receiving";
import type {
  CancelMaterialsReceivingPayload,
  CreateMaterialsReceivingPayload,
  ListMaterialsReceivingParams,
  MaterialsReceiving,
  UpdateMaterialsReceivingPayload,
} from "../api/materials-receiving-api";

vi.mock("../api/materials-receiving-api", () => ({
  materialsReceivingApi: {
    list: vi.fn(),
    get: vi.fn(),
    getByLotNo: vi.fn(),
    lookups: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn() },
}));

const baseReceiving: MaterialsReceiving = {
  id: "mr-001",
  internalLotNo: "CCI-20260809-001",
  organizationId: "1",
  supplierId: "sup-001",
  materialId: "mat-001",
  unitId: "unit-001",
  receiveQuantity: "1000",
  packingQuantity: 200,
  packageCount: 5,
  supplierLotNo: "SUP-20260801",
  supplierProductionDate: "2026-08-01",
  receiveDate: "2026-08-09",
  qrCode: null,
  qrPayload: null,
  status: "draft",
  poNo: null,
  materialType: null,
  ratio: null,
  piecesQuantity: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  attachmentUrl: null,
  attachmentName: null,
  remark: null,
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "user-001",
  updatedBy: "user-001",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
};

function newQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("materials-receiving hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useMaterialsReceivings calls list with provided params", async () => {
    const params: ListMaterialsReceivingParams = {
      page: 1,
      pageSize: 20,
      status: "draft",
    };
    vi.mocked(materialsReceivingApi.list).mockResolvedValue({
      items: [baseReceiving],
      meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    });
    const { result } = renderHook(() => useMaterialsReceivings(params), {
      wrapper: wrapperFor(newQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(materialsReceivingApi.list).toHaveBeenCalledWith(params);
  });

  it("useMaterialsReceivingDetail skips query when id is empty", () => {
    const queryClient = newQueryClient();
    const { result } = renderHook(() => useMaterialsReceivingDetail(""), {
      wrapper: wrapperFor(queryClient),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(materialsReceivingApi.get).not.toHaveBeenCalled();
  });

  it("useMaterialsReceivingDetail fetches when id is provided", async () => {
    vi.mocked(materialsReceivingApi.get).mockResolvedValue({
      ...baseReceiving,
      packages: [],
      supplier: null,
      material: null,
      unit: null,
    });
    const { result } = renderHook(() => useMaterialsReceivingDetail("mr-001"), {
      wrapper: wrapperFor(newQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(materialsReceivingApi.get).toHaveBeenCalledWith("mr-001");
  });

  it("useMaterialsReceivingLookups fetches lookups data", async () => {
    vi.mocked(materialsReceivingApi.lookups).mockResolvedValue({
      suppliers: [],
      materials: [],
      units: [],
    });
    const { result } = renderHook(() => useMaterialsReceivingLookups(), {
      wrapper: wrapperFor(newQueryClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(materialsReceivingApi.lookups).toHaveBeenCalledTimes(1);
  });

  it("useCreateMaterialsReceiving calls create and shows success toast", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsReceivingApi.create).mockResolvedValue(baseReceiving);
    const { result } = renderHook(() => useCreateMaterialsReceiving(), {
      wrapper: wrapperFor(queryClient),
    });
    const payload: CreateMaterialsReceivingPayload = {
      materialId: "mat-001",
      supplierId: "sup-001",
      receiveQuantity: "1000",
      supplierProductionDate: "2026-08-01",
      receiveDate: "2026-08-09",
    };
    await act(async () => {
      await result.current.mutateAsync(payload);
    });
    expect(materialsReceivingApi.create).toHaveBeenCalledWith(payload);
    expect(showToast.success).toHaveBeenCalledWith("สร้างรายการรับเข้าเรียบร้อย");
  });

  it("useCreateMaterialsReceiving shows error toast on failure", async () => {
    vi.mocked(materialsReceivingApi.create).mockRejectedValue(
      new Error("Backend validation failed"),
    );
    const { result } = renderHook(() => useCreateMaterialsReceiving(), {
      wrapper: wrapperFor(newQueryClient()),
    });
    await act(async () => {
      try {
        await result.current.mutateAsync({
          materialId: "m",
          supplierId: "s",
          receiveQuantity: "1",
          supplierProductionDate: "2026-08-01",
          receiveDate: "2026-08-09",
        });
      } catch {
        // expected
      }
    });
    expect(showToast.error).toHaveBeenCalledWith("Backend validation failed");
  });

  it("useUpdateMaterialsReceiving passes updatedAt and invalidates detail", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsReceivingApi.update).mockResolvedValue({
      ...baseReceiving,
      remark: "updated",
    });
    const { result } = renderHook(() => useUpdateMaterialsReceiving(), {
      wrapper: wrapperFor(queryClient),
    });
    const payload: UpdateMaterialsReceivingPayload = {
      remark: "updated",
      updatedAt: "2026-08-09T00:00:00.000Z",
    };
    await act(async () => {
      await result.current.mutateAsync({ id: "mr-001", data: payload });
    });
    expect(materialsReceivingApi.update).toHaveBeenCalledWith("mr-001", payload);
  });

  it("useConfirmMaterialsReceiving calls confirm endpoint and shows success toast", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsReceivingApi.confirm).mockResolvedValue({
      ...baseReceiving,
      status: "confirmed",
    });
    const { result } = renderHook(() => useConfirmMaterialsReceiving(), {
      wrapper: wrapperFor(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync("mr-001");
    });
    expect(materialsReceivingApi.confirm).toHaveBeenCalledWith("mr-001");
    expect(showToast.success).toHaveBeenCalledWith(
      "ยืนยันการรับเข้าเรียบร้อย — อัปเดตสต็อกเรียบร้อย",
    );
  });

  it("useCancelMaterialsReceiving passes cancel reason", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsReceivingApi.cancel).mockResolvedValue({
      ...baseReceiving,
      status: "cancelled",
    });
    const { result } = renderHook(() => useCancelMaterialsReceiving(), {
      wrapper: wrapperFor(queryClient),
    });
    const payload: CancelMaterialsReceivingPayload = {
      cancelReason: "รับผิด material",
    };
    await act(async () => {
      await result.current.mutateAsync({ id: "mr-001", data: payload });
    });
    expect(materialsReceivingApi.cancel).toHaveBeenCalledWith(
      "mr-001",
      payload,
    );
  });

  it("useDeleteMaterialsReceiving calls delete endpoint", async () => {
    const queryClient = newQueryClient();
    vi.mocked(materialsReceivingApi.delete).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteMaterialsReceiving(), {
      wrapper: wrapperFor(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync("mr-001");
    });
    expect(materialsReceivingApi.delete).toHaveBeenCalledWith("mr-001");
    expect(showToast.success).toHaveBeenCalledWith("ลบรายการรับเข้าเรียบร้อย");
  });
});
