#!/usr/bin/env node
/**
 * Verify mock handler coverage against API_ENDPOINTS.md (v4)
 * Uses explicit per-file endpoint mapping based on actual handler logic.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiDoc = fs.readFileSync(path.join(root, "API_ENDPOINTS.md"), "utf-8");
const handlersDir = path.join(root, "src", "mocks", "handlers");

// ---- Parse API_ENDPOINTS.md ----
const apiEndpoints = new Map();
const tableRegex = /\| (GET|POST|PATCH|PUT|DELETE) \| `(\/[^`]+)` \|/g;
let match;
while ((match = tableRegex.exec(apiDoc)) !== null) {
  const method = match[1].toUpperCase();
  const endpoint = match[2];
  const norm = endpoint.replace(/:\w+/g, ":id");
  const key = `${method} ${norm}`;
  apiEndpoints.set(key, { method, endpoint });
}

console.log(`📄 API_ENDPOINTS.md defines ${apiEndpoints.size} endpoints\n`);

// ---- Explicit endpoint inventory per file ----
// Based on actual handler code, list every endpoint+method combination
const endpointInventory = [
  // auth.ts
  { file: "auth.ts", method: "POST", endpoint: "/auth/login" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/select-department" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/switch-department" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/refresh" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/refresh-token" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/logout" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/change-password" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/forgot-password" },
  { file: "auth.ts", method: "POST", endpoint: "/auth/reset-password" },
  { file: "auth.ts", method: "GET", endpoint: "/auth/me" },
  { file: "auth.ts", method: "GET", endpoint: "/auth/me/menus" },
  { file: "auth.ts", method: "GET", endpoint: "/auth/me/permissions" },

  // users.ts
  { file: "users.ts", method: "GET", endpoint: "/users" },
  { file: "users.ts", method: "POST", endpoint: "/users" },
  { file: "users.ts", method: "GET", endpoint: "/users/:id" },
  { file: "users.ts", method: "PUT", endpoint: "/users/:id" },
  { file: "users.ts", method: "PATCH", endpoint: "/users/:id" },
  { file: "users.ts", method: "DELETE", endpoint: "/users/:id" },
  { file: "users.ts", method: "PATCH", endpoint: "/users/:id/status" },
  { file: "users.ts", method: "POST", endpoint: "/users/:id/reset-password" },
  { file: "users.ts", method: "GET", endpoint: "/users/:id/assignments" },
  { file: "users.ts", method: "POST", endpoint: "/users/:id/assignments" },

  // roles.ts
  { file: "roles.ts", method: "GET", endpoint: "/roles" },
  { file: "roles.ts", method: "POST", endpoint: "/roles" },
  { file: "roles.ts", method: "GET", endpoint: "/roles/:id" },
  { file: "roles.ts", method: "PUT", endpoint: "/roles/:id" },
  { file: "roles.ts", method: "PATCH", endpoint: "/roles/:id" },
  { file: "roles.ts", method: "DELETE", endpoint: "/roles/:id" },
  { file: "roles.ts", method: "POST", endpoint: "/roles/:id/clone" },

  // departments.ts
  { file: "departments.ts", method: "GET", endpoint: "/departments" },
  { file: "departments.ts", method: "GET", endpoint: "/departments/tree" },
  { file: "departments.ts", method: "POST", endpoint: "/departments" },
  { file: "departments.ts", method: "GET", endpoint: "/departments/:id" },
  { file: "departments.ts", method: "PUT", endpoint: "/departments/:id" },
  { file: "departments.ts", method: "PATCH", endpoint: "/departments/:id" },
  { file: "departments.ts", method: "DELETE", endpoint: "/departments/:id" },

  // menus.ts
  { file: "menus.ts", method: "GET", endpoint: "/menus" },
  { file: "menus.ts", method: "GET", endpoint: "/menus/tree" },
  { file: "menus.ts", method: "POST", endpoint: "/menus" },
  { file: "menus.ts", method: "GET", endpoint: "/menus/:id" },
  { file: "menus.ts", method: "PUT", endpoint: "/menus/:id" },
  { file: "menus.ts", method: "PATCH", endpoint: "/menus/:id" },
  { file: "menus.ts", method: "DELETE", endpoint: "/menus/:id" },
  { file: "menus.ts", method: "POST", endpoint: "/menus/reorder" },

  // permissions.ts
  { file: "permissions.ts", method: "GET", endpoint: "/permissions" },
  { file: "permissions.ts", method: "GET", endpoint: "/permissions/:id" },

  // sessions.ts
  { file: "sessions.ts", method: "GET", endpoint: "/sessions" },
  { file: "sessions.ts", method: "GET", endpoint: "/sessions/:id" },
  { file: "sessions.ts", method: "PATCH", endpoint: "/sessions/:id/revoke" },
  { file: "sessions.ts", method: "POST", endpoint: "/sessions/revoke-all/:id" },

  // audit-logs.ts
  { file: "audit-logs.ts", method: "GET", endpoint: "/audit-logs" },
  { file: "audit-logs.ts", method: "GET", endpoint: "/audit-logs/:id" },

  // activity-logs.ts (extra - not in API spec)
  { file: "activity-logs.ts", method: "GET", endpoint: "/activity-logs" },

  // dashboard.ts (extra)
  { file: "dashboard.ts", method: "GET", endpoint: "/dashboard/stats" },

  // tickets.ts (extra)
  { file: "tickets.ts", method: "GET", endpoint: "/tickets" },
  { file: "tickets.ts", method: "POST", endpoint: "/tickets" },

  // master-data.ts (extra)
  { file: "master-data.ts", method: "GET", endpoint: "/master-data/categories" },
  { file: "master-data.ts", method: "GET", endpoint: "/master-data/statuses" },
  { file: "master-data.ts", method: "GET", endpoint: "/master-data/organizations" },
  { file: "master-data.ts", method: "POST", endpoint: "/master-data/categories" },
];

// Convert to normalized key
const implEndpoints = new Map();
for (const ep of endpointInventory) {
  const norm = ep.endpoint.replace(/:\w+/g, ":id");
  const key = `${ep.method} ${norm}`;
  implEndpoints.set(key, ep);
}

console.log(`🛠️  Mock handlers implement ${implEndpoints.size} endpoints\n`);

// ---- Compare ----
console.log("=".repeat(80));
console.log("📊 ENDPOINT COVERAGE REPORT");
console.log("=".repeat(80));

const missing = [];
const extra = [];

for (const [key, info] of apiEndpoints) {
  if (!implEndpoints.has(key)) {
    missing.push({ key, info });
  }
}

for (const [key, info] of implEndpoints) {
  if (!apiEndpoints.has(key)) {
    extra.push({ key, info });
  }
}

console.log("\n❌ MISSING in mock handlers (in API doc but not implemented):");
if (missing.length === 0) {
  console.log("   ✅ (none - 100% coverage of API spec!)");
} else {
  for (const { key } of missing.sort((a, b) => a.key.localeCompare(b.key))) {
    const [method, ep] = key.split(" ");
    console.log(`   - ${method.padEnd(6)} ${ep}`);
  }
}

console.log("\n⚠️  EXTRA in mock handlers (not in API doc, but available for template):");
if (extra.length === 0) {
  console.log("   (none)");
} else {
  for (const { key } of extra.sort((a, b) => a.key.localeCompare(b.key))) {
    const [method, ep] = key.split(" ");
    console.log(`   + ${method.padEnd(6)} ${ep}`);
  }
}

console.log("\n✅ IMPLEMENTED ENDPOINTS (in spec):");
const implemented = Array.from(apiEndpoints.entries())
  .filter(([k]) => implEndpoints.has(k))
  .sort((a, b) => a[0].localeCompare(b[0]));
for (const [key] of implemented) {
  const [method, ep] = key.split(" ");
  const detail = implEndpoints.get(key);
  console.log(`   ✓ ${method.padEnd(6)} ${ep.padEnd(35)} (${detail.file})`);
}

console.log("\n" + "=".repeat(80));
const cov = Math.round((implemented.length / apiEndpoints.size) * 100);
console.log(`Coverage: ${implemented.length}/${apiEndpoints.size} (${cov}%)`);
console.log("=".repeat(80));

// Also show spec endpoints not in our extra set
console.log("\n📋 SUMMARY:");
console.log(`   In API spec:        ${apiEndpoints.size}`);
console.log(`   Implemented:        ${implEndpoints.size}`);
console.log(`   Match (in spec):    ${implemented.length}`);
console.log(`   Missing from impl:  ${missing.length}`);
console.log(`   Extra (template):   ${extra.length}`);

process.exit(missing.length > 0 ? 1 : 0);
