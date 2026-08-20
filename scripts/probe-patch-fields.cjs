/**
 * Probe what fields PATCH /users/:id accepts and how to update assignments.
 */
const http = require("http");

const BASE = "http://localhost:3001/api/v1";

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = data.length;
    if (token) headers["Authorization"] = `Bearer ${token}`;
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

(async () => {
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  const token = login.body.data.authentication.accessToken;

  // Get a role and department
  const roles = await request("GET", "/roles?page=1&limit=5", null, token);
  const depts = await request("GET", "/departments?page=1&limit=5", null, token);
  const roleId = roles.body?.items?.[0]?.id;
  const deptId = depts.body?.items?.[0]?.id;

  // Create a user
  const create = await request("POST", "/users", {
    username: "patchprobe_" + Date.now(),
    password: "Test1234",
    firstName: "Patch",
    lastName: "Probe",
    email: `patchprobe_${Date.now()}@test.local`,
    assignments: [{ departmentId: deptId, roleId: roleId, isPrimary: true }],
  }, token);
  const userId = create.body.id;
  console.log("Created user", userId);

  // Probe PATCH /users/:id with different fields
  const patches = [
    { name: "firstName only", body: { firstName: "New" } },
    { name: "firstName + lastName", body: { firstName: "New", lastName: "Name" } },
    { name: "+ telephone (not phone!)", body: { firstName: "New", telephone: "0812345678" } },
    { name: "+ phone (rejected)", body: { firstName: "New", phone: "0812345678" } },
    { name: "+ email", body: { firstName: "New", email: `new_${Date.now()}@test.local` } },
    { name: "+ telephone empty", body: { firstName: "New", telephone: "" } },
  ];
  for (const p of patches) {
    const r = await request("PATCH", `/users/${userId}`, p.body, token);
    console.log(`\n--- PATCH: ${p.name} → ${r.status}`);
    if (r.status >= 400) console.log("  ", JSON.stringify(r.body));
  }

  // Probe POST /users/:id/assignments
  console.log("\n=== Probe POST /users/:id/assignments ===");
  const asgn = await request("POST", `/users/${userId}/assignments`, {
    departmentId: deptId,
    roleId: roleId,
    isPrimary: false,
  }, token);
  console.log("  status:", asgn.status);
  console.log("  body:", JSON.stringify(asgn.body, null, 2)?.slice(0, 1500));

  // Probe PATCH /users/:id/status with different bodies
  console.log("\n=== Probe PATCH /users/:id/status ===");
  const statusProbes = [
    { name: "{isActive: false}", body: { isActive: false } },
    { name: "{isActive: true}", body: { isActive: true } },
    { name: "{isLocked: true}", body: { isLocked: true } },
    { name: "{isActive: false, isLocked: false}", body: { isActive: false, isLocked: false } },
  ];
  for (const p of statusProbes) {
    const r = await request("PATCH", `/users/${userId}/status`, p.body, token);
    console.log(`  ${p.name} → ${r.status}`, r.status >= 400 ? JSON.stringify(r.body) : "");
  }

  // Probe DELETE /users/:id
  console.log("\n=== Probe DELETE /users/:id ===");
  const del = await request("DELETE", `/users/${userId}`, null, token);
  console.log("  status:", del.status, JSON.stringify(del.body)?.slice(0, 300));

  // Try reset password
  const create2 = await request("POST", "/users", {
    username: "rstprobe_" + Date.now(),
    password: "Test1234",
    firstName: "Rst",
    lastName: "Probe",
    email: `rstprobe_${Date.now()}@test.local`,
    assignments: [{ departmentId: deptId, roleId: roleId, isPrimary: true }],
  }, token);
  const rst = await request("POST", `/users/${create2.body.id}/reset-password`, {}, token);
  console.log("\n=== Probe POST /users/:id/reset-password ===");
  console.log("  status:", rst.status, JSON.stringify(rst.body)?.slice(0, 500));

  // Cleanup
  await request("DELETE", `/users/${create2.body.id}`, null, token);
})();
