/**
 * Auth E2E tests
 *
 * Covers the critical authentication flows:
 *   1. Login with superadmin → lands on dashboard
 *   2. Login with wrong password → stays on login, shows error
 *   3. Logout → back to login
 *   4. Protected route without session → redirected to login
 *   5. Session expired → redirected to /session-expired
 */
import { test, expect, ensureBackendReachable, SUPERADMIN } from "./fixtures";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Auth flow", () => {
  test("superadmin can login and see dashboard", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    // After login we should be on dashboard (or whatever redirect param says)
    await expect(page).toHaveURL(/\/dashboard/);
    // The super admin badge in the sidebar footer
    await expect(page.getByText(/SUPER ADMIN/)).toBeVisible();
    // The "REAL" backend indicator (proves we're talking to NestJS, not mock)
    await expect(page.getByText(/REAL/i).first()).toBeVisible();
  });

  test("wrong password shows error and stays on login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.locator('input[autocomplete="username"]').fill(SUPERADMIN.username);
    await page.locator('input[autocomplete="current-password"]').fill("definitely-wrong-password");
    await page.waitForTimeout(200);
    await page.locator('button[type="submit"]').click();
    // Should still be on /login
    await expect(page).toHaveURL(/\/login/);
    // Some kind of error message visible (toast or inline)
    await expect(page.getByText(/รหัสผ่าน|invalid|error|ไม่ถูกต้อง/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("login form actually logs in (regression for /auth/login 400 VALIDATION_ERROR)", async ({
    page,
  }) => {
    // Regression: the form used to send `remember: true` in the login payload.
    // The real backend rejects that with HTTP 400 "property remember should not
    // exist", which silently broke form-based login. This test fills the form
    // (rather than using the API-direct fixture) and asserts we land on /dashboard.
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.locator('input[autocomplete="username"]').fill(SUPERADMIN.username);
    await page.locator('input[autocomplete="current-password"]').fill(SUPERADMIN.password);
    // Tick the "remember me" checkbox — this is what was triggering the 400.
    // (The label text is "จำฉันไว้ในระบบ"; we click the wrapping <label>.)
    await page.getByText(/จำฉันไว้ในระบบ/).click().catch(() => undefined);
    await page.locator('button[type="submit"]').click();
    // Should land on /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    // And the sidebar SUPER ADMIN indicator should be visible
    await expect(page.getByText(/SUPER ADMIN/)).toBeVisible({ timeout: 10_000 });
  });

  test("logout returns to login", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();
    // Wait for any in-flight login success toast to clear so it doesn't
    // intercept the click on the user menu.
    await page.waitForTimeout(2_500);
    // Open user menu and click logout
    await page.getByRole("button", { name: /เมนูผู้ใช้งาน/i }).click();
    await page.getByRole("menuitem", { name: /ออกจากระบบ/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected route without session redirects to login", async ({ page }) => {
    // Start with a clean context (no localStorage session)
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Should land on /login with a redirect param
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("clearing tokens while logged in redirects to session-expired", async ({
    page,
    loginAsSuperAdmin,
  }) => {
    // Log in normally (sidebar should be visible)
    await loginAsSuperAdmin();
    await expect(page.getByText("REAL").first()).toBeVisible({ timeout: 15_000 });

    // Wipe tokens from storage but keep the user object. Zustand persist
    // re-hydrates from localStorage on the next page load, so we set
    // isAuthenticated = false. The user object is kept so the redirect
    // target is /session-expired (not /login).
    await page.evaluate(() => {
      const key = "admin.auth.token";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      parsed.state.expiresAt = null;
      parsed.state.isAuthenticated = false;
      // user is intentionally kept
      localStorage.setItem(key, JSON.stringify(parsed));
    });

    // Navigate to a protected route. admin-shell guard sees isAuthenticated=false
    // but user is still present, so it redirects to /session-expired.
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/session-expired/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/session-expired/);
    await expect(page.getByText("เซสชันหมดอายุ")).toBeVisible({ timeout: 5_000 });
  });
});
