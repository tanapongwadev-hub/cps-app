// Probe /auth/me to see the actual Access Control menu structure
const http = require("http");
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL("http://localhost:3001/api/v1" + path);
    const d = body ? Buffer.from(JSON.stringify(body)) : null;
    const h = { "Content-Type": "application/json" };
    if (d) h["Content-Length"] = d.length;
    if (token) h["Authorization"] = "Bearer " + token;
    const r = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers: h }, (res) => {
      let c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => {
        let j;
        try { j = JSON.parse(Buffer.concat(c).toString()); } catch {}
        resolve({ s: res.statusCode, b: j });
      });
    });
    r.on("error", reject);
    if (d) r.write(d);
    r.end();
  });
}
(async () => {
  const l = await req("POST", "/auth/login", { username: "superadmin", password: "change-me-secure-password" });
  const t = l.b.data.authentication.accessToken;
  console.log("✓ logged in\n");

  console.log("=== /auth/me/menus (real menu tree for the current user) ===");
  const menus = await req("GET", "/auth/me/menus", null, t);
  console.log("status:", menus.s);
  function dump(menu, indent) {
    const pad = "  ".repeat(indent);
    console.log(`${pad}- ${menu.nameTh || menu.name} (${menu.code}) → ${menu.path || "-"} [${menu.menuType}]`);
    if (menu.permissions && menu.permissions.length) {
      console.log(`${pad}  perms: ${menu.permissions.join(", ")}`);
    }
    (menu.children || []).forEach((c) => dump(c, indent + 1));
  }
  const items = Array.isArray(menus.b) ? menus.b : (menus.b?.items || menus.b?.data || menus.b?.menus || []);
  console.log("items found:", items.length, "keys:", Object.keys(menus.b || {}));
  items.forEach((m) => dump(m, 0));
})();
