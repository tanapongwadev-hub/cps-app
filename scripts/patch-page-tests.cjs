#!/usr/bin/env node
/**
 * One-off script: patch the page.test.tsx files in the features that were
 * refactored to use Container/Presenter so they mock `useAuthStore` (the
 * container now reads permissions from the store, not from <PermissionGuard>).
 *
 * Inserts a `vi.mock("@/stores/auth-store", ...)` block after the existing
 * PermissionGuard mock.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGETS = [
  "src/app/(admin)/master-data/delivery-types/page.test.tsx",
  "src/app/(admin)/master-data/loading-points/page.test.tsx",
  "src/app/(admin)/master-data/material-models/page.test.tsx",
  "src/app/(admin)/master-data/organizations/page.test.tsx",
  "src/app/(admin)/master-data/statuses/page.test.tsx",
  "src/app/(admin)/master-data/suppliers/page.test.tsx",
  "src/app/(admin)/master-data/units/page.test.tsx",
  "src/app/(admin)/master-data/reject-reasons/page.test.tsx",
];

const INSERT = `vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (s: { hasPermission: () => boolean; permissions: string[] }) => unknown) =>
    selector({ hasPermission: () => true, permissions: ["*"] }),
}));`;

// Match the PermissionGuard mock tolerantly (CRLF/LF, optional semicolon).
const GUARD_RE = /vi\.mock\("@\/components\/ui\/permission-guard",[\s\S]*?\}\)\);?/;

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.log("SKIP (missing):", rel);
    continue;
  }
  const src = fs.readFileSync(file, "utf8");
  if (src.includes("vi.mock(\"@/stores/auth-store\"")) {
    console.log("SKIP (already patched):", rel);
    continue;
  }
  const match = src.match(GUARD_RE);
  if (!match) {
    console.log("SKIP (no permission-guard mock):", rel);
    continue;
  }
  const next = src.replace(GUARD_RE, `${match[0]}\n\n${INSERT}`);
  if (next === src) {
    console.log("NO-CHANGE:", rel);
    continue;
  }
  fs.writeFileSync(file, next, "utf8");
  console.log("patched:", rel);
}
