/**
 * Probe the exact shape of `assignments` and other fields the real backend
 * expects for POST /users and PATCH /users/:id.
 */
const http = require("http");

const BASE = "http://localhost:3001/api/v1";

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
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
          try {
            json = JSON.parse(text);
          } catch {
            // not JSON
          }
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
  // Login
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  const token = login.body.data.authentication.accessToken;
  console.log("Logged in");

  // Get a role id + department id
  const roles = await request("GET", "/roles?page=1&limit=5", null, token);
  const roleId = roles.body?.items?.[0]?.id ?? roles.body?.data?.items?.[0]?.id;
  console.log("Role id:", roleId, "Role shape:", JSON.stringify(roles.body?.items?.[0] ?? roles.body?.data?.items?.[0], null, 2)?.slice(0, 600));

  const depts = await request("GET", "/departments?page=1&limit=5", null, token);
  const deptId = depts.body?.items?.[0]?.id ?? depts.body?.data?.items?.[0]?.id;
  console.log("Department id:", deptId, "Dept shape:", JSON.stringify(depts.body?.items?.[0] ?? depts.body?.data?.items?.[0], null, 2)?.slice(0, 600));

  // Probe POST with different `assignments` shapes
  const probes = [
    {
      name: "assignments: [{departmentId, roleId}]",
      body: {
        username: "probe_a_" + Date.now(),
        password: "Test1234",
        firstName: "Probe",
        lastName: "A",
        email: `probe_a_${Date.now()}@test.local`,
        assignments: [{ departmentId: deptId, roleId: roleId }],
      },
    },
    {
      name: "assignments: [{departmentId, roleId, isPrimary}]",
      body: {
        username: "probe_b_" + Date.now(),
        password: "Test1234",
        firstName: "Probe",
        lastName: "B",
        email: `probe_b_${Date.now()}@test.local`,
        assignments: [{ departmentId: deptId, roleId: roleId, isPrimary: true }],
      },
    },
    {
      name: "minimal + phone",
      body: {
        username: "probe_c_" + Date.now(),
        password: "Test1234",
        firstName: "Probe",
        lastName: "C",
        email: `probe_c_${Date.now()}@test.local`,
        phone: "0812345678",
        assignments: [{ departmentId: deptId, roleId: roleId, isPrimary: true }],
      },
    },
  ];
  for (const p of probes) {
    const r = await request("POST", "/users", p.body, token);
    console.log(`\n--- Probe: ${p.name}`);
    console.log("  status:", r.status);
    console.log("  body:", JSON.stringify(r.body, null, 2)?.slice(0, 1000));
  }

  // Get the first created user back to see exact shape
  const newId = (() => {
    for (const p of probes) {
      // re-fetch
    }
    return null;
  })();

  // List users to see updated shape
  const list2 = await request("GET", "/users?page=1&limit=2", null, token);
  console.log("\nGET /users sample (after creates):");
  console.log(JSON.stringify(list2.body?.items ?? list2.body?.data?.items, null, 2)?.slice(0, 2000));

  // PATCH a user — probe different shapes
  const targetId = list2.body?.items?.[0]?.id ?? list2.body?.data?.items?.[0]?.id;
  console.log("\nPatching user", targetId);

  const patches = [
    {
      name: "PATCH: top-level roleIds",
      path: `/users/${targetId}`,
      method: "PATCH",
      body: { firstName: "Updated", roleIds: [roleId] },
    },
    {
      name: "PATCH: assignments array",
      path: `/users/${targetId}`,
      method: "PATCH",
      body: {
        firstName: "Updated",
        assignments: [{ departmentId: deptId, roleId: roleId, isPrimary: true }],
      },
    },
    {
      name: "PATCH: status",
      path: `/users/${targetId}/status`,
      method: "PATCH",
      body: { isActive: true },
    },
    {
      name: "PATCH: status (active string)",
      path: `/users/${targetId}/status`,
      method: "PATCH",
      body: { status: "active" },
    },
  ];
  for (const p of patches) {
    const r = await request(p.method, p.path, p.body, token);
    console.log(`\n--- ${p.name}`);
    console.log("  status:", r.status);
    console.log("  body:", JSON.stringify(r.body, null, 2)?.slice(0, 800));
  }

  // Get single user — what does it return?
  const single = await request("GET", `/users/${targetId}`, null, token);
  console.log("\nGET /users/:id shape:");
  console.log(JSON.stringify(single.body, null, 2)?.slice(0, 2500));

  // Get assignments
  const asgn = await request("GET", `/users/${targetId}/assignments`, null, token);
  console.log("\nGET /users/:id/assignments:");
  console.log(JSON.stringify(asgn.body, null, 2)?.slice(0, 2500));
})();
