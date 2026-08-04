// Type check + log
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const logPath = path.join(__dirname, "typecheck.log");
const r = spawnSync("node", ["node_modules/typescript/bin/tsc", "--noEmit"], {
  cwd: path.join(__dirname, ".."),
  encoding: "utf8",
});
const out = (r.stdout || "") + (r.stderr || "");
fs.writeFileSync(logPath, out, "utf8");
console.log("exit=" + (r.status || 0));
if (r.status !== 0) {
  const lines = out.split("\n");
  console.log("--- first 50 lines of errors ---");
  console.log(lines.slice(0, 50).join("\n"));
}
