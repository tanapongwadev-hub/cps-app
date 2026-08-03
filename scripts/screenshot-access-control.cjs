/**
 * Take screenshots of the Access Control pages for the user manual.
 * Uses Playwright (already installed for E2E tests).
 */
const { chromium } = require("../node_modules/.pnpm/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "docs", "manual-screenshots");
const APP_URL = "http://localhost:3000";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
  {
    id: "01-users-list",
    name: "01-หน้ารายชื่อผู้ใช้งาน",
    path: "/user-management/users",
  },
  {
    id: "02-users-create",
    name: "02-ฟอร์มเพิ่มผู้ใช้งาน",
    path: "/user-management/users",
    action: "open-create",
  },
  {
    id: "03-departments-list",
    name: "03-หน้ารายการแผนก",
    path: "/user-management/departments",
  },
  {
    id: "04-departments-create",
    name: "04-ฟอร์มเพิ่มแผนก",
    path: "/user-management/departments",
    action: "open-create",
  },
  {
    id: "05-roles-list",
    name: "05-หน้ารายการบทบาท",
    path: "/user-management/roles",
  },
  {
    id: "06-roles-create",
    name: "06-ฟอร์มเพิ่มบทบาท",
    path: "/user-management/roles",
    action: "open-create",
  },
  {
    id: "07-permissions",
    name: "07-หน้าจัดการสิทธิ์",
    path: "/permissions",
  },
  {
    id: "08-sessions",
    name: "08-หน้าจัดการเซสชัน",
    path: "/sessions",
  },
  {
    id: "09-sidebar-access-control",
    name: "09-เมนู Access Control ใน Sidebar",
    path: "/dashboard",
    action: "expand-sidebar",
  },
];

async function login(page) {
  const resp = await page.request.post(
    "http://localhost:3001/api/v1/auth/login",
    {
      data: { username: "superadmin", password: "change-me-secure-password" },
    }
  );
  if (!resp.ok()) throw new Error("login failed: " + resp.status());
  const env = await resp.json();
  const auth = env.data.authentication;
  const expiresAt = Date.now() + (auth.expiresIn * 1000 || 3600 * 1000);

  await page.goto(APP_URL + "/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ payload }) => {
      localStorage.setItem(
        "admin.auth.token",
        JSON.stringify({ state: payload, version: 0 })
      );
    },
    {
      payload: {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        expiresAt,
        isAuthenticated: true,
        user: env.data.user,
        accessControl: env.data.accessControl,
        permissions: env.data.accessControl.permissions,
        menu: env.data.accessControl.menus,
      },
    }
  );
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "th-TH",
  });
  const page = await context.newPage();
  await login(page);

  for (const spec of PAGES) {
    try {
      await page.goto(APP_URL + spec.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      // Wait for any loading skeletons to disappear (max 10s)
      await page
        .waitForFunction(
          () => document.querySelectorAll('[class*="skeleton" i], [class*="animate-pulse" i]').length < 2,
          { timeout: 10000 }
        )
        .catch(() => {});
      await page.waitForTimeout(1500); // extra settle for data

      if (spec.action === "open-create") {
        const addBtn = page.locator('button:has-text("เพิ่ม")').first();
        if (await addBtn.count() > 0) {
          await addBtn.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(1200);
        }
      }

      const filename = `${spec.id}.png`;
      await page.screenshot({
        path: path.join(OUT_DIR, filename),
        fullPage: false,
      });
      console.log("✓", filename, "—", spec.name);
    } catch (err) {
      console.log("✗", spec.id, "—", err.message);
    }
  }

  await browser.close();
  console.log("\nScreenshots saved to:", OUT_DIR);
})();
