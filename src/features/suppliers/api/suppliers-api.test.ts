import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { suppliersApi, type Supplier, type SupplierPayload } from "./suppliers-api";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("suppliersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list maps query params", async () => {
    mockClient.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    await suppliersApi.list({
      page: 1,
      pageSize: 20,
      search: "ABC",
      isActive: true,
      sortBy: "code",
      sortOrder: "asc",
    });
    expect(mockClient.get).toHaveBeenCalledWith("/suppliers", {
      params: { page: 1, limit: 20, search: "ABC", isActive: true, sortBy: "code", sortOrder: "asc" },
    });
  });

  it("create posts payload with contact fields", async () => {
    mockClient.post.mockResolvedValue({} as Supplier);
    const payload: SupplierPayload = {
      code: "SUP-001",
      nameTh: "บริษัท ABC",
      taxId: "0105560001234",
      contactName: "สมชาย",
      telephone: "02-123-4567",
      email: "contact@abc.co.th",
    };
    await suppliersApi.create(payload);
    expect(mockClient.post).toHaveBeenCalledWith("/suppliers", payload);
  });

  it("update patches /suppliers/:id", async () => {
    mockClient.patch.mockResolvedValue({} as Supplier);
    await suppliersApi.update("1", { nameTh: "x", updatedAt: "2026-08-04T00:00:00.000Z" });
    expect(mockClient.patch).toHaveBeenCalledWith("/suppliers/1", {
      nameTh: "x",
      updatedAt: "2026-08-04T00:00:00.000Z",
    });
  });

  it("deactivate sends DELETE", async () => {
    mockClient.delete.mockResolvedValue({} as Supplier);
    await suppliersApi.deactivate("1");
    expect(mockClient.delete).toHaveBeenCalledWith("/suppliers/1");
  });

  it("restore patches /suppliers/:id/restore", async () => {
    mockClient.patch.mockResolvedValue({} as Supplier);
    await suppliersApi.restore("1");
    expect(mockClient.patch).toHaveBeenCalledWith("/suppliers/1/restore");
  });
});
