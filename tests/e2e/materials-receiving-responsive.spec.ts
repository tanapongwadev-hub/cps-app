import type { Locator } from "@playwright/test";
import { expect, test, type Page } from "./fixtures";

const supplier = {
  id: "sup-responsive-001",
  code: "SUP-RESP-001",
  nameTh: "บริษัทผู้จัดจำหน่ายชื่อยาวสำหรับทดสอบหน้าจอขนาดเล็ก จำกัด",
  nameEn: "Responsive Supplier Company Limited",
};

const material = {
  id: "mat-responsive-001",
  code: "MAT-RESPONSIVE-LONG-001",
  name: "วัสดุทดสอบชื่อยาวมากสำหรับตรวจสอบการตัดคำบนการ์ดรับเข้า",
};

const unit = {
  id: "unit-responsive-001",
  code: "KG",
  nameTh: "กิโลกรัม",
  nameEn: "Kilogram",
};

const receiving = {
  id: "mr-responsive-001",
  internalLotNo: "CCI-20260815-RESPONSIVE-VERY-LONG-001",
  organizationId: "1",
  supplierId: supplier.id,
  materialId: material.id,
  unitId: unit.id,
  receiveQuantity: "1234567.8900",
  packingQuantity: 250,
  packageCount: 2,
  piecesQuantity: null,
  supplierLotNo: "SUP-20260801-VERY-LONG-IDENTIFIER-001",
  supplierProductionDate: "2026-08-01",
  receiveDate: "2026-08-15",
  status: "draft",
  poNo: "PO-RESPONSIVE-001",
  materialType: "PCS",
  ratio: null,
  attachmentUrl: null,
  attachmentName: null,
  remark: "Responsive receiving fixture",
  qrCode: null,
  qrPayload: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "superadmin",
  updatedBy: "superadmin",
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
  supplier,
  material,
  unit,
} as const;

const detail = {
  ...receiving,
  packages: [
    {
      id: "pkg-responsive-001",
      materialReceivingId: receiving.id,
      packageNo: 1,
      lotDetailNo: "CCI-20260815-RESPONSIVE-VERY-LONG-001-001",
      quantity: "1234567.8900",
      qrCode: null,
      status: "available",
    },
  ],
};

const lookups = {
  suppliers: [supplier],
  materials: [
    {
      ...material,
      packingQuantity: 250,
      materialType: "PCS",
      ratio: null,
      unitId: unit.id,
    },
  ],
  units: [unit],
};

const viewports = [
  { name: "mobile", width: 390, height: 844, cards: true },
  { name: "tablet", width: 768, height: 1024, cards: false },
  { name: "desktop", width: 1280, height: 720, cards: false },
] as const;

async function interceptMaterialsReceivingReads(page: Page) {
  await page.route("**/materials-receiving**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (
      request.method() !== "GET" ||
      !/\/api(?:\/v1)?\/materials-receiving(?:\/|$)/.test(url.pathname)
    ) {
      await route.continue();
      return;
    }

    let data: unknown;
    if (url.pathname.endsWith("/materials-receiving/lookups")) {
      data = lookups;
    } else if (url.pathname.endsWith("/materials-receiving/suppliers")) {
      data = [supplier];
    } else if (url.pathname.endsWith(`/materials-receiving/${receiving.id}`)) {
      data = detail;
    } else if (url.pathname.endsWith("/materials-receiving")) {
      data = {
        items: [receiving],
        meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      };
    } else {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { success: true, message: "OK", data },
    });
  });
}

async function expectNoDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function expectSurfaceWithinViewport(page: Page, surface: Locator) {
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) throw new Error("Surface or viewport has no bounding box");

  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  await expectNoDocumentOverflow(page);
}

async function openReceivingPage(page: Page, loginAsSuperAdmin: () => Promise<void>) {
  await interceptMaterialsReceivingReads(page);
  await loginAsSuperAdmin();
  await page.goto("/materials/materials-receiving");
  await expect(page.getByRole("heading", { name: /Materials Receiving/ })).toBeVisible();
}

