#!/usr/bin/env node
/**
 * Add `path: null` to GROUP menus (they don't have paths).
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "mocks", "db.ts");
let src = fs.readFileSync(file, "utf8");

// Add `path: null,` after `menuType: "GROUP",`
const before = src;
src = src.replace(
  /menuType: "GROUP",(?!\s*\n\s*path:)/g,
  'menuType: "GROUP",\n    path: null,',
);

if (src !== before) {
  fs.writeFileSync(file, src, "utf8");
  console.log("✓ Added path: null to GROUP menus");
} else {
  console.log("(no changes needed)");
}
