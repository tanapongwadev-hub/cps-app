// Save user's Thai language preference to memory
const fs = require("fs");
const path = "C:\\Users\\USER\\.minimax\\memory\\user.md";
const existing = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
if (existing.includes("Language preference")) {
  console.log("ALREADY_EXISTS");
  process.exit(0);
}
const append = `

### Language preference (2026-07-26)
Type: preference
User wants to communicate in Thai (ไทย) — saw message \`คุยภาษาไทย\`. Default to Thai for all user-facing messages going forward unless they switch back to English.
`;
fs.writeFileSync(path, existing + append, "utf8");
console.log("SAVED");
