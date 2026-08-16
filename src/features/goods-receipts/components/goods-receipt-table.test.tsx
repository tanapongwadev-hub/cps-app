import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GoodsReceipt } from "../api/goods-receipts-api";
import { GoodsReceiptTable } from "./goods-receipt-table";

const receipt: GoodsReceipt = {
  id: "receipt-1",
  receiptNo: "GR-001",
  supplierId: "supplier-1",
  supplier: {
    id: "supplier-1",
    code: "SUP-001",
    nameTh: "บริษัท ตัวอย่าง",
    nameEn: null,
    taxId: null,
    contactName: null,
    telephone: null,
    email: null,
    address: null,
    isActive: true,
  },
  receiptDate: "2026-08-16",
  status: "draft",
  remark: null,
  cancelReason: null,
  postedBy: null,
  postedAt: null,
  itemCount: 2,
  totalQtyReceived: "12.50",
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

function renderTable(overrides: Partial<React.ComponentProps<typeof GoodsReceiptTable>> = {}) {
  return render(
    <GoodsReceiptTable
      receipts={[receipt]}
      page={1}
      pageSize={10}
      totalItems={1}
      onSortChange={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("GoodsReceiptTable row actions", () => {
  it("shows draft actions in the menu and posts the selected receipt", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn();
    renderTable({
      onView: vi.fn(),
      onEdit: vi.fn(),
      onPost,
      onCancel: vi.fn(),
      onDelete: vi.fn(),
    });

    await user.click(screen.getByRole("button", { name: "จัดการรายการรับสินค้า GR-001" }));

    expect(screen.getByRole("menuitem", { name: "ดูรายละเอียด" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "รับรองเอกสาร" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ลบ" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "ยกเลิกเอกสาร" })).not.toBeInTheDocument();
    expect(screen.queryByTitle("ดูรายละเอียด")).not.toBeInTheDocument();
    expect(screen.queryByTitle("แก้ไข")).not.toBeInTheDocument();
    expect(screen.queryByTitle("รับรองเอกสาร")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ลบ")).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "รับรองเอกสาร" }));
    expect(onPost).toHaveBeenCalledWith(receipt);
  });

  it("shows posted actions in the menu and cancels the selected receipt", async () => {
    const user = userEvent.setup();
    const postedReceipt = { ...receipt, status: "posted" as const };
    const onCancel = vi.fn();
    renderTable({
      receipts: [postedReceipt],
      onView: vi.fn(),
      onEdit: vi.fn(),
      onPost: vi.fn(),
      onCancel,
      onDelete: vi.fn(),
    });

    await user.click(screen.getByRole("button", { name: "จัดการรายการรับสินค้า GR-001" }));

    expect(screen.getByRole("menuitem", { name: "ดูรายละเอียด" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ยกเลิกเอกสาร" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "แก้ไข" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "รับรองเอกสาร" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "ลบ" })).not.toBeInTheDocument();
    expect(screen.queryByTitle("ดูรายละเอียด")).not.toBeInTheDocument();
    expect(screen.queryByTitle("ยกเลิกเอกสาร")).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "ยกเลิกเอกสาร" }));
    expect(onCancel).toHaveBeenCalledWith(postedReceipt);
  });
});
