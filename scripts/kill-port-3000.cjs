// Simple port-killer using Node's net
const { execSync } = require("child_process");
const port = process.argv[2] || "3000";
try {
  const out = execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`, { encoding: "utf8" });
  const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (pids.length === 0) {
    console.log(`No process listening on port ${port}`);
  } else {
    for (const pid of pids) {
      try {
        execSync(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force"`, { stdio: "ignore" });
        console.log(`Killed PID ${pid}`);
      } catch (e) {
        console.log(`Failed to kill PID ${pid}: ${e.message}`);
      }
    }
  }
} catch (e) {
  console.log("Error:", e.message);
}
