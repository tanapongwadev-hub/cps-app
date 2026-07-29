/**
 * Probe /auth/switch-department shape and a regular user's assignments
 * to see if the 2-step flow is feasible.
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
  // Login as superadmin
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  const token = login.body.data.authentication.accessToken;
  console.log("Logged in as superadmin");

  // Get all users with their departments
  const users = await request("GET", "/users?page=1&limit=20", null, token);
  const items = users.body.items ?? users.body.data?.items ?? [];
  console.log("\n=== All users (id, name, dept): ===");
  for (const u of items.slice(0, 10)) {
    const asgn = await request("GET", `/users/${u.id}/assignments`, null, token);
    const asgns = asgn.body ?? [];
    const deptNames = asgns
      .map((a) => a.department?.nameTh || a.department?.name || a.departmentId)
      .join(", ");
    const roleNames = asgns
      .map((a) => a.role?.nameTh || a.role?.nameEn || a.role?.name || a.roleId)
      .join(", ");
    console.log(
      `  ${u.id} | ${u.firstName} ${u.lastName} (@${u.username}) | depts: ${deptNames || "(none)"} | roles: ${roleNames || "(none)"} | count: ${asgns.length}`,
    );
  }

  // Find a user with multiple depts (or any non-superadmin with assignments)
  const target = items.find((u) => u.username !== "superadmin");
  if (!target) {
    console.log("\nNo non-superadmin users to test against — creating one...");

    // Get a role + dept
    const roles = await request("GET", "/roles?page=1&limit=5", null, token);
    const depts = await request("GET", "/departments?page=1&limit=5", null, token);
    const roleA = roles.body.items[0];
    const roleB = roles.body.items[1] ?? roleA;
    const deptA = depts.body.items[0];
    const deptB = depts.body.items[1] ?? deptA;

    // Create user
    const create = await request("POST", "/users", {
      username: "multidept_" + Date.now(),
      password: "Test1234",
      firstName: "Multi",
      lastName: "Dept",
      email: `multidept_${Date.now()}@test.local`,
      assignments: [{ departmentId: deptA.id, roleId: roleA.id, isPrimary: true }],
    }, token);
    console.log("  Created:", create.body.id);
    const userId = create.body.id;

    // Add second assignment
    await request("POST", `/users/${userId}/assignments`, {
      departmentId: deptB.id,
      roleId: roleB.id,
    }, token);

    // Get all assignments
    const asgn = await request("GET", `/users/${userId}/assignments`, null, token);
    console.log("\n  Created user assignments:", JSON.stringify(asgn.body, null, 2).slice(0, 1500));

    // Now log in as that user
    const u2 = await request("POST", "/auth/login", {
      username: create.body.username,
      password: "Test1234",
    });
    console.log("\n  Login as multi-dept user:", u2.status);
    const u2token = u2.body?.data?.authentication?.accessToken;
    const u2user = u2.body?.data?.user;
    console.log("  user shape:", JSON.stringify(u2user, null, 2).slice(0, 1500));
    console.log("  user.departments:", JSON.stringify(u2user?.departments, null, 2));
    console.log("  user.roles:", JSON.stringify(u2user?.roles, null, 2));

    if (u2token) {
      // Try /auth/switch-department
      const primary = asgn.body[0]; // The one with isPrimary
      const secondary = asgn.body[1];
      console.log("\n  Trying /auth/switch-department with secondary assignment", secondary.id);
      const sw = await request("POST", "/auth/switch-department", {
        userDepartmentRoleId: secondary.id,
      }, u2token);
      console.log("  status:", sw.status);
      console.log("  body:", JSON.stringify(sw.body, null, 2).slice(0, 1500));
    }

    // Cleanup
    await request("DELETE", `/users/${userId}`, null, token);
    console.log("  Cleaned up test user");
  } else {
    console.log(`\nUsing existing user ${target.username} (id=${target.id})`);
    const asgn = await request("GET", `/users/${target.id}/assignments`, null, token);
    console.log("  Assignments:", JSON.stringify(asgn.body, null, 2).slice(0, 1500));
  }
})();
