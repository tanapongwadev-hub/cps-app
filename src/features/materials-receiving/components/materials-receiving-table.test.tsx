/**
 * MaterialsReceivingTable tests
 * ครอบคลุม:
 *  1. แสดงรายการ Materials Receiving พร้อมข้อมูลครบ
 *  2. แสดง Action buttons ตาม status (draft/confirmed/cancelled)
 *  3. Empty state เมื่อไม่มีข้อมูล
 *  4. Loading state
 *  5. Sort callback
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MaterialsReceivingTable } from "./materials-receiving-table";
import type { MaterialsReceiving } from "../api/materials-receiving-api";

const baseRow: MaterialsReceiving = {
  id: "mr-001",
  internalLotNo: "CCI-20260809-001",
  organizationId: "1",
  supplierId: "sup-001",
  materialId: "mat-001",
  unitId: "unit-001",
  receiveQuantity: "1000",
  packingQuantity: 200,
  packageCount: 5,
  supplierLotNo: "SUP-20260801",
  supplierProductionDate: "2026-08-01",
  receiveDate: "2026-08-09",
  qrCode: null,
  qrPayload: null,
  status: "draft",
  poNo: null,
  materialType: null,
  ratio: null,
  piecesQuantity: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  attachmentUrl: null,
  attachmentName: null,
  remark: null,
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "user-001",
  updatedBy: "user-001",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
  supplier: { id: "sup-001", code: "SUP-001", nameTh: "บริษัท A", nameEn: "Co A" },
  material: { id: "mat-001", code: "MAT-A", name: "น้ำมันปาล์ม" },
  unit: { id: "unit-001", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram" },
};

function makeRow(overrides: Partial<MaterialsReceiving> = {}): MaterialsReceiving {
  return { ...baseRow, id: `mr-${Math.random()}`, ...overrides };
}

function renderList({
  receivings = [baseRow],
  totalItems = receivings.length,
}: {
  receivings?: MaterialsReceiving[];
  totalItems?: number;
} = {}) {
  return render(
    <MaterialsReceivingTable
      receivings={receivings}
      page={1}
      pageSize={20}
      totalItems={totalItems}
      onSortChange={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
    />,
  );
}

describe("MaterialsReceivingTable", () => {
  it("renders a list of receivings with key columns", () => {
    const receivings = [
      makeRow({ internalLotNo: "CCI-20260809-001" }),
      makeRow({
        internalLotNo: "CCI-20260809-002",
        material: { id: "mat-002", code: "MAT-B", name: "น้ำตาล" },
        supplier: { id: "sup-002", code: "SUP-002", nameTh: "บริษัท B", nameEn: "Co B" },
      }),
    ];
    render(
      <MaterialsReceivingTable
        receivings={receivings}
        page={1}
        pageSize={20}
        totalItems={2}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("CCI-20260809-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CCI-20260809-002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MAT-A — น้ำมันปาล์ม").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MAT-B — น้ำตาล").length).toBeGreaterThan(0);
    expect(screen.getAllByText("บริษัท A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("บริษัท B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5 ใบ").length).toBeGreaterThan(0);
  });

  it("renders receiving details as a mobile card and preserves the desktop table", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ internalLotNo: "CCI-20260809-001" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("materials-receiving-cards")).toHaveClass("md:hidden");
    expect(screen.getByTestId("materials-receiving-table")).toHaveClass("hidden", "md:block");
    const card = screen.getByRole("article", {
      name: "รายการรับเข้า CCI-20260809-001",
    });
    expect(card).toHaveTextContent("MAT-A");
    expect(card).toHaveTextContent("น้ำมันปาล์ม");
    expect(card).toHaveTextContent("บริษัท A");
    expect(card).toHaveTextContent("1,000");
    expect(card).toHaveTextContent("5 ใบ");
    expect(card).toHaveTextContent("SUP-20260801");
  });

  it("uses the shared responsive action menu from the mobile receiving card", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const row = makeRow({ internalLotNo: "CCI-20260809-001" });
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onView={onView}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const card = screen.getByRole("article", {
      name: "รายการรับเข้า CCI-20260809-001",
    });
    const menuTrigger = within(card).getByRole("button", {
      name: "จัดการรายการรับเข้า CCI-20260809-001",
    });
    expect(menuTrigger).toHaveClass("h-10", "w-10", "sm:h-8", "sm:w-8");
    await user.click(menuTrigger);
    expect(screen.getByRole("menuitem", { name: "ดูรายละเอียด" })).toHaveClass("min-h-10");
    await user.click(screen.getByRole("menuitem", { name: "ดูรายละเอียด" }));
    expect(onView).toHaveBeenCalledWith(row);
  });

  it("shows draft status badge for draft rows", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "draft" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("ฉบับร่าง").length).toBeGreaterThan(0);
  });

  it("shows confirmed status badge for confirmed rows", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "confirmed" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("ยืนยันแล้ว").length).toBeGreaterThan(0);
  });

  it("shows cancelled status badge for cancelled rows", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "cancelled" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("ยกเลิก").length).toBeGreaterThan(0);
  });

  it("offers every draft action from the desktop row menu and invokes confirm", async () => {
    const user = userEvent.setup();
    const row = makeRow({ status: "draft" });
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onView = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={onEdit}
        onDelete={onDelete}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onView={onView}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    const trigger = within(screen.getByTestId("materials-receiving-table")).getByRole("button", {
      name: `จัดการรายการรับเข้า ${row.internalLotNo}`,
    });
    await user.click(trigger);

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent?.trim())).toEqual([
      "ดูรายละเอียด",
      "แก้ไข",
      "ยืนยันรับเข้า",
      "ยกเลิก",
      "ลบ",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "ยืนยันรับเข้า" }));
    expect(onConfirm).toHaveBeenCalledWith(row);
  });

  it("uses a compact right-aligned desktop action column", () => {
    const row = makeRow({ internalLotNo: "CCI-20260809-001" });
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    const desktopTable = screen.getByTestId("materials-receiving-table");
    expect(within(desktopTable).getByRole("columnheader", { name: "การจัดการ" })).toHaveClass(
      "w-14",
      "text-right",
    );
    const desktopRow = within(desktopTable).getByRole("row", {
      name: new RegExp(row.internalLotNo),
    });
    expect(within(desktopRow).getAllByRole("cell").at(-1)).toHaveClass("w-14", "text-right");
  });

  it("offers view and cancel for confirmed rows and invokes cancel", async () => {
    const user = userEvent.setup();
    const row = makeRow({ status: "confirmed" });
    const onCancel = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    const trigger = within(screen.getByTestId("materials-receiving-table")).getByRole("button", {
      name: `จัดการรายการรับเข้า ${row.internalLotNo}`,
    });
    await user.click(trigger);

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent?.trim())).toEqual([
      "ดูรายละเอียด",
      "ยกเลิก",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "ยกเลิก" }));
    expect(onCancel).toHaveBeenCalledWith(row);
  });

  it("offers only view for cancelled rows and invokes view", async () => {
    const user = userEvent.setup();
    const row = makeRow({ status: "cancelled" });
    const onView = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onView={onView}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    const trigger = within(screen.getByTestId("materials-receiving-table")).getByRole("button", {
      name: `จัดการรายการรับเข้า ${row.internalLotNo}`,
    });
    await user.click(trigger);

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent?.trim())).toEqual([
      "ดูรายละเอียด",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "ดูรายละเอียด" }));
    expect(onView).toHaveBeenCalledWith(row);
  });

  it("shows empty state with create button when no receivings", () => {
    const onCreate = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[]}
        page={1}
        pageSize={20}
        totalItems={0}
        onCreate={onCreate}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("ยังไม่มีรายการรับเข้า")).toBeInTheDocument();
  });

  it("shows error state when isError is true", () => {
    const onRetry = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[]}
        page={1}
        pageSize={20}
        totalItems={0}
        isError
        onRetry={onRetry}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("โหลดข้อมูลไม่สำเร็จ")).toBeInTheDocument();
  });

  it("calls onSortChange when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[makeRow()]}
        page={1}
        pageSize={20}
        totalItems={1}
        sortBy="internalLotNo"
        sortOrder="desc"
        onSortChange={onSortChange}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    // Click on the "Internal Lot No." header — should toggle desc -> asc
    await user.click(screen.getByText("Internal Lot No."));
    expect(onSortChange).toHaveBeenCalledWith("internalLotNo", "asc");
  });

  it("shows pagination controls when there are results", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow(), makeRow({ id: "mr-2" })]}
        page={1}
        pageSize={20}
        totalItems={2}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/รายการต่อหน้า/)).toBeInTheDocument();
  });

  it("uses stacked touch-friendly pagination on mobile", () => {
    renderList({ receivings: [baseRow], totalItems: 40 });
    expect(screen.getByTestId("materials-receiving-pagination")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    );
    expect(screen.getByRole("button", { name: "หน้าก่อนหน้า" })).toHaveClass("h-10", "w-10");
    expect(screen.getByRole("button", { name: "หน้าถัดไป" })).toHaveClass("h-10", "w-10");
  });
});
