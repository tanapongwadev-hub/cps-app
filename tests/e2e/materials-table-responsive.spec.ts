import { test, expect } from "./fixtures";

test.describe("Materials table responsive behavior", () => {
  test("table view stays inside narrow mobile viewports", async ({ page, loginAsSuperAdmin }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsSuperAdmin();
    await page.evaluate(() => localStorage.setItem("materials:view-mode", "list"));
    await page.goto("/materials");

    const tableRoot = page.getByTestId("material-table-root");
    await expect(tableRoot).toBeVisible();

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
        )
        .toBe(true);

      const box = await tableRoot.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x ?? 0).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
    }
  });
});
