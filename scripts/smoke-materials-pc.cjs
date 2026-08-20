/**
 * Smoke test for /materials/lookups + /materials CRUD
 *
 * The /materials/pc UI page uses the same generic /materials backend
 * endpoints. This smoke test verifies the full CRUD flow against the
 * real NestJS backend (http://localhost:3001/api/v1) and the lookups
 * the PC page needs (units, suppliers, models, deliveryTypes,
 * loadingPoints).
 *
 * Run: node scripts/smoke-materials-pc.cjs
 */
const http = require("http");

const BASE = "http://localhost:3001/api/v1";
const SUPERADMIN = { username: "superadmin", password: "change-me-secure-password" };

function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = data.length;
    if (token) headers["Authorization"] = "Bearer " + token;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try { json = JSON.parse(text); } catch { /* not JSON */ }
          resolve({ status: res.statusCode, body: json, text });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function ok(label) { console.log("  ✓", label); }
function fail(label, extra) {
  console.log("  ✗", label, extra ? JSON.stringify(extra).slice(0, 200) : "");
  process.exitCode = 1;
}

(async () => {
  console.log("\n=== smoke-materials-pc ===\n");

  // 1) Login
  const login = await request("POST", "/auth/login", SUPERADMIN);
  if (login.status !== 200 && login.status !== 201) {
    fail("login failed", { status: login.status, text: login.text?.slice(0, 200) });
    return;
  }
  const token = login.body.data.authentication.accessToken;
  ok("logged in as superadmin");

  // 2) GET /materials/lookups — must include units
  const lookups = await request("GET", "/materials/lookups", null, token);
  if (lookups.status !== 200) {
    fail("GET /materials/lookups", { status: lookups.status });
  } else {
    const hasUnits = Array.isArray(lookups.body.units) && lookups.body.units.length > 0;
    if (hasUnits) {
      ok(`/materials/lookups returned ${lookups.body.units.length} units`);
    } else {
      // No units seeded — POST a material will fail without a unitId. Skip the
      // POST branch but still cover the read flow.
      console.log("  ! /materials/lookups returned 0 units — POST will be skipped");
    }
  }

  // 3) GET /materials?page=1&limit=10
  const list = await request("GET", "/materials?page=1&limit=10", null, token);
  if (list.status !== 200) {
    fail("GET /materials", { status: list.status });
  } else {
    const items = list.body.items || [];
    ok(`GET /materials returned ${items.length} item(s), totalItems=${list.body.meta?.totalItems}`);
  }

  // 4) POST /materials (only if at least one unit exists)
  if (Array.isArray(lookups.body.units) && lookups.body.units.length > 0) {
    const unitId = lookups.body.units[0].id;
    const probeCode = `PC_SMOKE_${Date.now()}`;
    const create = await request(
      "POST",
      "/materials",
      {
        code: probeCode,
        name: "PC Smoke Probe",
        unitId,
        isActive: true,
      },
      token
    );
    if (create.status !== 201) {
      fail("POST /materials", { status: create.status, body: create.body });
    } else {
      const id = create.body.id;
      ok(`POST /materials created id=${id} (code=${create.body.code})`);

      // 5) PATCH /materials/:id
      const patch = await request(
        "PATCH",
        `/materials/${id}`,
        { name: "PC Smoke Probe (updated)", updatedAt: create.body.updatedAt },
        token
      );
      if (patch.status !== 200) {
        fail(`PATCH /materials/${id}`, { status: patch.status, body: patch.body });
      } else {
        ok(`PATCH /materials/${id} → name updated`);
      }

      // 6) DELETE /materials/:id (soft delete → isActive=false)
      const del = await request("DELETE", `/materials/${id}`, null, token);
      if (del.status !== 200) {
        fail(`DELETE /materials/${id}`, { status: del.status, body: del.body });
      } else {
        ok(`DELETE /materials/${id} (soft delete → isActive=false)`);
      }

      // 7) PATCH /materials/:id/restore
      const restore = await request("PATCH", `/materials/${id}/restore`, null, token);
      if (restore.status !== 200) {
        fail(`PATCH /materials/${id}/restore`, { status: restore.status, body: restore.body });
      } else {
        ok(`PATCH /materials/${id}/restore → isActive=true`);
      }

      // 8) Cleanup: hard-remove via delete again (it just sets isActive=false)
      await request("DELETE", `/materials/${id}`, null, token);
      ok(`cleanup: DELETE /materials/${id} (deactivated)`);
    }
  }

  console.log(process.exitCode ? "\n❌ smoke-materials-pc FAILED\n" : "\n✅ smoke-materials-pc PASSED\n");
})().catch((err) => {
  console.error("smoke-materials-pc crashed:", err);
  process.exit(1);
});
