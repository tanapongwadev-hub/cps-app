#!/usr/bin/env node
/**
 * One-shot: rewrite src/mocks/db.ts seedMenus to match the new MenuItem shape
 * (adds nameTh/nameEn/menuType/isVisible/isActive/createdAt/updatedAt).
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "mocks", "db.ts");
const src = fs.readFileSync(file, "utf8");

const start = src.indexOf("export const seedMenus: MenuItem[] = [");
const end = src.indexOf("];", start) + 2;
if (start < 0 || end < 0) {
  console.error("Could not locate seedMenus block");
  process.exit(1);
}

// Thai name → English name (rough transliterations / placeholders)
const nameEnMap = {
  "แดชบอร์ด": "Dashboard",
  "การจัดการผู้ใช้งาน": "User Management",
  "ผู้ใช้งาน": "Users",
  "บทบาท": "Roles",
  "แผนก": "Departments",
  "การดำเนินงาน": "Operations",
  "คำขอ / ตั๋ว": "Tickets",
  "งาน": "Tasks",
  "การอนุมัติ": "Approvals",
  "ข้อมูลหลัก": "Master Data",
  "หมวดหมู่": "Categories",
  "สถานะ": "Statuses",
  "องค์กร": "Organizations",
  "รายงาน": "Reports",
  "รายงานสรุป": "Summary Report",
  "รายงานกิจกรรม": "Activity Report",
  "ระบบ": "System",
  "จัดการเมนู": "Menu Management",
  "บันทึกกิจกรรม": "Activity Logs",
  "ตั้งค่าระบบ": "Settings",
};

const block = src.slice(start, end);
const transformed = block.replace(
  /(\{[^{}]*?id:\s*"([^"]+)"[^{}]*?\})/gs,
  (full, inner, id) => {
    // Extract name
    const nameMatch = inner.match(/name:\s*"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : id;
    const nameEn = nameEnMap[name] || name;
    // menuType: groups are isGroup: true; everything with a path is MAIN; without a path is GROUP
    const isGroup = /isGroup:\s*true/.test(inner);
    const hasPath = /path:\s*"/.test(inner);
    const menuType = isGroup ? "GROUP" : hasPath ? "MAIN" : "MAIN";
    // Insert/replace fields
    let next = inner;
    if (/nameTh:/.test(next)) {
      // already has it (shouldn't)
    } else {
      next = next.replace(/name:\s*"[^"]+",?/, `nameTh: ${JSON.stringify(name)}, nameEn: ${JSON.stringify(nameEn)},`);
    }
    if (!/menuType:/.test(next)) {
      next = next.replace(
        /(icon:[^,]+,)/,
        `$1\n    menuType: ${JSON.stringify(menuType)},`,
      );
    }
    if (!/isVisible:/.test(next)) {
      next = next.replace(
        /(requiredPermissions:[^,]+,)/,
        `$1\n    isVisible: true,`,
      );
    }
    if (!/isActive:/.test(next)) {
      next = next.replace(
        /(isVisible:[^,]+,)/,
        `$1\n    isActive: true,`,
      );
    }
    if (!/createdAt:/.test(next)) {
      next = next.replace(
        /(isGroup:[^,]+,)/,
        `$1\n    createdAt: "2026-01-01T00:00:00.000Z",\n    updatedAt: "2026-01-01T00:00:00.000Z",`,
      );
    }
    return next;
  },
);

const out = src.slice(0, start) + transformed + src.slice(end);
fs.writeFileSync(file, out, "utf8");
console.log("✓ Rewrote seedMenus in", file);
