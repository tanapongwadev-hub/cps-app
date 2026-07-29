import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { usersApi, type UpdateUserPayload } from "./users-api";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

describe("usersApi.update", () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset();
  });

  it("patches profile and the complete assignment state in one request", async () => {
    const payload: UpdateUserPayload = {
      firstName: "Somchai",
      lastName: "Jaidee",
      email: "somchai@example.com",
      assignments: [
        { id: "10", departmentId: "3", roleId: "5" },
        { departmentId: null, roleId: "1" },
      ],
    };

    await usersApi.update("7", payload);

    expect(apiClient.patch).toHaveBeenCalledWith("/users/7", payload);
  });
});
