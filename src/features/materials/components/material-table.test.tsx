import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Material } from "../api/materials-api";
import { MaterialTable } from "./material-table";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const material: Material = {
  id: "material-1",
  code: "MAT-001",
  name: "เหล็กแผ่น",
  type: "PC",
  materialType: "SHEET",
  ratio: 1,
  unitId: "unit-1",
  deliveryTypeId: null,
  modelId: null,
  loadingPointId: null,
  processLineName: null,
  scale: null,
  imagePath: null,
  specification: null,
  description: null,
  packingQuantity: null,
  isActive: true,
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  unit: { id: "unit-1", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram", symbol: "kg" },
  deliveryType: null,
  model: null,
  loadingPoint: null,
  suppliers: [],
};

function renderTable(overrides: Partial<React.ComponentProps<typeof MaterialTable>> = {}) {
  return render(
    <MaterialTable
      materials={[material]}
      page={1}
      pageSize={10}
      totalItems={1}
      detailHref={(item) => `/materials/${item.id}`}
      onEdit={vi.fn()}
      onStatusChange={vi.fn()}
      onViewStockBalance={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      onSortChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("MaterialTable row actions", () => {
  it("uses a compact right-aligned action column", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "การทำงาน" })).toHaveClass(
      "w-14",
      "text-right",
    );
    expect(screen.getByRole("button", { name: "จัดการวัสดุ MAT-001" }).closest("td")).toHaveClass(
      "w-14",
      "text-right",
    );
  });

  it("opens the material action menu and sends the selected stock callback its material", async () => {
    const user = userEvent.setup();
    const onViewStockBalance = vi.fn();
    renderTable({ onViewStockBalance });

    const trigger = screen.getByRole("button", { name: "จัดการวัสดุ MAT-001" });
    expect(screen.queryByRole("button", { name: "แก้ไข MAT-001" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByRole("menuitem", { name: "ดูรายละเอียด" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ปิดใช้งาน" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ดูสต็อก" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "ดูสต็อก" }));
    expect(onViewStockBalance).toHaveBeenCalledWith(material);
  });

  it("offers activation for inactive materials and sends its material to the status callback", async () => {
    const user = userEvent.setup();
    const inactiveMaterial = { ...material, isActive: false };
    const onStatusChange = vi.fn();
    renderTable({ materials: [inactiveMaterial], onStatusChange });

    await user.click(screen.getByRole("button", { name: "จัดการวัสดุ MAT-001" }));
    await user.click(screen.getByRole("menuitem", { name: "เปิดใช้งาน" }));

    expect(onStatusChange).toHaveBeenCalledWith(inactiveMaterial);
  });
});
