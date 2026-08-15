import { expect, test } from "./fixtures";

const viewports = [
  { name: "mobile", width: 390, height: 844, cards: true },
  { name: "tablet", width: 768, height: 1024, cards: false },
  { name: "desktop", width: 1280, height: 720, cards: false },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name}: receiving page fits the viewport`, async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await page.setViewportSize(viewport);
    await loginAsSuperAdmin();
    await page.goto("/materials/materials-receiving");

    await expect(page.getByRole("heading", { name: /Materials Receiving/ })).toBeVisible();

    if (viewport.cards) {
      await expect(page.getByTestId("materials-receiving-cards")).toBeVisible();
      await expect(page.getByTestId("materials-receiving-table")).toBeHidden();
    } else {
      await expect(page.getByTestId("materials-receiving-cards")).toBeHidden();
      await expect(page.getByTestId("materials-receiving-table")).toBeVisible();
    }

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test("mobile: advanced filters and create dialog stay within the viewport", async ({
  page,
  loginAsSuperAdmin,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsSuperAdmin();
  await page.goto("/materials/materials-receiving");

  const advancedFilters = page.getByRole("button", { name: "ตัวกรองเพิ่มเติม" });
  await advancedFilters.click();
  await expect(advancedFilters).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByPlaceholder("Internal Lot (CCI-YYYYMMDD-XXX)")).toBeVisible();

  await page.getByRole("button", { name: "สร้างรายการรับเข้า" }).first().click();
  const dialog = page.getByTestId("materials-receiving-form-dialog");
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error("Materials receiving dialog has no bounding box");
  }
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
});
