import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { materialsApi, type MaterialPayload, type UpdateMaterialPayload } from "./materials-api";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

describe("materialsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps the material list page size to limit and omits blank filters", async () => {
    await materialsApi.list({
      page: 2,
      pageSize: 25,
      search: "steel",
      isActive: false,
      unitId: "1",
      modelId: "",
      deliveryTypeId: undefined,
      loadingPointId: "4",
      supplierId: "9",
      sortBy: "name",
      sortOrder: "desc",
    });

    expect(apiClient.get).toHaveBeenCalledWith("/materials", {
      params: {
        page: 2,
        limit: 25,
        search: "steel",
        isActive: false,
        unitId: "1",
        loadingPointId: "4",
        supplierId: "9",
        sortBy: "name",
        sortOrder: "desc",
      },
    });
    const listCall = vi.mocked(apiClient.get).mock.calls[0];
    if (!listCall?.[1]) throw new Error("Material list request was not made");
    const listRequest = listCall[1];
    if (!listRequest.params) throw new Error("Material list query was not supplied");
    expect(Object.keys(listRequest.params)).not.toContain("modelId");
  });

  it("uses each approved material route and preserves command payloads", async () => {
    const payload: MaterialPayload = {
      code: "MAT-001",
      name: "Steel coil",
      unitId: "1",
      deliveryTypeId: null,
      modelId: "2",
      loadingPointId: null,
      processLineName: "Line A",
      scale: "500 kg",
      imagePath: "/uploads/materials/.tmp/steel.png",
      specification: "SS400",
      description: "Hot rolled steel",
      supplierIds: ["5", "6"],
      isActive: true,
    };
    const update: UpdateMaterialPayload = {
      name: "Steel coil revised",
      supplierIds: ["6"],
      updatedAt: "2026-08-02T10:00:00.000Z",
    };

    await materialsApi.get("11");
    await materialsApi.lookups();
    await materialsApi.create(payload);
    await materialsApi.update("11", update);
    await materialsApi.deactivate("11");
    await materialsApi.restore("11");

    expect(apiClient.get).toHaveBeenCalledWith("/materials/11");
    expect(apiClient.get).toHaveBeenCalledWith("/materials/lookups");
    expect(apiClient.post).toHaveBeenCalledWith("/materials", payload);
    expect(apiClient.patch).toHaveBeenCalledWith("/materials/11", update);
    expect(apiClient.delete).toHaveBeenCalledWith("/materials/11");
    expect(apiClient.patch).toHaveBeenCalledWith("/materials/11/restore");
  });

  it("uploads an image as a file FormData field without request headers", async () => {
    const file = new File(["image bytes"], "steel.png", { type: "image/png" });

    await materialsApi.uploadImage(file);

    expect(apiClient.upload).toHaveBeenCalledTimes(1);
    const uploadCall = vi.mocked(apiClient.upload).mock.calls[0];
    if (!uploadCall) throw new Error("Material image upload was not made");
    const [url, formData] = uploadCall;
    expect(url).toBe("/materials/images");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("file")).toBe(file);
    expect(vi.mocked(apiClient.upload).mock.calls[0]).toHaveLength(2);
  });
});
