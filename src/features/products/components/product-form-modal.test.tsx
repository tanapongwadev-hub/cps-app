import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Product,
  ProductImageUpload,
  ProductLookups,
  ProductPayload,
  UpdateProductPayload,
} from "../api/products-api";
import { ProductFormModal } from "./product-form-modal";

const option = { id: "1", code: "OPT", nameTh: "ตัวเลือก" };
const lookups: ProductLookups = {
  units: [option],
  productModels: [option],
  customers: [option],
  locations: [option],
  productTypes: [option],
  deliveryTypes: [option],
  loadingPoints: [option],
  processLines: [option],
};

const product: Product = {
  id: "11",
  code: "PRD-011",
  name: "เพลาขับ",
  unitId: "1",
  modelId: "1",
  customerId: "1",
  packing: 10,
  locationId: "1",
  safetyStock: 20,
  productTypeId: "1",
  lotSize: 20,
  minStock: 10,
  deliveryTypeId: "1",
  scale: null,
  loadingPointId: "1",
  processLineId: "1",
  productImagePath: "/uploads/products/existing.webp",
  isActive: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  unit: option,
  model: option,
  customer: option,
  location: option,
  productType: option,
  deliveryType: option,
  loadingPoint: option,
  processLine: option,
};

function renderForm(
  overrides: Partial<React.ComponentProps<typeof ProductFormModal>> = {},
) {
  const props: React.ComponentProps<typeof ProductFormModal> = {
    open: true,
    onOpenChange: vi.fn(),
    product,
    lookups,
    onUploadImage:
      vi.fn<(_file: File) => Promise<ProductImageUpload>>(),
    onSave:
      vi.fn<(_payload: ProductPayload | UpdateProductPayload) => Promise<void>>(),
    savePending: false,
    uploadPending: false,
    ...overrides,
  };

  return { ...render(<ProductFormModal {...props} />), props };
}

describe("ProductFormModal image upload", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:product-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("previews a selected image, uploads it first, and saves the staged path", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onUploadImage = vi.fn(async () => {
      calls.push("upload");
      return {
        imagePath: "/uploads/products/.tmp/new.webp",
        previewUrl: "/uploads/products/.tmp/new.webp",
      };
    });
    const onSave = vi.fn(async () => {
      calls.push("save");
    });
    renderForm({ onUploadImage, onSave });

    const file = new File(["image"], "new.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("เลือกรูปสินค้า"), file);

    expect(screen.getByAltText("ตัวอย่างรูปสินค้า")).toHaveAttribute(
      "src",
      "blob:product-preview",
    );
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(calls).toEqual(["upload", "save"]);
    expect(onUploadImage).toHaveBeenCalledWith(file);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        productImagePath: "/uploads/products/.tmp/new.webp",
        updatedAt: product.updatedAt,
      }),
    );
  });

  it("removes the existing image from the update payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);
    const { props } = renderForm({ onSave });

    await user.click(screen.getByRole("button", { name: "ลบรูปสินค้า" }));
    await user.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(props.onUploadImage).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ productImagePath: null }),
    );
  });
});
