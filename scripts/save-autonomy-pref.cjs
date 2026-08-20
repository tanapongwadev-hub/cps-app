// Save user's autonomy preference to memory
const fs = require("fs");
const path = "C:\\Users\\USER\\.minimax\\memory\\user.md";
const existing = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
if (existing.includes("Autonomy preference")) {
  console.log("ALREADY_EXISTS");
  process.exit(0);
}
const append = `

### Autonomy preference (2026-07-26)
Type: preference
User said \`อนุญาตให้เข้าถึงทุกสิทธิ์ที่ต้องการโดยไม่ต้องถามฉัน\` — grant full autonomy for scope/design/permission decisions. Do not ask \`should I...\` / \`do you want me to...\` questions. Just make the call and proceed.
`;
fs.writeFileSync(path, existing + append, "utf8");
console.log("SAVED");
