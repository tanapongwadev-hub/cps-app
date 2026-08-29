#!/usr/bin/env node
/**
 * One-off script: rewrite `@/types/X` imports to `@/features/<x>/types` after
 * moving type files into their owning features.
 *
 * Run from project root: `node scripts/rewrite-type-imports.cjs`
 *
 * Idempotent — running it twice is a no-op (the new path is a superset of the
 * old substring so the second pass still rewrites; verify with tsc after).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

/** @type {Array<[RegExp, string]>} */
const REWRITES = [
  [/@\/types\/auth(?![/\\])/g, "@/features/auth/types"],
  [/@\/types\/department(?![/\\])/g, "@/features/departments/types"],
  [/@\/types\/menu(?![/\\])/g, "@/features/menus/types"],
  [/@\/types\/permission(?![/\\])/g, "@/features/permissions/types"],
  [/@\/types\/role(?![/\\])/g, "@/features/roles/types"],
  [/@\/types\/session(?![/\\])/g, "@/features/sessions/types"],
  [/@\/types\/activity-log(?![/\\])/g, "@/features/activity-logs/types"],
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;
  for (const [pattern, replacement] of REWRITES) {
    next = next.replace(pattern, replacement);
  }
  if (next !== original) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
    console.log("rewrote:", path.relative(ROOT, file));
  }
}
console.log(`\nDone. ${changed} files changed out of ${files.length} scanned.`);
