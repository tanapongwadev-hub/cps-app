import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "../api/products-api";
import { ProductTable } from "./product-table";

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

function renderTable(overrides: Partial<React.ComponentProps<typeof ProductTable>> = {}) {
  return render(
    <ProductTable
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
      onSortChange={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ProductTable", () => {
  it("uses a responsive thumbnail-first product identity column", () => {
    renderTable();

    expect(screen.getByTestId("product-table-root")).toHaveClass("min-w-0", "max-w-full");
    expect(screen.getByRole("table")).toHaveClass("table-fixed", "sm:table-auto");
    const row = screen.getByTestId("product-row-PRD-001");
    expect(within(row).getByAltText("รูปสินค้า PRD-001")).toHaveAttribute(
      "src",
      "/uploads/products/front-bumper.webp",
    );
    expect(within(row).getByTestId("product-mobile-status")).toHaveClass("sm:hidden");
    expect(screen.getByRole("columnheader", { name: "สถานะ" })).toHaveClass("hidden", "sm:table-cell");
  });

  it("renders an accessible thumbnail fallback when no image is stored", () => {
    renderTable({ products: [{ ...product, productImagePath: null }] });

    expect(screen.getByLabelText("ไม่มีรูปสินค้า PRD-001")).toBeInTheDocument();
    expect(screen.queryByAltText("รูปสินค้า PRD-001")).not.toBeInTheDocument();
  });

  it("keeps BOM, edit, and status actions in a compact Materials-style menu", async () => {
    const user = userEvent.setup();
    const onGoToBom = vi.fn();
    const onEdit = vi.fn();
    const onStatusChange = vi.fn();
    renderTable({ onGoToBom, onEdit, onStatusChange });

    await user.click(screen.getByRole("button", { name: "จัดการสินค้า PRD-001" }));
    await user.click(screen.getByRole("menuitem", { name: "BOM" }));
    expect(onGoToBom).toHaveBeenCalledWith(product);

    await user.click(screen.getByRole("button", { name: "จัดการสินค้า PRD-001" }));
    await user.click(screen.getByRole("menuitem", { name: "แก้ไข" }));
    expect(onEdit).toHaveBeenCalledWith(product);

    await user.click(screen.getByRole("button", { name: "จัดการสินค้า PRD-001" }));
    await user.click(screen.getByRole("menuitem", { name: "ปิดใช้งาน" }));
    expect(onStatusChange).toHaveBeenCalledWith(product);
  });

  it("sorts from labeled controls and uses supported page sizes", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPageSizeChange = vi.fn();
    renderTable({ sortBy: "code", sortOrder: "asc", onSortChange, onPageSizeChange });

    await user.click(screen.getByRole("button", { name: "เรียงตามรหัสสินค้า" }));
    expect(onSortChange).toHaveBeenCalledWith("code", "desc");

    const pageSize = screen.getByLabelText("จำนวนต่อหน้า");
    expect(screen.getByText("1–10 จาก 26")).toBeInTheDocument();
    expect(within(pageSize).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "10",
      "25",
      "50",
      "100",
    ]);
    await user.selectOptions(pageSize, "50");
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
