/**
 * MaterialsReceivingFormDialog tests
 * ครอบคลุม:
 *  1. Live preview ของ Supplier Lot (SUP-YYYYMMDD) และ Package breakdown (CEIL)
 *  2. Zod validation: receiveQuantity decimal, ISO date, idempotencyKey pattern
 *  3. Save flow: create (POST) และ update (PATCH with updatedAt)
 *  4. Server error display
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialsReceivingFormDialog } from "./materials-receiving-form-dialog";
import type {
  MaterialsReceiving,
  MaterialsReceivingLookups,
  MaterialsReceivingSupplier,
} from "../api/materials-receiving-api";

const { createMutateAsync, updateMutateAsync, getSuppliersByMaterial } = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  getSuppliersByMaterial: vi.fn(),
}));

vi.mock("../api/materials-receiving-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/materials-receiving-api")>();
  return {
    ...actual,
    materialsReceivingApi: {
      ...actual.materialsReceivingApi,
      getSuppliersByMaterial,
    },
  };
});

vi.mock("../hooks/use-materials-receiving", () => ({
  useCreateMaterialsReceiving: () => ({
    mutateAsync: createMutateAsync,
    isPending: false,
  }),
  useUpdateMaterialsReceiving: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: () => ({
    permissions: ["*"],
    hasPermission: () => true,
    hasAny: () => true,
    hasAll: () => true,
    isSuperAdmin: () => true,
  }),
}));

const today = new Date().toISOString().slice(0, 10);

const supplierA: MaterialsReceivingSupplier = {
  id: "sup-001",
  code: "SUP-001",
  nameTh: "บริษัท A",
  nameEn: "Co A",
};

const supplierB: MaterialsReceivingSupplier = {
  id: "sup-002",
  code: "SUP-002",
  nameTh: "บริษัท B",
  nameEn: "Co B",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const lookups: MaterialsReceivingLookups = {
  suppliers: [supplierA, supplierB],
  materials: [
    {
      id: "mat-001",
      code: "MAT-A",
      name: "น้ำมันปาล์ม",
      packingQuantity: 200,
      materialType: "PIPE",
      ratio: 4,
      unitId: "unit-001",
    },
    {
      id: "mat-002",
      code: "MAT-B",
      name: "น้ำตาล",
      packingQuantity: 100,
      materialType: "PCS",
      ratio: null,
      unitId: "unit-002",
    },
  ],
  units: [
    { id: "unit-001", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram" },
    { id: "unit-002", code: "L", nameTh: "ลิตร", nameEn: "Liter" },
  ],
};

const baseReceiving: MaterialsReceiving = {
  id: "mr-001",
  internalLotNo: "CCI-20260809-001",
  organizationId: "1",
  supplierId: "sup-001",
  materialId: "mat-001",
  unitId: "unit-001",
  receiveQuantity: "1000",
  packingQuantity: 200,
  packageCount: 5,
  piecesQuantity: "4000.0000",
  supplierLotNo: "SUP-20260801",
  supplierProductionDate: "2026-08-01",
  receiveDate: today,
  qrCode: null,
  qrPayload: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  status: "draft",
  poNo: "PO-2026-001",
  materialType: "PIPE",
  ratio: 4,
  attachmentUrl: null,
  attachmentName: null,
  remark: "test remark",
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "user-001",
  updatedBy: "user-001",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
};

describe("MaterialsReceivingFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue(baseReceiving);
    updateMutateAsync.mockResolvedValue({ ...baseReceiving, id: "mr-001" });
    getSuppliersByMaterial.mockResolvedValue(lookups.suppliers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses a viewport-safe shell and sticky mobile actions", async () => {
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );

    const dialog = await screen.findByTestId("materials-receiving-form-dialog");
    expect(dialog).toHaveClass(
      "w-[calc(100vw-1rem)]",
      "max-h-[calc(100dvh-1rem)]",
      "p-0",
      "sm:p-6",
    );
    expect(screen.getByTestId("materials-receiving-form-actions")).toHaveClass(
      "sticky",
      "bottom-0",
    );
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toHaveClass("w-full", "sm:w-auto");
  });

  it("renders create dialog with empty fields when no receiving provided", async () => {
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );
    expect(await screen.findByText("สร้างรายการรับเข้าวัตถุดิบ")).toBeInTheDocument();
    expect(screen.getByLabelText(/วัสดุ/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ผู้จัดจำหน่าย/)).toBeInTheDocument();
    expect(screen.getByLabelText(/จำนวนรับเข้า/)).toBeInTheDocument();
  });

  it("previews Supplier Lot (SUP-YYYYMMDD) based on supplier production date", async () => {
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );

    // The default value of supplierProductionDate is today
    const expected = `SUP-${today.replace(/-/g, "")}`;
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("computes package breakdown as CEIL(receiveQuantity / packingQuantity)", async () => {
    const user = userEvent.setup();
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );

    // Select material MAT-A (packingQuantity = 200)
    await user.selectOptions(screen.getByLabelText(/วัสดุ/), "mat-001");
    // Enter receiveQuantity 1050
    await user.type(screen.getByLabelText(/จำนวนรับเข้า/), "1050");

    // 1050 / 200 = 5.25 -> 6 packages
    // First 5 = 200, last = 50
    expect(await screen.findByText("รวม 6 ใบ")).toBeInTheDocument();
    // Check that the last package quantity is shown as 50
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("validates that receiveQuantity is a positive decimal", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={onSave}
      />,
    );

    // Select material
    await user.selectOptions(screen.getByLabelText(/วัสดุ/), "mat-001");
    await screen.findByRole("option", { name: /SUP-001/ });
    await user.selectOptions(screen.getByLabelText(/ผู้จัดจำหน่าย/), "sup-001");
    // Enter invalid decimal
    await user.type(screen.getByLabelText(/จำนวนรับเข้า/), "abc");
    await user.click(screen.getByRole("button", { name: /สร้างรายการรับเข้า/ }));

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("calls onSave with the create payload when submitting a new receiving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={onSave}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/วัสดุ/), "mat-001");
    await screen.findByRole("option", { name: /SUP-001/ });
    await user.selectOptions(screen.getByLabelText(/ผู้จัดจำหน่าย/), "sup-001");
    await user.type(screen.getByLabelText(/จำนวนรับเข้า/), "500");
    await user.click(screen.getByRole("button", { name: /สร้างรายการรับเข้า/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const callArg = onSave.mock.calls[0]?.[0] as {
      materialId: string;
      supplierId: string;
      receiveQuantity: string;
    };
    expect(callArg.materialId).toBe("mat-001");
    expect(callArg.supplierId).toBe("sup-001");
    expect(callArg.receiveQuantity).toBe("500");
  });

  it("calls onSave with the update payload (including updatedAt) when editing", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        receiving={baseReceiving}
        lookups={lookups}
        onSave={onSave}
      />,
    );

    // Edit the remark
    const remarkField = screen.getByLabelText(/หมายเหตุ/);
    await user.clear(remarkField);
    await user.type(remarkField, "updated remark");
    await user.click(screen.getByRole("button", { name: /บันทึกการแก้ไข/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const callArg = onSave.mock.calls[0]?.[0] as { updatedAt: string };
    expect(callArg.updatedAt).toBe(baseReceiving.updatedAt);
  });

  it("disables material and supplier fields when editing (immutable)", async () => {
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        receiving={baseReceiving}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );
    // material and supplier selects should be disabled
    const materialSelect = await screen.findByLabelText(/วัสดุ/);
    const supplierSelect = screen.getByLabelText(/ผู้จัดจำหน่าย/);
    expect(materialSelect).toBeDisabled();
    expect(supplierSelect).toBeDisabled();
  });

  it("shows the immutable edit supplier after loading finishes", async () => {
    const supplierRequest = deferred<MaterialsReceivingSupplier[]>();
    getSuppliersByMaterial.mockReturnValueOnce(supplierRequest.promise);

    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        receiving={baseReceiving}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );

    const supplierSelect = await screen.findByLabelText(/ผู้จัดจำหน่าย/);
    expect(screen.getByRole("option", { name: "กำลังโหลด..." })).toBeInTheDocument();

    supplierRequest.resolve([supplierA]);

    await waitFor(() => {
      expect(supplierSelect).toHaveValue("sup-001");
      expect(screen.getByRole("option", { name: "SUP-001 — บริษัท A" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: "กำลังโหลด..." })).not.toBeInTheDocument();
  });

  it("ignores a stale edit supplier request after the receiving changes", async () => {
    const firstRequest = deferred<MaterialsReceivingSupplier[]>();
    const secondRequest = deferred<MaterialsReceivingSupplier[]>();
    getSuppliersByMaterial.mockImplementation((materialId: string) =>
      materialId === "mat-001" ? firstRequest.promise : secondRequest.promise,
    );
    const secondReceiving: MaterialsReceiving = {
      ...baseReceiving,
      id: "mr-002",
      internalLotNo: "CCI-20260809-002",
      materialId: "mat-002",
      supplierId: "sup-002",
    };

    const { rerender } = render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        receiving={baseReceiving}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );
    rerender(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        receiving={secondReceiving}
        lookups={lookups}
        onSave={vi.fn()}
      />,
    );

    secondRequest.resolve([supplierB]);
    const supplierSelect = await screen.findByLabelText(/ผู้จัดจำหน่าย/);
    await waitFor(() => {
      expect(supplierSelect).toHaveValue("sup-002");
      expect(screen.getByRole("option", { name: "SUP-002 — บริษัท B" })).toBeInTheDocument();
    });

    firstRequest.resolve([supplierA]);
    await waitFor(() => {
      expect(supplierSelect).toHaveValue("sup-002");
      expect(screen.queryByRole("option", { name: "SUP-001 — บริษัท A" })).not.toBeInTheDocument();
    });
  });

  it("displays the server error message when onSave throws", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("Backend 500: conflict"));
    render(
      <MaterialsReceivingFormDialog
        open
        onOpenChange={vi.fn()}
        lookups={lookups}
        onSave={onSave}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/วัสดุ/), "mat-001");
    await screen.findByRole("option", { name: /SUP-001/ });
    await user.selectOptions(screen.getByLabelText(/ผู้จัดจำหน่าย/), "sup-001");
    await user.type(screen.getByLabelText(/จำนวนรับเข้า/), "1000");
    await user.click(screen.getByRole("button", { name: /สร้างรายการรับเข้า/ }));

    expect(await screen.findByText("Backend 500: conflict")).toBeInTheDocument();
  });
});
