// Run vitest unit tests with log
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const logPath = path.join(__dirname, "vitest.log");
const r = spawnSync(
  "node",
  ["node_modules/vitest/vitest.mjs", "run"],
  { cwd: path.join(__dirname, ".."), encoding: "utf8" }
);
const out = (r.stdout || "") + (r.stderr || "");
fs.writeFileSync(logPath, out, "utf8");
process.stdout.write(out);
process.exit(r.status || 0);