for (const viewport of viewports) {
  test(`${viewport.name}: receiving page fits the viewport with deterministic data`, async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await page.setViewportSize(viewport);
    await openReceivingPage(page, loginAsSuperAdmin);

    if (viewport.cards) {
      const cards = page.getByTestId("materials-receiving-cards");
      await expect(cards).toBeVisible();
      await expect(cards.getByText(receiving.internalLotNo)).toBeVisible();
      await expect(page.getByTestId("materials-receiving-table")).toBeHidden();
    } else {
      const table = page.getByTestId("materials-receiving-table");
      await expect(page.getByTestId("materials-receiving-cards")).toBeHidden();
      await expect(table).toBeVisible();
      await expect(table.getByText(receiving.internalLotNo)).toBeVisible();

      await table
        .getByRole("button", { name: `จัดการรายการรับเข้า ${receiving.internalLotNo}` })
        .click();
      await expectSurfaceWithinViewport(page, page.getByRole("menu"));
    }

    await expectNoDocumentOverflow(page);
  });
}

test("mobile: filters, row actions, dialogs, and sticky actions stay within the viewport", async ({
  page,
  loginAsSuperAdmin,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openReceivingPage(page, loginAsSuperAdmin);
  await expect(
    page.getByRole("article", { name: `รายการรับเข้า ${receiving.internalLotNo}` }),
  ).toBeVisible();

  const advancedFilters = page.getByRole("button", { name: "ตัวกรองเพิ่มเติม" });
  await advancedFilters.click();
  await expect(advancedFilters).toHaveAttribute("aria-expanded", "true");
  const advancedSurface = page
    .getByPlaceholder("Internal Lot (CCI-YYYYMMDD-XXX)")
    .locator("..")
    .locator("..");
  await expectSurfaceWithinViewport(page, advancedSurface);

  const rowMenuTrigger = page.getByRole("button", {
    name: `จัดการรายการรับเข้า ${receiving.internalLotNo}`,
  });
  await rowMenuTrigger.click();
  const rowMenu = page.getByRole("menu");
  await expectSurfaceWithinViewport(page, rowMenu);
  await rowMenu.getByRole("menuitem", { name: /ดูรายละเอียด/ }).click();

  const detailDialog = page.getByTestId("materials-receiving-detail-dialog");
  await expectSurfaceWithinViewport(page, detailDialog);
  const detailActions = page.getByTestId("materials-receiving-detail-actions");
  await expectSurfaceWithinViewport(page, detailActions);
  await expect(detailActions.getByRole("button", { name: "แก้ไข" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "ยืนยันรับเข้า" })).toBeVisible();
  await expect(detailActions.getByRole("button", { name: "ยกเลิก", exact: true })).toBeVisible();

  await detailActions.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  const cancelDialog = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "ยกเลิกการรับเข้า", exact: true }),
  });
  await expectSurfaceWithinViewport(page, cancelDialog);
  await expect(cancelDialog.getByLabel("เหตุผลในการยกเลิก")).toBeVisible();
  await cancelDialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(cancelDialog).toBeHidden();

  await detailActions.getByRole("button", { name: "แก้ไข" }).click();
  const editDialog = page.getByTestId("materials-receiving-form-dialog");
  await expect(editDialog.getByRole("heading", { name: /แก้ไขการรับเข้า/ })).toBeVisible();
  await expectSurfaceWithinViewport(page, editDialog);
  await expectSurfaceWithinViewport(page, page.getByTestId("materials-receiving-form-actions"));
  await expect(editDialog.getByRole("option", { name: /SUP-RESP-001/ })).toBeAttached();
  await expect(editDialog.getByRole("option", { name: "กำลังโหลด..." })).toHaveCount(0);
  await editDialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(editDialog).toBeHidden();

  await page.getByRole("button", { name: "สร้างรายการรับเข้า" }).click();
  const createDialog = page.getByTestId("materials-receiving-form-dialog");
  await expect(
    createDialog.getByRole("heading", { name: "สร้างรายการรับเข้าวัตถุดิบ" }),
  ).toBeVisible();
  await expectSurfaceWithinViewport(page, createDialog);
  await expectSurfaceWithinViewport(page, page.getByTestId("materials-receiving-form-actions"));
  await createDialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(createDialog).toBeHidden();

  await rowMenuTrigger.click();
  const deleteMenu = page.getByRole("menu");
  await expectSurfaceWithinViewport(page, deleteMenu);
  await deleteMenu.getByRole("menuitem", { name: "ลบ", exact: true }).click();
  const deleteDialog = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "ลบรายการรับเข้า", exact: true }),
  });
  await expectSurfaceWithinViewport(page, deleteDialog);
  await deleteDialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(deleteDialog).toBeHidden();
  await expectNoDocumentOverflow(page);
});
