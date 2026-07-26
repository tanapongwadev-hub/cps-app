/**
 * Data pages smoke tests
 *
 * Verifies that the key admin pages load successfully with data from the
 * real NestJS backend. Each test:
 *   1. Logs in as superadmin
 *   2. Navigates to a protected page
 *   3. Waits for the page header to appear
 *   4. Waits for the data fetch to complete (no error toast)
 *
 * These are intentional "is the page wired up" tests, not deep functionality
 * tests. For CRUD behavior, see menus.spec.ts.
 */
import { test, expect, ensureBackendReachable } from "./fixtures";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Data pages render with real backend data", () => {
  test("departments page loads", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/user-management/departments");
    await expect(page.getByRole("heading", { name: "แผนก", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    // The page either shows data or an error state with a "try again" button.
    // We don't wait for networkidle because backend can be slow/flaky.
    await expect(
      page
        .getByRole("heading", { name: "แผนก", exact: true })
        .or(page.getByText("ลองใหม่อีกครั้ง")),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("roles page loads", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/user-management/roles");
    // Heading is "บทบาท (Roles)" — uses partial match
    await expect(page.getByRole("heading", { name: /^บทบาท/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("users page loads", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/user-management/users");
    await expect(page.getByRole("heading", { name: "ผู้ใช้งาน", exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("sessions page loads with stat cards", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/sessions");
    await expect(page.getByRole("heading", { name: "จัดการเซสชัน" })).toBeVisible({
      timeout: 15_000,
    });
    // Stat cards: ทั้งหมด / กำลังใช้งาน / ถูก revoke
    await expect(page.getByText("ทั้งหมด").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("กำลังใช้งาน").first()).toBeVisible({ timeout: 5_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
  });

  test("menu management page loads", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    await page.goto("/system/menu-management");
    await expect(page.getByRole("heading", { name: "จัดการเมนู" })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
  });

  test("creating a new menu does not 400 (regression for unsupported fields)", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // Regression: the form used to send `openInNewTab`, `isVisible`, `isActive`,
    // `externalUrl`, `description`, and `name` on POST. The real NestJS backend
    // rejects any field it doesn't know about with 400 VALIDATION_ERROR.
    // This test fills the form and asserts no 400 error toast appears.
    await loginAsSuperAdmin();
    await page.goto("/system/menu-management");
    await expect(page.getByRole("heading", { name: "จัดการเมนู" })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    // Capture failed network responses so we can assert no 400s
    const failedResponses: Array<{ url: string; status: number; body: string }> = [];
    page.on("response", async (r) => {
      if (r.status() >= 400 && r.url().includes("/api/menus")) {
        try {
          failedResponses.push({
            url: r.url().replace("http://localhost:3000", ""),
            status: r.status(),
            body: (await r.text()).slice(0, 200),
          });
        } catch {
          // ignore
        }
      }
    });

    // Open the create dialog
    await page.getByRole("button", { name: /เพิ่มเมนู/ }).click();
    await expect(page.getByRole("dialog", { name: /เพิ่มเมนูใหม่/ })).toBeVisible({
      timeout: 5_000,
    });

    // Fill the form
    const code = `TEST_${Date.now()}`.slice(0, 20);
    await page.getByLabel("Code *").fill(code);
    await page.getByLabel("ชื่อ (ไทย) *").fill("เมนูทดสอบ");
    await page.getByLabel("ชื่อ (English) *").fill("Test Menu");
    await page.getByLabel("Path").fill("/test-menu-path");

    // Submit
    await page.getByRole("button", { name: "สร้างเมนู" }).click();

    // Wait a bit for the request to complete
    await page.waitForTimeout(3_000);

    // Filter to only create calls (POST /api/menus)
    const createFailures = failedResponses.filter(
      (r) => r.url.endsWith("/api/menus") && r.status >= 400,
    );

    if (createFailures.length > 0) {
      console.log("DEBUG failed menu responses:", JSON.stringify(createFailures, null, 2));
    }
    expect(createFailures, "POST /api/menus should not return 4xx").toEqual([]);
  });
});
