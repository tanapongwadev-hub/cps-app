import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api-client";
import { productsApi } from "./products-api";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    upload: vi.fn(),
  },
}));

describe("productsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a Product image in the file FormData field", async () => {
    const file = new File(["product image"], "product.webp", {
      type: "image/webp",
    });

    await productsApi.uploadImage(file);

    expect(apiClient.upload).toHaveBeenCalledOnce();
    const uploadCall = vi.mocked(apiClient.upload).mock.calls[0];
    if (!uploadCall) throw new Error("Product image upload was not made");
    const [url, formData] = uploadCall;
    expect(url).toBe("/products/images");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("file")).toBe(file);
  });
});
