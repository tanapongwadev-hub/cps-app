import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { unitsApi, type Unit, type UnitPayload, type UpdateUnitPayload } from "./units-api";

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

describe("unitsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list maps page/limit/search/filter/sort to query params", async () => {
    mockClient.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    await unitsApi.list({
      page: 1,
      pageSize: 20,
      search: "PCS",
      isActive: true,
      sortBy: "code",
      sortOrder: "asc",
    });
    expect(mockClient.get).toHaveBeenCalledWith("/units", {
      params: { page: 1, limit: 20, search: "PCS", isActive: true, sortBy: "code", sortOrder: "asc" },
    });
  });

  it("get calls /units/:id", async () => {
    mockClient.get.mockResolvedValue({} as Unit);
    await unitsApi.get("5");
    expect(mockClient.get).toHaveBeenCalledWith("/units/5");
  });

  it("create posts the payload", async () => {
    mockClient.post.mockResolvedValue({} as Unit);
    const payload: UnitPayload = { code: "PCS", nameTh: "ชิ้น" };
    await unitsApi.create(payload);
    expect(mockClient.post).toHaveBeenCalledWith("/units", payload);
  });

  it("update patches /units/:id with updatedAt", async () => {
    mockClient.patch.mockResolvedValue({} as Unit);
    const data: UpdateUnitPayload = { nameTh: "กิโลกรัม", updatedAt: "2026-08-04T00:00:00.000Z" };
    await unitsApi.update("1", data);
    expect(mockClient.patch).toHaveBeenCalledWith("/units/1", data);
  });

  it("deactivate sends DELETE", async () => {
    mockClient.delete.mockResolvedValue({} as Unit);
    await unitsApi.deactivate("1");
    expect(mockClient.delete).toHaveBeenCalledWith("/units/1");
  });

  it("restore patches /units/:id/restore", async () => {
    mockClient.patch.mockResolvedValue({} as Unit);
    await unitsApi.restore("1");
    expect(mockClient.patch).toHaveBeenCalledWith("/units/1/restore");
  });
});
