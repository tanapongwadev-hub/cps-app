#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILES = [
  "src/app/(admin)/dashboard/page.tsx",
  "src/app/(admin)/user-management/departments/page.tsx",
  "src/app/(admin)/user-management/users/page.tsx",
  "src/features/departments/components/department-list.container.tsx",
  "src/features/departments/components/department-form-dialog.tsx",
  "src/features/users/components/user-form-dialog.tsx",
];
for (const rel of FILES) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { console.log("SKIP missing:", rel); continue; }
  const before = fs.readFileSync(f, "utf8");
  const after = before.replace(
    /@\/features\/users\/hooks\/use-departments/g,
    "@/features/departments/hooks/use-departments",
  );
  if (after !== before) {
    fs.writeFileSync(f, after, "utf8");
    console.log("patched:", rel);
  }
}
