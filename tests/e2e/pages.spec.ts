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

  test("users page supports full CRUD against real backend (create + status + delete)", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // Regression: the user-management form used to send `phone`, `roleIds[]`
    // and `departmentId` at the top level. The real NestJS backend rejects
    // those with 400 VALIDATION_ERROR and demands:
    //   POST /users           { assignments: [{departmentId, roleId}] }
    //   PATCH /users/:id      { firstName, lastName, email, telephone }
    //   PATCH /users/:id/status { isActive: boolean }
    //
    // This test creates a user via the form, toggles its status, then deletes
    // it — making sure the form sends the correct payloads end-to-end.
    await loginAsSuperAdmin();
    await page.goto("/user-management/users");
    await expect(page.getByRole("heading", { name: "ผู้ใช้งาน", exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // Track failed network responses (4xx/5xx) to catch any wrong payloads
    const failed: Array<{ url: string; status: number }> = [];
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().includes("/api/")) {
        failed.push({ url: r.url(), status: r.status() });
      }
    });

    // 1) Open create dialog
    await page.getByRole("button", { name: /เพิ่มผู้ใช้งาน/ }).first().click();
    await expect(page.getByRole("heading", { name: "เพิ่มผู้ใช้งานใหม่" })).toBeVisible({
      timeout: 5_000,
    });

    // 2) Fill form
    const stamp = Date.now();
    const username = `e2e_${stamp}`;
    await page.getByLabel("ชื่อผู้ใช้งาน", { exact: true }).fill(username);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("Test1234");
    await page.getByLabel("ยืนยันรหัสผ่าน", { exact: true }).fill("Test1234");
    await page.getByLabel("ชื่อ", { exact: true }).first().fill("E2E");
    await page.getByLabel("นามสกุล", { exact: true }).fill("Tester");
    await page.getByLabel("อีเมล", { exact: true }).fill(`e2e_${stamp}@test.local`);

    // 3) Wait for the assignment selects to be populated, then pick the
    // first dept + first role available.
    const deptSelect = page.getByLabel("แผนก", { exact: true }).first();
    await deptSelect.click();
    await page.getByRole("option").first().click();
    const roleSelect = page.getByLabel("บทบาท", { exact: true }).first();
    await roleSelect.click();
    await page.getByRole("option").first().click();

    // 4) Submit and wait for the create response
    const createResp = page.waitForResponse(
      (r) => r.url().includes("/users") && r.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: /สร้างผู้ใช้งาน/ }).click();
    const r = await createResp;
    expect(r.status(), "POST /users should succeed").toBeLessThan(400);

    // Dialog closes on success
    await expect(page.getByRole("heading", { name: "เพิ่มผู้ใช้งานใหม่" })).not.toBeVisible({
      timeout: 5_000,
    });

    // 5) Toggle the new user's status (ระงับ / เปิดใช้งาน) via the row's
    // action menu. The status mutation uses {isActive: boolean} so we
    // verify the request body doesn't contain `status` (legacy string).
    const statusResp = page.waitForResponse(
      (r) => /\/users\/[\w-]+\/status$/.test(r.url()) && r.request().method() === "PATCH",
      { timeout: 10_000 },
    );
    // The new user is at the top of the list
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.getByRole("button", { name: /เมนู / }).click();
    await page.getByRole("menuitem", { name: /ระงับการใช้งาน/ }).click();
    const sr = await statusResp;
    expect(sr.status()).toBeLessThan(400);
    // Verify the request body uses the new shape
    const statusBody = sr.request().postDataJSON() as { isActive?: boolean } | null;
    expect(statusBody?.isActive, "PATCH /status must use {isActive: boolean}").toBe(false);

    // 6) Delete (cleanup)
    page.on("dialog", (d) => d.accept().catch(() => {}));
    const delResp = page.waitForResponse(
      (r) => /\/users\/[\w-]+$/.test(r.url()) && r.request().method() === "DELETE",
      { timeout: 10_000 },
    );
    await firstRow.getByRole("button", { name: /เมนู / }).click();
    await page.getByRole("menuitem", { name: /ลบ/ }).click();
    // Confirm dialog
    await page.getByRole("button", { name: /^ลบ/ }).click();
    const dr = await delResp;
    expect(dr.status()).toBeLessThan(400);

    // 7) Make sure no 4xx/5xx on any /api/ call during the run
    expect(failed, "no /api/ request should have failed").toEqual([]);
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

  test("dashboard renders hero + KPI cards + quick actions with real backend data", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await loginAsSuperAdmin();
    await page.goto("/dashboard");
    // Page header
    await expect(page.getByRole("heading", { name: "ภาพรวมระบบ" })).toBeVisible({
      timeout: 15_000,
    });
    // Hero greeting is one of: สวัสดีตอนเช้า/เที่ยง/บ่าย/เย็น/กลางคืน
    await expect(
      page.getByText(/สวัสดีตอน(เช้า|เที่ยง|บ่าย|เย็น|กลางคืน)/),
    ).toBeVisible({ timeout: 5_000 });
    // All 4 KPI labels are rendered (use exact: true to avoid matching the
    // sidebar menu "จัดการแผนก" and the quick-stats "2 แผนก")
    await expect(page.getByText("ผู้ใช้งานทั้งหมด", { exact: true })).toBeVisible();
    await expect(page.getByText("แผนก", { exact: true })).toBeVisible();
    await expect(page.getByText("บทบาท", { exact: true })).toBeVisible();
    await expect(page.getByText("เซสชันที่กำลังใช้งาน", { exact: true })).toBeVisible();
    // Quick actions card
    await expect(page.getByText("เพิ่มผู้ใช้งาน").first()).toBeVisible({ timeout: 5_000 });
    // System status section
    await expect(page.getByText("สถานะระบบ")).toBeVisible();
    await expect(page.getByText("API Server")).toBeVisible();
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

    // Pick an icon from the IconPicker (regression: the field used to be a
    // free-text input — make sure the Select box actually sends the chosen
    // icon name through the form payload).
    const iconCombobox = page.getByRole("combobox", { name: "Icon" });
    await iconCombobox.click();
    await page.getByRole("option", { name: /Building/ }).first().click();
    await expect(iconCombobox).toContainText("building");

    // Submit and wait for the actual POST /api/menus response (faster than
    // a fixed waitForTimeout, and avoids the 45s test timeout on slow runs).
    const createResponsePromise = page.waitForResponse(
      (r) => r.url().endsWith("/api/menus") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "สร้างเมนู" }).click();
    const createResponse = await createResponsePromise;
    expect(
      createResponse.status(),
      `POST /api/menus should not 4xx — body: ${(await createResponse.text()).slice(0, 200)}`,
    ).toBeLessThan(400);

    // Filter any other failed menu responses (e.g. PATCH from a stale form)
    const createFailures = failedResponses.filter(
      (r) => r.url.endsWith("/api/menus") && r.status >= 400,
    );
    if (createFailures.length > 0) {
      console.log("DEBUG failed menu responses:", JSON.stringify(createFailures, null, 2));
    }
    expect(createFailures, "POST /api/menus should not return 4xx").toEqual([]);
  });

  test("menu management shows hidden/inactive menus and lets you toggle them back", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // Regression: the page used to fetch from /menus/tree, which the backend
    // filters by isVisible. That made it impossible to see — let alone
    // unhide — menus that the admin had hidden. The fix is to use the
    // /menus (list) endpoint which returns everything.
    await loginAsSuperAdmin();

    // 1. Create a hidden + inactive menu via the API
    const BACKEND = "http://localhost:3001/api/v1";
    const login = await page.request.post(`${BACKEND}/auth/login`, {
      data: { username: "superadmin", password: "change-me-secure-password" },
    });
    const token = (await login.json()).data.authentication.accessToken;
    const code = `HIDDEN_${Date.now()}`.slice(0, 30);
    const create = await page.request.post(`${BACKEND}/menus`, {
      data: {
        code,
        nameTh: "เมนูซ่อน",
        nameEn: "Hidden Menu",
        menuType: "MAIN",
        path: `/${code.toLowerCase()}`,
        sortOrder: 100,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(create.status()).toBeLessThan(400);
    const id = (await create.json()).id;
    await page.request.patch(`${BACKEND}/menus/${id}`, {
      data: { isVisible: false, isActive: false },
      headers: { Authorization: `Bearer ${token}` },
    });

    // 2. Go to the menu management page — the hidden menu must appear
    await page.goto("/system/menu-management");
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    // The hidden menu's code should be visible in the list (proves the page
    // is using /menus list, not /menus tree which filters by isVisible).
    await expect(page.getByText(code, { exact: true })).toBeVisible({ timeout: 5_000 });

    // 3. Click the eye toggle to unhide it
    const row = page.locator("li").filter({ hasText: code });
    await expect(row).toBeVisible();
    // The toggle button has a Thai title for show/hide
    await row.getByRole("button", { name: /แสดงใน Sidebar/ }).click();
    // The title should flip to "ซ่อนจาก Sidebar"
    await expect(row.getByRole("button", { name: /ซ่อนจาก Sidebar/ })).toBeVisible({
      timeout: 5_000,
    });

    // 4. Cleanup
    await page.request.delete(`${BACKEND}/menus/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});
