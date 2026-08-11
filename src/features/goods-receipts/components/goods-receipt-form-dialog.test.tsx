/**
 * Goods Receipt Form Dialog — focused on the noSupplierDocument checkbox bug.
 *
 * Bug: shadcn Checkbox (Radix) does not bind to react-hook-form via form.register.
 *      When the user ticked the box, the visible state changed but form state
 *      stayed false, so the backend validation failed on post.
 *
 * Fix: wrap Checkbox with <Controller> and bind checked + onCheckedChange to field.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  getErrorMessage: vi.fn((e: unknown) => String(e)),
}));

import { GoodsReceiptFormDialog } from "./goods-receipt-form-dialog";

const defaultLookups = {
  suppliers: [
    { id: "2", code: "SUP-001", nameTh: "บริษัท ตัวอย่าง จำกัด" },
  ],
  materials: [
    {
      id: "3",
      code: "MAT-A",
      name: "น้ำมันปาล์ม",
      packingQuantity: 200,
      unitId: "5",
      unit: "5",
    },
  ],
  units: [{ id: "5", code: "KG", nameTh: "กิโลกรัม" }],
  rejectReasons: [],
  poNoSuggestions: [],
};

const baseReceipt = {
  id: "42",
  receiptNo: null,
  receiptDate: "2026-08-09",
  supplierId: "2",
  supplier: { id: "2", code: "SUP-001", nameTh: "บริษัท ตัวอย่าง จำกัด" },
  status: "draft",
  remark: null,
  supplierDocNo: null,
  noSupplierDocument: false,
  items: [
    {
      id: "100",
      lineNo: 1,
      materialId: "3",
      material: { id: "3", code: "MAT-A", name: "น้ำมันปาล์ม" },
      poNo: null,
      supplierDocNo: null,
      supplierDocDate: null,
      noSupplierDocument: false,
      lotNo: "LOT-001",
      qtyReceived: "100",
      qtyRejected: null,
      rejectReasonId: null,
      rejectNote: null,
      productionDate: null,
      expiryDate: null,
      unitPrice: null,
      lineAmount: null,
      filePath: null,
      fileName: null,
      remark: null,
    },
  ],
  attachments: [],
  createdBy: "9",
  updatedBy: "9",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
};

function renderDialog(receipt: typeof baseReceipt | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <GoodsReceiptFormDialog
        open
        onOpenChange={vi.fn()}
        receipt={receipt}
        lookups={defaultLookups}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    </QueryClientProvider>,
  );
}

describe("GoodsReceiptFormDialog — noSupplierDocument checkbox binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the existing item with noSupplierDocument=false loaded from receipt", () => {
    renderDialog(baseReceipt);
    const checkbox = screen.getByLabelText("ไม่มีใบส่งของ");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("updates form state when the user ticks noSupplierDocument", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <GoodsReceiptFormDialog
          open
          onOpenChange={vi.fn()}
          receipt={baseReceipt}
          lookups={defaultLookups}
          onSave={onSave}
        />
      </QueryClientProvider>,
    );

    // Tick the checkbox
    const checkbox = screen.getByLabelText("ไม่มีใบส่งของ");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Supplier Doc No / Date inputs should be disabled now
    expect(screen.getByPlaceholderText("DN-12345")).toBeDisabled();
  });

  it("sends noSupplierDocument=true and null supplierDocNo when ticked and saved", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <GoodsReceiptFormDialog
          open
          onOpenChange={vi.fn()}
          receipt={baseReceipt}
          lookups={defaultLookups}
          onSave={onSave}
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByLabelText("ไม่มีใบส่งของ"));
    // Find and click the save button
    const saveButton = screen.getByRole("button", { name: /บันทึก|save/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload.items[0].noSupplierDocument).toBe(true);
    expect(payload.items[0].supplierDocNo).toBeNull();
    expect(payload.items[0].supplierDocDate).toBeNull();
  });
});
