import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MaterialsReceivingDetail } from "../api/materials-receiving-api";
import { MaterialsReceivingDetailDialog } from "./materials-receiving-detail-dialog";

const detail: MaterialsReceivingDetail = {
  id: "mr-001",
  internalLotNo: "CCI-20260809-001",
  organizationId: "1",
  supplierId: "sup-001",
  materialId: "mat-001",
  unitId: "unit-001",
  receiveQuantity: "1000",
  packingQuantity: 200,
  packageCount: 1,
  piecesQuantity: null,
  supplierLotNo: "SUP-20260801",
  supplierProductionDate: "2026-08-01",
  receiveDate: "2026-08-09",
  status: "draft",
  poNo: "PO-001",
  materialType: "PCS",
  ratio: null,
  attachmentUrl: null,
  attachmentName: null,
  remark: null,
  qrCode: null,
  qrPayload: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "admin",
  updatedBy: "admin",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
  supplier: {
    id: "sup-001",
    code: "SUP-001",
    nameTh: "บริษัท A",
    nameEn: "Co A",
  },
  material: { id: "mat-001", code: "MAT-A", name: "น้ำมันปาล์ม" },
  unit: {
    id: "unit-001",
    code: "KG",
    nameTh: "กิโลกรัม",
    nameEn: "Kilogram",
  },
  packages: [
    {
      id: "pkg-001",
      materialReceivingId: "mr-001",
      packageNo: 1,
      lotDetailNo: "CCI-20260809-001-001",
      quantity: "1000",
      qrCode: null,
      status: "available",
    },
  ],
};

describe("MaterialsReceivingDetailDialog", () => {
  it("constrains QR images within narrow card columns", async () => {
    // The dialog has two independent QR surfaces: the per-piece grid (only
    // shown for non-PCS material types with a piecesQrPayload, QR generated
    // client-side via getQrCodeUrl — alt="QR <lotNo>") and the per-package
    // breakdown (alt="QR for <lotDetailNo>", shown whenever a package has a
    // qrCode). There is no single "main" QR image — receiving.qrCode /
    // receiving.piecesQrCode aren't rendered anywhere in this component.
    render(
      <MaterialsReceivingDetailDialog
        open
        onOpenChange={vi.fn()}
        receiving={{
          ...detail,
          materialType: "COIL",
          ratio: 10,
          piecesQrPayload: {
            version: "1",
            internalLotNo: detail.internalLotNo,
            runNo: null,
            materialCode: "MAT-A",
            piecesQuantity: "3",
            materialType: "COIL",
          },
          packages: [{ ...detail.packages[0]!, qrCode: "data:image/png;base64,pkg" }],
        }}
      />,
    );

    const pieceQrs = await screen.findAllByAltText(/^QR CCI/);
    expect(pieceQrs).toHaveLength(3);
    for (const img of pieceQrs) {
      expect(img).toHaveClass("max-w-full");
    }

    const packageQrs = await screen.findAllByAltText(/^QR for /);
    expect(packageQrs).toHaveLength(1);
    for (const img of packageQrs) {
      expect(img).toHaveClass("max-w-full");
    }
  });

  it("uses a viewport-safe shell and sticky mobile actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <MaterialsReceivingDetailDialog
        open
        onOpenChange={vi.fn()}
        receiving={detail}
        onEdit={onEdit}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("materials-receiving-detail-dialog")).toHaveClass(
      "w-[calc(100vw-1rem)]",
      "max-h-[calc(100dvh-1rem)]",
      "p-0",
      "sm:p-6",
    );
    expect(screen.getByText(detail.internalLotNo)).toHaveClass("break-all");
    expect(screen.getByTestId("materials-receiving-detail-actions")).toHaveClass(
      "sticky",
      "bottom-0",
    );

    await user.click(screen.getByRole("button", { name: "แก้ไข" }));
    expect(onEdit).toHaveBeenCalledWith(detail);
  });
});
