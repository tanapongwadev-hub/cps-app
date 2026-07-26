/**
 * Playwright E2E config
 *
 * Assumes the NestJS backend is running on http://localhost:3001.
 * The Next.js dev server (http://localhost:3000) is auto-started if not
 * already running — Playwright's `webServer` reuses an existing server
 * if the port is responding, so this is safe to run alongside `pnpm dev`.
 *
 * Backend health check: run `pnpm test:api:health` or use the
 * `ensureBackendReachable()` fixture helper before each test.
 *
 * Run:
 *   pnpm test:e2e           - run all e2e tests
 *   pnpm test:e2e:ui        - interactive UI mode
 *   pnpm test:e2e:headed    - headed browser
 *   pnpm test:e2e:debug     - debug mode with inspector
 *   pnpm test:e2e:install   - install Playwright browsers
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry once on CI / when backend was flapping. Locally we keep 0
  // so failures are visible immediately, but a single retry catches
  // transient network blips.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 45_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start the Next.js dev server if not already running. With
  // `reuseExistingServer: true`, Playwright will probe the URL first
  // and skip the spawn if something is already answering.
  webServer: {
    command: "pnpm dev --webpack",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000, // first compile is slow
    stdout: "ignore",
    stderr: "pipe",
  },
});
