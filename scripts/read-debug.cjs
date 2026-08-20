const fs = require("fs");
const path = require("path");
const dir = path.join(process.cwd(), "test-results");
fs.readdirSync(dir)
  .filter(f => f.startsWith("login-debug-"))
  .forEach(f => {
    console.log("--- " + f + " ---");
    console.log(fs.readFileSync(path.join(dir, f), "utf8"));
  });
