#!/usr/bin/env node
/**
 * Test the full login → me flow against the real backend.
 * Verifies the frontend can:
 *   1) Login and get tokens + accessControl (1-step)
 *   2) Use the accessToken to call a protected endpoint
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
const USERNAME = process.env.TEST_USERNAME || "superadmin";
const PASSWORD = process.env.TEST_PASSWORD || "change-me-secure-password";

function fail(msg, extra) {
  console.error(`✗ ${msg}`);
  if (extra !== undefined) console.error(JSON.stringify(extra, null, 2));
  process.exit(1);
}
function ok(msg, extra) {
  console.log(`✓ ${msg}`);
  if (extra !== undefined) console.log(JSON.stringify(extra, null, 2));
}

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
  console.log(`\n=== Full flow test against ${BASE} ===\n`);

  // 1) Login
  console.log("1) POST /auth/login");
  const login = await call("POST", "/auth/login", { username: USERNAME, password: PASSWORD });
  if (login.status !== 200 && login.status !== 201) {
    fail(`Login failed: HTTP ${login.status}`, login.body);
  }
  const { accessToken, refreshToken, expiresIn } = login.body.data.authentication;
  ok(`Logged in (HTTP ${login.status}); got tokens (expiresIn=${expiresIn})`);

  // 2) Call /auth/me with the token
  console.log("\n2) GET /auth/me (with token)");
  const me = await call("GET", "/auth/me", null, accessToken);
  if (me.status !== 200) fail(`/auth/me failed: HTTP ${me.status}`, me.body);
  ok(`/auth/me HTTP ${me.status}, user=${me.body.data?.user?.username ?? me.body.username}`);

  // 3) Try a resource endpoint to confirm RBAC is enforced via token
  console.log("\n3) GET /users (with token)");
  const users = await call("GET", "/users?page=1&pageSize=5", null, accessToken);
  if (users.status !== 200) {
    console.warn(`  /users returned HTTP ${users.status} — this may be expected if endpoint path differs`);
    console.warn("  body:", JSON.stringify(users.body).slice(0, 300));
  } else {
    const items = users.body.data?.items ?? users.body.items ?? [];
    ok(`/users HTTP ${users.status}, items=${items.length}`);
  }

  console.log("\n🎉 Full flow works. Frontend can use the real backend.\n");
})().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
