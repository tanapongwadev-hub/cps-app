// Probe /materials endpoints
const http = require("http");
function req(method, path, body, token) {
  return new Promise((resolve) => {
    const u = new URL("http://localhost:3001/api/v1" + path);
    const d = body ? Buffer.from(JSON.stringify(body)) : null;
    const h = { "Content-Type": "application/json" };
    if (d) h["Content-Length"] = d.length;
    if (token) h["Authorization"] = "Bearer " + token;
    const r = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers: h },
      (res) => {
        let c = [];
        res.on("data", (x) => c.push(x));
        res.on("end", () => {
          let j;
          try { j = JSON.parse(Buffer.concat(c).toString()); } catch {}
          resolve({ s: res.statusCode, b: j, text: Buffer.concat(c).toString("utf8") });
        });
      }
    );
    r.on("error", (e) => resolve({ error: e.message }));
    if (d) r.write(d);
    r.end();
  });
}
(async () => {
  const l = await req("POST", "/auth/login", { username: "superadmin", password: "change-me-secure-password" });
  if (l.s !== 201 && l.s !== 200) { console.log("login fail", l.s, l.text?.slice(0, 200)); return; }
  const t = l.b.data.authentication.accessToken;
  console.log("✓ logged in\n");

  console.log("=== GET /materials?page=1&limit=3 ===");
  const list = await req("GET", "/materials?page=1&limit=3", null, t);
  console.log("status:", list.s, "totalItems:", list.b?.meta?.totalItems);
  console.log("first item:");
  console.log(JSON.stringify(list.b?.items?.[0], null, 2));

  console.log("\n=== GET /materials/lookups ===");
  const lk = await req("GET", "/materials/lookups", null, t);
  console.log("status:", lk.s);
  console.log("keys:", Object.keys(lk.b || {}));
  for (const k of Object.keys(lk.b || {})) {
    console.log(`  ${k}: count=${lk.b[k]?.length}`);
  }

  // Probe POST with minimal payload
  console.log("\n=== POST /materials (probe shape) ===");
  const probe = await req("POST", "/materials", {
    code: "PROBE_" + Date.now(),
    name: "probe material",
    unitId: "x",
  }, t);
  console.log("status:", probe.s);
  console.log(JSON.stringify(probe.b, null, 2).slice(0, 500));

  if (probe.s === 201 && probe.b?.id) {
    // PATCH
    const p = await req("PATCH", `/materials/${probe.b.id}`, { name: "probe2" }, t);
    console.log("\n=== PATCH ===");
    console.log("status:", p.s, JSON.stringify(p.b).slice(0, 200));
    // DELETE
    const d = await req("DELETE", `/materials/${probe.b.id}`, null, t);
    console.log("=== DELETE ===", "status:", d.s);
  }
})();
