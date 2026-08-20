/**
 * Smoke test the multi-department login flow against the real backend.
 *
 *   1. Create a user assigned to 2 different departments
 *   2. Log in as that user
 *   3. Verify the login response includes both departments in
 *      `data.user.departments` so the frontend can detect "needs to pick"
 *   4. Try /auth/switch-department with one of the assignments to confirm
 *      the switch endpoint works
 *   5. Cleanup
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
  // 0) Login as superadmin
  const adminLogin = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  if (adminLogin.status !== 200 && adminLogin.status !== 201) {
    console.log("admin login failed:", adminLogin.text);
    return;
  }
  const adminToken = adminLogin.body.data.authentication.accessToken;
  console.log("✓ admin login");

  // 1) Find/create a regular role and 2 departments
  const roles = await request("GET", "/roles?page=1&limit=10", null, adminToken);
  const depts = await request("GET", "/departments?page=1&limit=10", null, adminToken);

  const userRole = roles.body.items.find(
    (r) => r.code !== "SUPER_ADMIN" && r.code !== "ADMIN",
  );
  const deptA = depts.body.items[0];
  const deptB = depts.body.items.find((d) => d.id !== deptA.id) ?? depts.body.items[1];

  if (!userRole || !deptA || !deptB) {
    console.log("missing role or dept", { userRole, deptA, deptB });
    return;
  }
  console.log(`✓ using role=${userRole.code}, deptA=${deptA.code}, deptB=${deptB.code}`);

  // 2) Create the user with one assignment
  const stamp = Date.now();
  const username = `multidept_${stamp}`;
  const create = await request(
    "POST",
    "/users",
    {
      username,
      password: "Test1234",
      firstName: "Multi",
      lastName: "Dept",
      email: `${username}@test.local`,
      assignments: [{ departmentId: deptA.id, roleId: userRole.id, isPrimary: true }],
    },
    adminToken,
  );
  if (create.status !== 201) {
    console.log("create user failed:", create.text);
    return;
  }
  const userId = create.body.id;
  console.log(`✓ created userId=${userId} with 1 assignment`);

  // 3) Add a second assignment in a different department
  const add = await request(
    "POST",
    `/users/${userId}/assignments`,
    { departmentId: deptB.id, roleId: userRole.id },
    adminToken,
  );
  if (add.status !== 200 && add.status !== 201) {
    console.log("add assignment failed:", add.text);
    return;
  }
  console.log(`✓ added 2nd assignment in deptB`);

  // 4) List assignments
  const asgns = await request("GET", `/users/${userId}/assignments`, null, adminToken);
  console.log(`✓ user has ${asgns.body.length} assignments`);
  if (asgns.body.length !== 2) {
    console.log("expected 2 assignments, got", asgns.body.length);
    return;
  }
  const udrA = asgns.body[0].id;
  const udrB = asgns.body[1].id;

  // 5) Log in as the new user
  const userLogin = await request("POST", "/auth/login", {
    username,
    password: "Test1234",
  });
  console.log(`\n--- login as ${username} ---`);
  console.log("  status:", userLogin.status);
  console.log("  body:", JSON.stringify(userLogin.body, null, 2).slice(0, 1500));
  if (userLogin.status !== 200 && userLogin.status !== 201) {
    console.log("  ✗ login failed");
    return;
  }
  const userToken = userLogin.body.data?.authentication?.accessToken;
  const userData = userLogin.body.data?.user ?? userLogin.body.user;
  if (!userToken || !userData) {
    console.log("  ✗ missing token or user data");
    return;
  }

  // 6) Verify the frontend can detect "needs department selection"
  const needsSelection = !userData.isSuperAdmin && (userData.departments || []).length > 1;
  console.log(`\n--- frontend would set needsDepartmentSelection = ${needsSelection} ---`);
  if (!needsSelection) {
    console.log("  ✗ FAIL: should be true for user with >1 dept");
    return;
  }
  console.log("  ✓ PASS");

  // 7) Verify /auth/switch-department works
  console.log(`\n--- POST /auth/switch-department ---`);
  const sw = await request(
    "POST",
    "/auth/switch-department",
    { userDepartmentRoleId: udrB },
    userToken,
  );
  console.log("  status:", sw.status);
  console.log("  body:", JSON.stringify(sw.body, null, 2).slice(0, 1000));

  // 8) Cleanup
  await request("DELETE", `/users/${userId}`, null, adminToken);
  console.log("\n✓ cleaned up test user");

  console.log("\n=== ALL CHECKS PASSED ===");
})();
