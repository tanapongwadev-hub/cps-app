import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { permissionsApi } from "./permissions-api";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("permissionsApi.updateDepartments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the selected department IDs to the dedicated endpoint", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      id: "10",
      code: "order.approve",
      departments: [],
    });

    await permissionsApi.updateDepartments("10", {
      departmentIds: ["1", "2"],
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      "/permissions/10/departments",
      { departmentIds: ["1", "2"] },
    );
  });
});
