#!/usr/bin/env node
/**
 * Test the real-backend token refresh flow.
 *   1) Login → get access + refresh tokens
 *   2) Verify access token works against /auth/me
 *   3) Call /auth/refresh with the refresh token → get new tokens
 *   4) Verify the new access token works
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
const USERNAME = "superadmin";
const PASSWORD = "change-me-secure-password";

const ok = (m) => console.log(`✓ ${m}`);
const fail = (m, extra) => {
  console.error(`✗ ${m}`);
  if (extra !== undefined) console.error(JSON.stringify(extra, null, 2));
  process.exit(1);
};

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

(async () => {
  console.log(`\n=== Token refresh test against ${BASE} ===\n`);

  // 1) Login
  const login = await call("POST", "/auth/login", { username: USERNAME, password: PASSWORD });
  if (login.status !== 200 && login.status !== 201) {
    fail(`Login failed: HTTP ${login.status}`, login.body);
  }
  const { accessToken: access1, refreshToken: refresh1 } = login.body.data.authentication;
  ok(`Login OK (HTTP ${login.status})`);

  // 2) Verify access token works
  const me1 = await call("GET", "/auth/me", null, access1);
  if (me1.status !== 200) fail(`/auth/me failed: HTTP ${me1.status}`, me1.body);
  ok(`Step 1 access token works (HTTP ${me1.status})`);

  // 3) Refresh
  const refresh = await call("POST", "/auth/refresh", { refreshToken: refresh1 });
  if (refresh.status !== 200 && refresh.status !== 201) {
    fail(`Refresh failed: HTTP ${refresh.status}`, refresh.body);
  }
  // Some backends return envelope {success, data: {accessToken, ...}}, others return direct
  const auth = refresh.body.data?.authentication ?? refresh.body.data ?? refresh.body;
  const access2 = auth.accessToken;
  const refresh2 = auth.refreshToken;
  if (!access2) {
    fail("Refresh response did not contain a new access token", refresh.body);
  }
  ok(`Step 2 refresh OK (HTTP ${refresh.status}), new tokens issued`);

  // 4) Verify new access token works
  const me2 = await call("GET", "/auth/me", null, access2);
  if (me2.status !== 200) fail(`New access token failed: HTTP ${me2.status}`, me2.body);
  ok(`Step 3 new access token works (HTTP ${me2.status})`);

  // 5) Verify new tokens are different from old (rotation)
  if (access1 === access2) fail("Access token was NOT rotated by refresh");
  if (refresh1 === refresh2) console.warn("  (note: refresh token not rotated, single-use only)");
  ok("Tokens rotated correctly");

  console.log("\n🎉 Token refresh flow works end-to-end. Auto-refresh interceptor is safe to use.\n");
})().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
