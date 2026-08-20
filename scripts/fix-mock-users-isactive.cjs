/**
 * One-shot migration: add `isActive: <derived from status>` to every user
 * entry in src/mocks/db.ts.
 *
 *   status: "active"   → isActive: true
 *   status: "inactive" → isActive: false
 *   status: "pending"  → isActive: false   (pending users can't log in)
 *   no status          → isActive: true
 *
 * Also adds `telephone: <phone>` (alias) where `phone` is set, so the
 * updated UI that reads `telephone` doesn't show "-" for existing users.
 */
const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "src",
  "mocks",
  "db.ts",
);
let src = fs.readFileSync(file, "utf8");

let count = 0;
let phoneCount = 0;

// Insert isActive right after each `status: "..."` line within seedUsers array.
// We only touch the seedUsers section (before the "Generate more users" comment).
const sectionMarker = "// Generate more users";
const idx = src.indexOf(sectionMarker);
if (idx === -1) {
  console.error("section marker not found");
  process.exit(1);
}
const head = src.slice(0, idx);
const tail = src.slice(idx);

const newHead = head.replace(
  /(\bstatus:\s*"(active|inactive|pending)")(\s*,)/g,
  (m, statusDecl, status, comma) => {
    count++;
    const isActive = status === "active";
    return `${statusDecl},\n    isActive: ${isActive},${comma}`;
  },
);

// Also: where there's `phone: "..."` (not telephone), also add telephone alias
// (so the new `telephone` field in the UI shows the existing value).
const newHead2 = newHead.replace(
  /(\bphone:\s*"([^"]+)")(\s*,)/g,
  (m, phoneDecl, _phone, comma) => {
    phoneCount++;
    return `${phoneDecl},\n    telephone: ${phoneDecl.match(/"([^"]+)"/)[1] ? `"${_phone}"` : "undefined"},${comma}`;
  },
);

if (newHead2 === head) {
  console.log("No changes made (already updated?)");
} else {
  fs.writeFileSync(file, newHead2 + tail, "utf8");
  console.log(`Added isActive to ${count} users and telephone to ${phoneCount} users`);
}
