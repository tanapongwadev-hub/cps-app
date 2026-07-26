// Fix leftover menuType values in mock data
const fs = require("fs");
const path = require("path");

function patch(file, replacements) {
  const full = path.join("C:\\Users\\USER\\Desktop\\minimax", file);
  let s = fs.readFileSync(full, "utf8");
  let count = 0;
  for (const [from, to] of replacements) {
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const matches = s.match(re);
    if (matches) count += matches.length;
    s = s.replace(re, to);
  }
  fs.writeFileSync(full, s, "utf8");
  console.log(file, "→", count, "replacements");
}

patch("src\\mocks\\db.ts", [
  ['menuType: "GROUP"', 'menuType: "MAIN"'],
]);

patch("src\\mocks\\handlers\\menus.ts", [
  ['"MAIN" | "SUB" | "GROUP" | "EXTERNAL"', '"MAIN" | "MENU" | "BUTTON"'],
  ['data.menuType as "MAIN" | "SUB" | "GROUP" | "EXTERNAL"', 'data.menuType as "MAIN" | "MENU" | "BUTTON"'],
]);
