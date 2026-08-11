/**
 * Goods Receipts hooks — focused on toast notifications and PATCH payload shape.
 * The materials-receiving hooks already have similar coverage; this file locks
 * down the goods-receipts surface after we added toast in the same pattern.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api/goods-receipts-api", () => ({
  goodsReceiptsApi: {
    list: vi.fn(),
    get: vi.fn(),
    lookups: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
    cancel: vi.fn(),
    uploadAttachment: vi.fn(),
    attachFile: vi.fn(),
    removeAttachment: vi.fn(),
  },
}));

import { showToast } from "@/lib/toast";
import { goodsReceiptsApi } from "../api/goods-receipts-api";
import {
  useUpdateGoodsReceipt,
  usePostGoodsReceipt,
  useCancelGoodsReceipt,
} from "./use-goods-receipts";

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useUpdateGoodsReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls update with id and data, shows success toast", async () => {
    vi.mocked(goodsReceiptsApi.update).mockResolvedValue({} as never);
    const qc = newQueryClient();
    const { result } = renderHook(() => useUpdateGoodsReceipt(), { wrapper: wrapper(qc) });

    await act(async () => {
      await result.current.mutateAsync({ id: "42", data: { items: [], updatedAt: "x" } as never });
    });

    expect(goodsReceiptsApi.update).toHaveBeenCalledWith("42", {
      items: [],
      updatedAt: "x",
    });
    expect(showToast.success).toHaveBeenCalledWith("บันทึกการแก้ไขสำเร็จ");
  });

  it("shows error toast when update fails", async () => {
    vi.mocked(goodsReceiptsApi.update).mockRejectedValue(new Error("server 400"));
    const qc = newQueryClient();
    const { result } = renderHook(() => useUpdateGoodsReceipt(), { wrapper: wrapper(qc) });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: "42", data: {} as never });
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalled();
    });
  });
});

describe("usePostGoodsReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls post and shows success toast", async () => {
    vi.mocked(goodsReceiptsApi.post).mockResolvedValue({} as never);
    const qc = newQueryClient();
    const { result } = renderHook(() => usePostGoodsReceipt(), { wrapper: wrapper(qc) });

    await act(async () => {
      await result.current.mutateAsync("42");
    });

    expect(goodsReceiptsApi.post).toHaveBeenCalledWith("42");
    expect(showToast.success).toHaveBeenCalledWith("รับรองเอกสารสำเร็จ");
  });

  it("shows error toast when post fails", async () => {
    vi.mocked(goodsReceiptsApi.post).mockRejectedValue(
      new Error("Line 1: supplierDocNo is required unless noSupplierDocument is true"),
    );
    const qc = newQueryClient();
    const { result } = renderHook(() => usePostGoodsReceipt(), { wrapper: wrapper(qc) });

    await act(async () => {
      try {
        await result.current.mutateAsync("42");
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalled();
    });
  });
});

describe("useCancelGoodsReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls cancel with reason and shows success toast", async () => {
    vi.mocked(goodsReceiptsApi.cancel).mockResolvedValue({} as never);
    const qc = newQueryClient();
    const { result } = renderHook(() => useCancelGoodsReceipt(), { wrapper: wrapper(qc) });

    await act(async () => {
      await result.current.mutateAsync({
        id: "42",
        data: { cancelReason: "ทดสอบ" },
      });
    });

    expect(goodsReceiptsApi.cancel).toHaveBeenCalledWith("42", {
      cancelReason: "ทดสอบ",
    });
    expect(showToast.success).toHaveBeenCalledWith("ยกเลิกเอกสารสำเร็จ");
  });
});
