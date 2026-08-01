/**
 * E2E test for /user-management/departments CRUD.
 *
 * Verifies the page supports create + edit + delete with the real backend.
 * The form must use { code, nameTh, nameEn } (not the legacy `name` field)
 * and PATCH must only send { nameTh, nameEn } (no `isActive`).
 */
import { test, expect, ensureBackendReachable, BACKEND_BASE } from "./fixtures";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Departments page CRUD", () => {
  test("create + edit + delete a department via the UI", async ({ page }) => {
    // 0) Login as superadmin
    const adminLogin = await page.request.post(`${BACKEND_BASE}/auth/login`, {
      data: { username: "superadmin", password: "change-me-secure-password" },
    });
    if (!adminLogin.ok()) throw new Error("superadmin login failed");
    const adminToken = (await adminLogin.json()).data.authentication.accessToken;

    // 1) Visit the page
    await page.context().clearCookies();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    // Seed session
    const adminAuth = (await adminLogin.json()).data.authentication;
    await page.evaluate(
      ({ auth }) => {
        const key = "admin.auth.token";
        const payload = {
          state: {
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            expiresAt: Date.now() + 900_000,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem(key, JSON.stringify(payload));
      },
      { auth: adminAuth },
    );

    await page.goto("/user-management/departments", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "แผนก", exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // 2) Track failed network requests
    const failed: Array<{ url: string; status: number }> = [];
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().includes("/api/")) {
        failed.push({ url: r.url(), status: r.status() });
      }
    });

    // 3) Open create dialog
    await page.getByRole("button", { name: /เพิ่มแผนก/ }).first().click();
    await expect(page.getByRole("heading", { name: "เพิ่มแผนกใหม่" })).toBeVisible();

    // 4) Fill form (must use nameTh / nameEn, NOT `name`)
    // The label has a trailing "*" (required indicator) — use a regex
    // without `exact: true` to match the full accessible name.
    const stamp = Date.now();
    const code = `E2E${stamp}`.slice(0, 10);
    await page.getByLabel(/^รหัสแผนก/).fill(code);
    await page.getByLabel(/^ชื่อภาษาไทย/).fill("แผนก E2E");
    await page.getByLabel(/^ชื่อภาษาอังกฤษ/).fill("E2E Department");

    // 5) Submit and wait for POST /departments response
    const createResp = page.waitForResponse(
      (r) => r.url().endsWith("/departments") && r.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: /สร้างแผนก/ }).click();
    const r = await createResp;
    expect(r.status(), "POST /departments should succeed").toBeLessThan(400);

    // 6) Verify the create payload uses the correct field names
    const createBody = r.request().postDataJSON() as Record<string, unknown>;
    expect(createBody.code).toBe(code);
    expect(createBody.nameTh).toBe("แผนก E2E");
    expect(createBody.nameEn).toBe("E2E Department");
    // Real backend rejects `name` (legacy field)
    expect(createBody.name, "create payload should NOT use legacy `name` field").toBeUndefined();

    // Dialog closes on success
    await expect(page.getByRole("heading", { name: "เพิ่มแผนกใหม่" })).not.toBeVisible({
      timeout: 5_000,
    });

    // 7) Find the new row and open edit
    const newRow = page.locator("table tbody tr").filter({ hasText: code }).first();
    await expect(newRow).toBeVisible();
    await newRow.getByRole("button", { name: /เมนู / }).click();
    await page.getByRole("menuitem", { name: /แก้ไข/ }).click();
    await expect(page.getByRole("heading", { name: "แก้ไขแผนก" })).toBeVisible();

    // 8) Edit nameTh + nameEn
    const patchResp = page.waitForResponse(
      (r) => /\/departments\/[\w-]+$/.test(r.url()) && r.request().method() === "PATCH",
      { timeout: 10_000 },
    );
    await page.getByLabel(/^ชื่อภาษาไทย/).fill("แผนก E2E (แก้ไข)");
    await page.getByLabel(/^ชื่อภาษาอังกฤษ/).fill("E2E Department (edited)");
    await page.getByRole("button", { name: /บันทึกการเปลี่ยนแปลง/ }).click();
    const pr = await patchResp;
    expect(pr.status(), "PATCH /departments/:id should succeed").toBeLessThan(400);

    // Verify the PATCH payload only contains nameTh + nameEn
    const patchBody = pr.request().postDataJSON() as Record<string, unknown>;
    expect(patchBody.nameTh).toBe("แผนก E2E (แก้ไข)");
    expect(patchBody.nameEn).toBe("E2E Department (edited)");
    expect(patchBody.isActive, "PATCH should NOT include isActive").toBeUndefined();
    expect(patchBody.code, "PATCH should NOT include code (immutable)").toBeUndefined();

    // 9) Delete via action menu
    await expect(newRow).toContainText("แผนก E2E (แก้ไข)");
    page.on("dialog", (d) => d.accept().catch(() => {}));
    const delResp = page.waitForResponse(
      (r) => /\/departments\/[\w-]+$/.test(r.url()) && r.request().method() === "DELETE",
      { timeout: 10_000 },
    );
    await newRow.getByRole("button", { name: /เมนู / }).click();
    await page.getByRole("menuitem", { name: /ลบ/ }).click();
    await page.getByRole("button", { name: /^ลบ/ }).click();
    const dr = await delResp;
    expect(dr.status(), "DELETE /departments/:id should succeed").toBeLessThan(400);

    // 10) Verify no 4xx/5xx on any /api/ call during the run
    expect(failed, "no /api/ request should have failed").toEqual([]);

    // 11) Cleanup just in case
    const list = await page.request.get(
      `${BACKEND_BASE}/departments?page=1&limit=50`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    if (list.ok()) {
      const items = (await list.json()).items ?? [];
      const found = items.find((d: { code: string; id: string }) => d.code === code);
      if (found) {
        await page.request.delete(`${BACKEND_BASE}/departments/${found.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    }
  });
});
