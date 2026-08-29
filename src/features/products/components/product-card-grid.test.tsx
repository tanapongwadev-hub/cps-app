import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "../api/products-api";
import { ProductCardGrid } from "./product-card-grid";

const product: Product = {
  id: "product-1",
  code: "PRD-001",
  name: "Front Bumper",
  unitId: "unit-1",
  modelId: "model-1",
  customerId: "customer-1",
  packing: 12,
  locationId: "location-1",
  safetyStock: 24,
  productTypeId: "type-1",
  lotSize: 100,
  minStock: 12,
  deliveryTypeId: "delivery-1",
  scale: "1:1",
  loadingPointId: "loading-1",
  processLineId: "line-1",
  productImagePath: "/uploads/products/front-bumper.webp",
  isActive: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  unit: { id: "unit-1", code: "PCS", nameTh: "ชิ้น" },
  model: { id: "model-1", code: "MODEL-A", nameTh: "รุ่น A", brand: "CCI" },
  customer: { id: "customer-1", code: "CUS-01", nameTh: "ลูกค้า A" },
  location: { id: "location-1", code: "FG", nameTh: "คลังสินค้าสำเร็จรูป" },
  productType: { id: "type-1", code: "FG", nameTh: "สินค้าสำเร็จรูป" },
  deliveryType: { id: "delivery-1", code: "TRUCK", nameTh: "รถบรรทุก" },
  loadingPoint: { id: "loading-1", code: "LP-1", nameTh: "จุดโหลด 1" },
  processLine: { id: "line-1", code: "LINE-1", nameTh: "ไลน์ 1" },
};

function renderGrid(overrides: Partial<React.ComponentProps<typeof ProductCardGrid>> = {}) {
  return render(
    <ProductCardGrid
      products={[product]}
      page={1}
      pageSize={10}
      totalItems={26}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      onCreate={vi.fn()}
      onEdit={vi.fn()}
      onStatusChange={vi.fn()}
      onGoToBom={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ProductCardGrid", () => {
  it("uses the product image as the catalog anchor and opens an accessible preview", async () => {
    const user = userEvent.setup();
    renderGrid();

    const card = screen.getByTestId("product-card-PRD-001");
    expect(within(card).getByAltText("รูปสินค้า PRD-001")).toHaveAttribute(
      "src",
      "/uploads/products/front-bumper.webp",
    );

    await user.click(within(card).getByRole("button", { name: "ขยายรูป PRD-001" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByAltText("รูปสินค้า PRD-001")).toHaveLength(2);
  });

  it("shows a clear fallback when a product has no image", () => {
    renderGrid({ products: [{ ...product, productImagePath: null }] });

    expect(screen.getByText("ไม่มีรูป")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ขยายรูป PRD-001" })).not.toBeInTheDocument();
  });

  it("keeps Product actions available from the image-first card", async () => {
    const user = userEvent.setup();
    const onGoToBom = vi.fn();
    const onEdit = vi.fn();
    const onStatusChange = vi.fn();
    renderGrid({ onGoToBom, onEdit, onStatusChange });

    const bomButton = screen.getAllByRole("button", { name: "BOM PRD-001" }).at(0);
    const editButton = screen.getAllByRole("button", { name: "แก้ไข PRD-001" }).at(0);
    const statusButton = screen.getAllByRole("button", { name: "ปิดใช้งาน PRD-001" }).at(0);
    if (!bomButton || !editButton || !statusButton) {
      throw new Error("Product quick actions are missing");
    }

    await user.click(bomButton);
    await user.click(editButton);
    await user.click(statusButton);

    expect(onGoToBom).toHaveBeenCalledWith(product);
    expect(onEdit).toHaveBeenCalledWith(product);
    expect(onStatusChange).toHaveBeenCalledWith(product);
  });

  it("uses the Materials pagination treatment and supported page sizes", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    renderGrid({ onPageSizeChange });

    const pageSize = screen.getByLabelText("จำนวนต่อหน้า");
    expect(screen.getByText("แสดง 1–10 จาก 26 รายการ")).toBeInTheDocument();
    expect(within(pageSize).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "10",
      "25",
      "50",
      "100",
    ]);

    await user.selectOptions(pageSize, "25");
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
