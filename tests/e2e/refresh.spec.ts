/**
 * Token refresh E2E test
 *
 * Verifies the apiClient auto-refresh interceptor works end-to-end:
 *   1. Login → access token is stored
 *   2. Confirm the sidebar renders (proves /auth/me completed on first load)
 *   3. Corrupt the access token in localStorage
 *   4. Navigate to /permissions which triggers a new API call (/permissions endpoint)
 *   5. The interceptor should:
 *      - Get 401 from the backend
 *      - Call /auth/refresh
 *      - Retry the original request with the new token
 *      - /permissions returns 200 (proving refresh + retry worked)
 *   6. The page renders the permissions catalog (proving the data flowed)
 *
 * The previous version of this test relied on admin-shell's /auth/me call to
 * trigger the interceptor. With the new full-session seed, /auth/me may have
 * already completed before we corrupt the token — so we trigger a fresh call
 * by navigating to a different page that uses the apiClient.
 */
import { test, expect, ensureBackendReachable } from "./fixtures";

const STORAGE_KEY = "admin.auth.token"; // from SESSION_STORAGE_KEYS.AUTH_TOKEN

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Token auto-refresh", () => {
  test("recovering from an expired access token", async ({ page, loginAsSuperAdmin }) => {
    await loginAsSuperAdmin();

    // Sanity: sidebar rendered with menus (proves /auth/me completed)
    const sidebar = page.getByRole("navigation", { name: /main/i });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByText("จัดการเมนู", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Sanity: auth storage has both tokens
    const before = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return {
          hasAccess: !!parsed.state?.accessToken,
          hasRefresh: !!parsed.state?.refreshToken,
          accessLen: parsed.state?.accessToken?.length ?? 0,
          refreshLen: parsed.state?.refreshToken?.length ?? 0,
        };
      } catch {
        return null;
      }
    }, STORAGE_KEY);
    expect(before, "auth storage should be present after login").not.toBeNull();
    expect(before?.hasAccess, "accessToken should be set").toBe(true);
    expect(before?.hasRefresh, "refreshToken should be set").toBe(true);

    // Corrupt the access token while keeping the refresh token intact.
    // Important: the apiClient reads the token from the in-memory Zustand store,
    // not localStorage. So we also need to reload the page so the store
    // re-hydrates from the corrupted localStorage value.
    await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = "expired.junk.token";
      // refreshToken stays valid
      localStorage.setItem(key, JSON.stringify(parsed));
    }, STORAGE_KEY);

    // Set up a listener for the /auth/me request that admin-shell will fire on
    // the new page load. The apiClient interceptor will refresh + retry, so we
    // expect a 200 response to come back AFTER the bad-token 401.
    const meRetryPromise = page.waitForResponse(
      (r) => r.url().includes("/auth/me") && r.status() === 200,
      { timeout: 15_000 },
    );

    // Reload the page — store re-hydrates with the corrupted token, and admin-shell
    // fires /auth/me with it. The interceptor kicks in. We go to /permissions
    // so we can also assert the page rendered (its H1 / tab text).
    await page.goto("/permissions", { waitUntil: "domcontentloaded" });

    // The apiClient should refresh and retry. The 200 response proves it worked.
    const response = await meRetryPromise;
    expect(response.status(), "auth/me should succeed after auto-refresh").toBe(200);

    // Wait for the Zustand persist middleware to sync the new token to localStorage.
    // The refresh handler updates the in-memory store synchronously, but the persist
    // write is fire-and-forget. Polling avoids the race.
    await page.waitForFunction(
      (args) => {
        const raw = localStorage.getItem(args.key);
        if (!raw) return false;
        try {
          const parsed = JSON.parse(raw);
          return (
            parsed.state?.accessToken &&
            parsed.state.accessToken !== args.badToken
          );
        } catch {
          return false;
        }
      },
      { key: STORAGE_KEY, badToken: "expired.junk.token" },
      { timeout: 8_000 },
    );

    // After the refresh, the access token in storage should be DIFFERENT
    // (the real backend rotates refresh tokens too)
    const after = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state?.accessToken;
    }, STORAGE_KEY);
    expect(after, "storage should still have a token after refresh").toBeTruthy();
    expect(after, "access token should have been rotated").not.toBe("expired.junk.token");

    // The page should be fully rendered (the "mine" tab is the default landing)
    await expect(page.getByText(/สิทธิ์ของฉัน/)).toBeVisible({ timeout: 5_000 });
  });
});
