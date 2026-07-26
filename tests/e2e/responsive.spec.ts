/**
 * Responsive sidebar tests
 *
 * Verifies that the sidebar behaves correctly across breakpoints:
 *   - Mobile (< 768px): no sidebar visible by default; hamburger opens overlay
 *   - Tablet (768-1023px): icon-rail visible by default; hamburger toggles overlay
 *   - Desktop (>= 1024px): full sidebar; collapse button collapses to icon-rail
 */
import { test, expect } from "./fixtures";

test.describe("Sidebar responsive behavior", () => {
  test("desktop: full sidebar visible by default, has collapse button", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginAsSuperAdmin();
    await page.goto("/dashboard");
    // The sidebar's collapse button lives inside the <aside> (complementary
    // role). The top nav also has a collapse/expand button — we don't want
    // that one for this assertion.
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();
    const box = await sidebar.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
    await expect(sidebar.getByRole("button", { name: /ย่อ Sidebar/ })).toBeVisible();
  });

  test("tablet: sidebar defaults to icon-rail (~72px), hamburger opens overlay", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // iPad-ish portrait
    await page.setViewportSize({ width: 820, height: 1180 });
    await loginAsSuperAdmin();
    await page.goto("/dashboard");
    // The rail is the sticky aside (small width). The overlay is fixed
    // and only appears after the hamburger click.
    const rail = page.locator("aside.sticky");
    await expect(rail).toBeVisible();
    const box = await rail.boundingBox();
    expect(box?.width ?? 0).toBeLessThan(100);
    expect(box?.width ?? 0).toBeGreaterThan(40);

    // No overlay yet
    await expect(page.locator("aside.fixed")).toHaveCount(0);

    // Top-nav hamburger opens the overlay
    await page.getByRole("banner").getByRole("button", { name: /ขยาย Sidebar/ }).click();
    await page.waitForTimeout(300);
    const overlay = page.locator("aside.fixed");
    await expect(overlay).toBeVisible();
    const overlayBox = await overlay.boundingBox();
    expect(overlayBox?.width ?? 0).toBeGreaterThan(200);
    // The rail is still visible underneath at 72px
    expect(await rail.boundingBox()).not.toBeNull();
    // After click, the close button should appear in the top nav
    await expect(
      page.getByRole("banner").getByRole("button", { name: /ปิดเมนู/ }),
    ).toBeVisible();
  });

  test("mobile: no sidebar visible by default, hamburger opens overlay", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // iPhone-ish
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsSuperAdmin();
    await page.goto("/dashboard");
    // No aside visible initially
    await expect(page.getByRole("complementary")).toHaveCount(0);
    // Hamburger opens the drawer
    await page.getByRole("banner").getByRole("button", { name: /เปิดเมนู/ }).click();
    await page.waitForTimeout(300);
    // Now an aside should be visible
    await expect(page.getByRole("complementary").first()).toBeVisible();
  });
});
