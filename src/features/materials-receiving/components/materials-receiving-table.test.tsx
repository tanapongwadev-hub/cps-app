/**
 * MaterialsReceivingTable tests
 * ครอบคลุม:
 *  1. แสดงรายการ Materials Receiving พร้อมข้อมูลครบ
 *  2. แสดง Action buttons ตาม status (draft/confirmed/cancelled)
 *  3. Empty state เมื่อไม่มีข้อมูล
 *  4. Loading state
 *  5. Sort callback
 */
import { render, screen } from "@testing-library/react";
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
  idempotencyKey: null,
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
    expect(screen.getByText("CCI-20260809-001")).toBeInTheDocument();
    expect(screen.getByText("CCI-20260809-002")).toBeInTheDocument();
    expect(screen.getByText("MAT-A — น้ำมันปาล์ม")).toBeInTheDocument();
    expect(screen.getByText("MAT-B — น้ำตาล")).toBeInTheDocument();
    expect(screen.getAllByText("บริษัท A").length).toBeGreaterThan(0);
    expect(screen.getByText("บริษัท B")).toBeInTheDocument();
    expect(screen.getAllByText("5 ใบ").length).toBeGreaterThan(0);
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
    expect(screen.getByText("ฉบับร่าง")).toBeInTheDocument();
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
    expect(screen.getByText("ยืนยันแล้ว")).toBeInTheDocument();
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
    expect(screen.getByText("ยกเลิก")).toBeInTheDocument();
  });

  it("only shows edit/delete/confirm actions for draft status", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "draft" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={onEdit}
        onDelete={onDelete}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("แก้ไข")).toBeInTheDocument();
    expect(screen.getByTitle("ลบ")).toBeInTheDocument();
    expect(screen.getByTitle("ยืนยันรับเข้า")).toBeInTheDocument();
    expect(screen.getByTitle("ยกเลิก")).toBeInTheDocument();
  });

  it("hides edit/delete/confirm actions for confirmed status (only cancel remains)", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "confirmed" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.queryByTitle("แก้ไข")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ลบ")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ยืนยันรับเข้า")).not.toBeInTheDocument();
    expect(screen.getByTitle("ยกเลิก")).toBeInTheDocument();
  });

  it("hides all action buttons except view for cancelled status", () => {
    render(
      <MaterialsReceivingTable
        receivings={[makeRow({ status: "cancelled" })]}
        page={1}
        pageSize={20}
        totalItems={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.queryByTitle("แก้ไข")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ลบ")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ยืนยันรับเข้า")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ยกเลิก")).not.toBeInTheDocument();
    expect(screen.getByTitle("ดูรายละเอียด")).toBeInTheDocument();
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

  it("calls onConfirm when the confirm action is clicked on a draft row", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const row = makeRow({ status: "draft", id: "mr-x" });
    render(
      <MaterialsReceivingTable
        receivings={[row]}
        page={1}
        pageSize={20}
        totalItems={1}
        onConfirm={onConfirm}
        onView={vi.fn()}
        onSortChange={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    await user.click(screen.getByTitle("ยืนยันรับเข้า"));
    expect(onConfirm).toHaveBeenCalledWith(row);
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
});
