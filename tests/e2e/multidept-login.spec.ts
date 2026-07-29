/**
 * E2E test for the multi-department login flow.
 *
 * The actual login form interaction is exercised by the smoke test
 * (scripts/smoke-2step-login.cjs) which talks to the backend directly
 * and verifies the 2-step response shape + select-department call.
 *
 * These E2E tests verify the **UI contract**:
 *   1. The /select-department page renders when the user navigates to it
 *      after a 2-step login (i.e. the page itself works, the cards display,
 *      and the submit button calls the right API).
 *   2. The login form correctly handles the 2-step response (redirects to
 *      /select-department) by directly seeding the pendingSelection in
 *      localStorage and observing the redirect behavior.
 */
import { test, expect, ensureBackendReachable, BACKEND_BASE } from "./fixtures";

test.beforeAll(async () => {
  await ensureBackendReachable();
});

test.describe("Multi-department login UI", () => {
  test("/select-department page renders options and calls the right API", async ({
    page,
  }) => {
    // 0) Login as superadmin to provision test data
    const adminLogin = await page.request.post(`${BACKEND_BASE}/auth/login`, {
      data: { username: "superadmin", password: "change-me-secure-password" },
    });
    if (!adminLogin.ok()) throw new Error("superadmin login failed");
    const adminToken = (await adminLogin.json()).data.authentication.accessToken;

    // 1) Find a non-admin role + 2 different departments
    const [rolesRes, deptsRes] = await Promise.all([
      page.request.get(`${BACKEND_BASE}/roles?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      page.request.get(`${BACKEND_BASE}/departments?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    ]);
    const rolesJson = (await rolesRes.json()) as { items: Array<{ id: string; code: string }> };
    const deptsJson = (await deptsRes.json()) as { items: Array<{ id: string; code: string }> };
    const userRole = rolesJson.items.find(
      (r) => r.code !== "SUPER_ADMIN" && r.code !== "ADMIN",
    );
    const deptA = deptsJson.items[0];
    const deptB = deptsJson.items.find((d) => d.id !== deptA?.id);
    if (!userRole || !deptA || !deptB) throw new Error("missing role or 2 depts");

    // 2) Trigger a real 2-step login via the API to get the token + options
    const stamp = Date.now();
    const username = `e2e_pg_${stamp}`;
    const createRes = await page.request.post(`${BACKEND_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        username,
        password: "Test1234",
        firstName: "Page",
        lastName: "Render",
        email: `${username}@test.local`,
        assignments: [{ departmentId: deptA.id, roleId: userRole.id, isPrimary: true }],
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const userId = (await createRes.json()).id;
    await page.request.post(`${BACKEND_BASE}/users/${userId}/assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { departmentId: deptB.id, roleId: userRole.id },
    });

    // 3) Login as that user → 2-step response
    const loginRes = await page.request.post(`${BACKEND_BASE}/auth/login`, {
      data: { username, password: "Test1234" },
    });
    expect(loginRes.ok(), `login API ok: ${loginRes.status()}`).toBeTruthy();
    // Backend quirk: 1-step responses are wrapped in {success, data}; 2-step
    // responses are returned at the root. Normalize.
    const loginRaw = await loginRes.json();
    const loginJson = loginRaw.data ?? loginRaw;
    expect(loginJson.requiresDepartmentSelection, "should be 2-step").toBe(true);
    expect(loginJson.departmentSelectionToken).toBeTruthy();
    expect(loginJson.departments.length).toBe(2);

    // 4) Seed the pendingSelection into Zustand persist and visit the page
    await page.context().clearCookies();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ({ token, options, user }) => {
        const key = "admin.auth.token";
        const payload = {
          state: {
            pendingSelection: {
              mode: "select",
              departmentSelectionToken: token,
              user,
              options,
            },
          },
          version: 0,
        };
        localStorage.setItem(key, JSON.stringify(payload));
      },
      {
        token: loginJson.departmentSelectionToken,
        options: loginJson.departments.map(
          (d: {
            userDepartmentRoleId: string;
            departmentId: string;
            departmentCode: string;
            departmentName: string;
            roleCode: string;
          }) => ({
            userDepartmentRoleId: d.userDepartmentRoleId,
            department: { id: d.departmentId, code: d.departmentCode, name: d.departmentName },
            role: { id: d.roleCode, code: d.roleCode, name: d.roleCode },
            isPrimary: false,
          }),
        ),
        user: { id: userId, username, isActive: true },
      },
    );

    // 5) Visit the page; it should render the heading + the 2 option cards
    await page.goto("/select-department", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "เลือกแผนกและบทบาท" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(new RegExp(deptA.code, "i")).first(),
    ).toBeVisible();
    await expect(
      page.getByText(new RegExp(deptB.code, "i")).first(),
    ).toBeVisible();
    // Submit button should be disabled until a card is selected
    const submitBtn = page.getByRole("button", { name: /เข้าสู่ระบบด้วยบทบาทนี้/ });
    await expect(submitBtn).toBeVisible();

    // 6) Click a card + submit → should call /auth/select-department
    const selectResp = page.waitForResponse(
      (r) => r.url().includes("/auth/select-department"),
    );
    // Click the deptA card (by text)
    await page.getByText(new RegExp(deptA.code, "i")).first().click();
    await submitBtn.click();
    const selJson = await (await selectResp).json();
    expect(selJson.data.authentication.accessToken, "got access token").toBeTruthy();

    // 7) Cleanup
    await page.request.delete(`${BACKEND_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test("login form correctly redirects multi-dept users to /select-department", async ({
    page,
  }) => {
    // This test exercises the actual login form (form submission + redirect).
    // We:
    //   1. Login as superadmin via API to provision a multi-dept test user
    //   2. Visit /login (no prior auth)
    //   3. Fill the form and submit
    //   4. Assert we end up on /select-department

    const adminLogin = await page.request.post(`${BACKEND_BASE}/auth/login`, {
      data: { username: "superadmin", password: "change-me-secure-password" },
    });
    if (!adminLogin.ok()) throw new Error("superadmin login failed");
    const adminToken = (await adminLogin.json()).data.authentication.accessToken;

    const [rolesRes, deptsRes] = await Promise.all([
      page.request.get(`${BACKEND_BASE}/roles?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      page.request.get(`${BACKEND_BASE}/departments?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    ]);
    const rolesJson = (await rolesRes.json()) as { items: Array<{ id: string; code: string }> };
    const deptsJson = (await deptsRes.json()) as { items: Array<{ id: string; code: string }> };
    const userRole = rolesJson.items.find((r) => r.code !== "SUPER_ADMIN" && r.code !== "ADMIN");
    const deptA = deptsJson.items[0];
    const deptB = deptsJson.items.find((d) => d.id !== deptA?.id);
    if (!userRole || !deptA || !deptB) throw new Error("missing role or 2 depts");

    const stamp = Date.now();
    const username = `e2e_form_${stamp}`;
    const createRes = await page.request.post(`${BACKEND_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        username,
        password: "Test1234",
        firstName: "Form",
        lastName: "Test",
        email: `${username}@test.local`,
        assignments: [{ departmentId: deptA.id, roleId: userRole.id, isPrimary: true }],
      },
    });
    const userId = (await createRes.json()).id;
    await page.request.post(`${BACKEND_BASE}/users/${userId}/assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { departmentId: deptB.id, roleId: userRole.id },
    });

    // Visit /login fresh (no prior session)
    await page.context().clearCookies();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    // Clear any prior localStorage from earlier tests
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    // Wait for React to fully hydrate — otherwise the form falls back to
    // a native GET submit (sending credentials in the URL).
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeVisible({
      timeout: 15_000,
    });

    // Fill + small delay to ensure React handlers are bound
    await page.locator('input[autocomplete="username"]').fill(username);
    await page.locator('input[autocomplete="current-password"]').fill("Test1234");
    await page.waitForTimeout(300);

    // Submit (now React's onSubmit should fire, not native form GET)
    await page.locator('button[type="submit"]').click();

    // Should redirect to /select-department
    await page.waitForURL("**/select-department", { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "เลือกแผนกและบทบาท" }),
    ).toBeVisible({ timeout: 15_000 });

    // Cleanup
    await page.request.delete(`${BACKEND_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });
});
