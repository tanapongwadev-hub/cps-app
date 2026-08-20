#!/usr/bin/env node
/**
 * Test the real-backend login flow end-to-end.
 * Mirrors what the frontend apiClient does:
 *   - POST {NEXT_PUBLIC_API_BASE_URL}/auth/login with { username, password }
 *   - Expect envelope { success: true, message, data: { authentication, user, accessControl } }
 *   - Verify required fields exist
 *
 * Usage:
 *   node scripts/test-api-login.cjs
 *   node scripts/test-api-login.cjs --username=foo --password=bar
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
const argv = process.argv.slice(2);
const argMap = Object.fromEntries(
  argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? "true"];
    }),
);

const USERNAME = argMap.username || "superadmin";
const PASSWORD = argMap.password || "change-me-secure-password";

function fail(msg, extra) {
  console.error(`✗ ${msg}`);
  if (extra !== undefined) console.error(JSON.stringify(extra, null, 2));
  process.exit(1);
}

function ok(msg, extra) {
  console.log(`✓ ${msg}`);
  if (extra !== undefined) console.log(JSON.stringify(extra, null, 2));
}

(async () => {
  const url = `${BASE}/auth/login`;
  console.log(`\nPOST ${url}`);
  console.log(`Body: { username: "${USERNAME}", password: "***" }\n`);

  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const ms = Date.now() - start;

  if (!res.ok) {
    const text = await res.text();
    fail(`HTTP ${res.status} (${ms}ms)`, text);
  }
  ok(`HTTP ${res.status} (${ms}ms)`);

  const envelope = await res.json();
  if (envelope.success !== true) fail("envelope.success is not true", envelope);
  ok("envelope.success = true");

  const data = envelope.data;
  if (!data) fail("envelope.data is missing", envelope);
  ok("envelope.data present");

  // authentication
  if (!data.authentication) fail("data.authentication missing", data);
  const auth = data.authentication;
  for (const k of ["accessToken", "refreshToken", "tokenType"]) {
    if (!auth[k]) fail(`data.authentication.${k} missing`, auth);
  }
  ok("data.authentication { accessToken, refreshToken, tokenType }");

  // user
  if (!data.user) fail("data.user missing", data);
  const user = data.user;
  for (const k of ["id", "username", "firstName", "lastName", "email"]) {
    if (!user[k]) fail(`data.user.${k} missing`, user);
  }
  ok(`data.user { id=${user.id}, username=${user.username}, isSuperAdmin=${user.isSuperAdmin} }`);

  // accessControl
  if (!data.accessControl) fail("data.accessControl missing", data);
  const ac = data.accessControl;
  if (!Array.isArray(ac.permissions)) fail("data.accessControl.permissions is not an array", ac);
  if (!Array.isArray(ac.menus)) fail("data.accessControl.menus is not an array", ac);
  ok(`data.accessControl { ${ac.permissions.length} permissions, ${ac.menus.length} top-level menus }`);

  console.log("\nSample permissions:");
  console.log("  " + ac.permissions.slice(0, 5).join(", "));
  console.log("\nSample menu codes:");
  console.log("  " + ac.menus.map((m) => m.code).join(", "));

  console.log("\n🎉 All frontend expectations satisfied. Login flow is wired correctly.\n");
})().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
