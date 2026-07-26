/**
 * Shared fixtures for E2E tests.
 *
 * Provides:
 *   - `loginAsSuperAdmin` — does the full login flow with the real backend
 *   - `loginFresh` — a generic login that takes any credentials
 *   - backend reachability check before the suite runs
 *
 * Design notes:
 *   - We log in via the API directly (not the React-Hook-Form login page).
 *     Driving the form via Playwright is flaky because the form may be submitted
 *     before React has hydrated (causes a native GET form submit with credentials
 *     in the URL).
 *   - We seed the FULL session (user + accessControl + tokens) into localStorage.
 *     That way admin-shell renders the sidebar with menus immediately. admin-shell
 *     will still call /auth/me in the background to verify the token; if it fails
 *     the refresh interceptor will recover.
 *   - We then `waitForLoadState("networkidle")` so any in-flight /auth/me /
 *     /menus/tree / /permissions calls from the layout settle before the test
 *     starts asserting.
 */
/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from "@playwright/test";

export const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

export const SUPERADMIN = {
  username: "superadmin",
  password: "change-me-secure-password",
} as const;

interface LoginEnvelope {
  data?: {
    authentication: {
      accessToken: string;
      refreshToken: string;
      tokenType: "Bearer";
      expiresIn: number | string;
    };
    user: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      fullName?: string;
      email?: string;
      isSuperAdmin?: boolean;
      roles?: Array<{ id: string; code: string; name: string }>;
      departments?: Array<{ id: string; code: string; name: string }>;
    };
    accessControl: {
      menus: unknown[];
      permissions: string[];
      userDepartmentRoleId?: string;
    };
  };
}

export const test = base.extend<{
  loginAsSuperAdmin: () => Promise<void>;
  loginFresh: (creds: { username: string; password: string }) => Promise<void>;
}>({
  loginAsSuperAdmin: async ({ page }, use) => {
    await use(async () => {
      await performLogin(page, SUPERADMIN, true);
    });
  },
  loginFresh: async ({ page }, use) => {
    await use(async (creds) => {
      await performLogin(page, creds, true);
    });
  },
});

/**
 * Login flow shared by `loginAsSuperAdmin` and `loginFresh`.
 *
 * @param page        - Playwright page
 * @param creds       - credentials to log in with
 * @param seedFullSession - if true, seed user + accessControl + tokens; if false,
 *                          only seed tokens (used by tests that want to verify
 *                          /auth/me population).
 */
async function performLogin(
  page: Page,
  creds: { username: string; password: string },
  seedFullSession: boolean,
): Promise<void> {
  // 1. Login via API (uses the same origin the page will be on, so cookies/origin match)
  const resp = await page.request.post(`${BACKEND_BASE}/auth/login`, {
    data: { username: creds.username, password: creds.password },
  });
  if (!resp.ok()) {
    throw new Error(
      `Login API failed: ${resp.status()} ${(await resp.text()).slice(0, 200)}`,
    );
  }
  const env = (await resp.json()) as LoginEnvelope;
  const auth = env.data?.authentication;
  if (!auth?.accessToken) {
    throw new Error("Login response missing authentication");
  }

  // 2. Visit /login so localStorage is scoped to the same origin as the app
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // 3. Seed the auth blob Zustand's persist middleware uses
  const expiresAt = Date.now() + parseExpiresInMs(auth.expiresIn);
  const state: Record<string, unknown> = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt,
    isAuthenticated: true,
  };

  if (seedFullSession && env.data?.user && env.data?.accessControl) {
    state.user = env.data.user;
    state.accessControl = env.data.accessControl;
    state.permissions = env.data.accessControl.permissions;
    state.menu = env.data.accessControl.menus;
  }

  await page.evaluate(
    ({ payload }) => {
      const key = "admin.auth.token";
      localStorage.setItem(key, JSON.stringify({ state: payload, version: 0 }));
    },
    { payload: state },
  );

  // 4. Navigate to dashboard. /auth/me will fire on admin-shell mount; wait
  //    for network to settle so subsequent assertions don't race with hydration.
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 });
}

/** Parse "15m" / "900" / "1h" to milliseconds. */
function parseExpiresInMs(
  raw: number | string | undefined,
  fallbackSeconds = 3600,
): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw * 1000;
  if (typeof raw === "string") {
    const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(raw.trim());
    if (m) {
      const n = Number(m[1]);
      const unit = (m[2] ?? "s").toLowerCase();
      const mult =
        unit === "ms"
          ? 1
          : unit === "s"
            ? 1000
            : unit === "m"
              ? 60_000
              : unit === "h"
                ? 3_600_000
                : 86_400_000;
      return n * mult;
    }
    const asNum = Number(raw);
    if (Number.isFinite(asNum)) return asNum * 1000;
  }
  return fallbackSeconds * 1000;
}

/**
 * Verify the backend is reachable. Skips the suite with a helpful message
 * if it isn't, so contributors don't get confused.
 */
export async function ensureBackendReachable(): Promise<void> {
  try {
    const r = await fetch(`${BACKEND_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SUPERADMIN),
    });
    if (!r.ok && r.status !== 400) {
      throw new Error(`Backend returned ${r.status}`);
    }
  } catch (err) {
    throw new Error(
      `Backend not reachable at ${BACKEND_BASE}.\n` +
        `Make sure the NestJS API is running and accessible.\n` +
        `Original error: ${(err as Error).message}`,
    );
  }
}

/**
 * Lightweight helper for tests that need to hit the backend outside the page
 * context (e.g. read users / departments for assertions). Uses the page's
 * request context so cookies/origin match.
 */
export async function apiGet<T>(
  page: Page,
  path: string,
): Promise<T> {
  const res = await page.request.get(`${BACKEND_BASE}${path}`);
  if (!res.ok()) {
    throw new Error(`GET ${path} failed: ${res.status()} ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export { expect, type Page };
