/**
 * Menus E2E tests
 *
 * Verifies the sidebar is driven by the real backend's accessControl.menus:
 *   1. Sidebar shows the 8 main menus from the real backend
 *   2. Clicking a menu navigates to the right page
 *   3. Search filter works
 *   4. SUPER ADMIN badge shows the permission count
 */
import { test, expect, ensureBackendReachable } from "./fixtures";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Sidebar / menu navigation", () => {
  test("superadmin sees the 8 main menus from the real backend", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await loginAsSuperAdmin();
    // Real backend returns these 8 top-level menus for superadmin
    const expectedMenus = [
      "จัดการอะไหล่", // MATERIALS_MANAGEMENTS
      "จัดการเมนู", // MENU_MANAGEMENT
      "จัดการผู้ใช้งาน", // USER_MANAGEMENTS (group)
      "จัดการแผนก", // DEPARTMENT_MANAGEMENT
      "จัดการบทบาท", // ROLE_MANAGEMENT
      "จัดการสิทธิ์", // PERMISSION_MANAGEMENT
      "จัดการเซสชัน", // SESSION_MANAGEMENT
      "บันทึกการใช้งาน", // AUDIT_LOG
    ];
    for (const name of expectedMenus) {
      // Scope to sidebar (aside) to avoid matching other text on the page
      await expect(
        page.getByRole("navigation").getByText(name, { exact: true }),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("clicking a menu navigates to the correct route", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await loginAsSuperAdmin();
    // Click จัดการเมนู → should land on /system/menu-management
    await page
      .getByRole("navigation")
      .getByText("จัดการเมนู", { exact: true })
      .click();
    await page.waitForURL(/\/system\/menu-management/);
    await expect(page).toHaveURL(/\/system\/menu-management/);
    // Page title
    await expect(page.getByRole("heading", { name: "จัดการเมนู" })).toBeVisible();
  });

  test("permission page shows super admin indicator", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/permissions");
    // The "สิทธิ์ของฉัน" tab label includes the count
    await expect(page.getByText(/สิทธิ์ของฉัน/)).toBeVisible();
    // The super admin badge
    await expect(page.getByText("SUPER ADMIN").first()).toBeVisible();
  });

  test("permission catalog renders without React error (action is an object)", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // Regression: the backend returns `action` as `{ id, code, nameTh, nameEn }`,
    // not as a string. The catalog row used to render the whole object as a
    // React child, throwing "Objects are not valid as a React child".
    await loginAsSuperAdmin();
    await page.goto("/permissions");
    await page.getByRole("tab", { name: /แคตตาล็อกสิทธิ์/ }).click();
    // The table headers should be visible
    await expect(page.getByRole("columnheader", { name: "Code" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
    // Wait for at least one row to render — if the action object was rendered
    // directly, React would throw before any row appears.
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    // The action cell should be a short string (e.g. "READ"), not "[object Object]"
    const actionCell = firstRow.locator("td").nth(2);
    await expect(actionCell).toBeVisible();
    const actionText = (await actionCell.innerText()).trim();
    expect(actionText.length, `action cell should be short: got "${actionText}"`).toBeLessThan(30);
    expect(actionText, `action cell should not be "[object Object]"`).not.toBe("[object Object]");
  });

  test("search filter narrows the menu list", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    const nav = page.getByRole("navigation");
    // Wait for at least one menu item to be visible
    await expect(nav.getByText("จัดการเมนู", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(nav.getByText("บันทึกการใช้งาน", { exact: true })).toBeVisible();

    // Type "สิทธิ์" in the search box
    const search = page.getByPlaceholder(/ค้นหาเมนู/i);
    await search.fill("สิทธิ์");

    // Only the permission menu remains
    await expect(nav.getByText("จัดการสิทธิ์", { exact: true })).toBeVisible();
    await expect(nav.getByText("จัดการเมนู", { exact: true })).not.toBeVisible();

    // Clear → everything comes back
    await search.fill("");
    await expect(nav.getByText("จัดการเมนู", { exact: true })).toBeVisible();
  });
});
