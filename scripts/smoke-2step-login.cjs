/**
 * Smoke test the native 2-step login flow against the real backend.
 *
 *   1. Create a user assigned to 2 different departments
 *   2. Log in as that user → expect 2-step response with
 *      `requiresDepartmentSelection: true`, `departmentSelectionToken`,
 *      and `departments[]`
 *   3. Call POST /auth/select-department with the token + chosen assignment
 *      → expect the full session (authentication + user + accessControl)
 *   4. Verify the user is now bound to the chosen (department, role)
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

  // 1) Find a non-admin role and 2 different departments
  const roles = await request("GET", "/roles?page=1&limit=10", null, adminToken);
  const depts = await request("GET", "/departments?page=1&limit=10", null, adminToken);
  const userRole = roles.body.items.find(
    (r) => r.code !== "SUPER_ADMIN" && r.code !== "ADMIN",
  );
  const deptA = depts.body.items[0];
  const deptB = depts.body.items.find((d) => d.id !== deptA.id) ?? depts.body.items[1];
  if (!userRole || !deptA || !deptB) {
    console.log("missing role or dept");
    return;
  }
  console.log(`✓ using role=${userRole.code}, deptA=${deptA.code}, deptB=${deptB.code}`);

  // 2) Create user with 1 assignment
  const stamp = Date.now();
  const username = `twostep_${stamp}`;
  const create = await request(
    "POST",
    "/users",
    {
      username,
      password: "Test1234",
      firstName: "Two",
      lastName: "Step",
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
  console.log(`✓ created userId=${userId}`);

  // 3) Add 2nd assignment
  await request(
    "POST",
    `/users/${userId}/assignments`,
    { departmentId: deptB.id, roleId: userRole.id },
    adminToken,
  );
  console.log("✓ added 2nd assignment");

  // 4) Log in as the new user — expect 2-step response
  console.log(`\n--- POST /auth/login as ${username} ---`);
  const login = await request("POST", "/auth/login", {
    username,
    password: "Test1234",
  });
  console.log("  status:", login.status);
  console.log("  body:", JSON.stringify(login.body, null, 2).slice(0, 1500));

  // The real backend might return:
  //   { requiresDepartmentSelection: true, departmentSelectionToken, departments }
  //   — either at root or wrapped in `data`. Handle both.
  const payload = login.body.data ?? login.body;
  if (payload?.requiresDepartmentSelection !== true) {
    console.log("  ✗ FAIL: expected requiresDepartmentSelection=true");
    return;
  }
  console.log("  ✓ requiresDepartmentSelection=true");
  if (!payload.departmentSelectionToken) {
    console.log("  ✗ FAIL: missing departmentSelectionToken");
    return;
  }
  console.log("  ✓ departmentSelectionToken present");
  if (!Array.isArray(payload.departments) || payload.departments.length !== 2) {
    console.log("  ✗ FAIL: expected 2 departments in options, got", payload.departments?.length);
    return;
  }
  console.log(`  ✓ ${payload.departments.length} department options`);
  console.log("  options:", JSON.stringify(payload.departments, null, 2));

  // 5) Call /auth/select-department with the chosen userDepartmentRoleId
  const chosenUdr = payload.departments[1].userDepartmentRoleId; // pick the 2nd one
  console.log(`\n--- POST /auth/select-department (udr=${chosenUdr}) ---`);
  const sel = await request("POST", "/auth/select-department", {
    departmentSelectionToken: payload.departmentSelectionToken,
    userDepartmentRoleId: chosenUdr,
  });
  console.log("  status:", sel.status);
  console.log("  body:", JSON.stringify(sel.body, null, 2).slice(0, 1500));
  if (sel.status !== 200 && sel.status !== 201) {
    console.log("  ✗ FAIL: select-department did not return success");
    return;
  }
  const finalSession = sel.body.data ?? sel.body;
  if (!finalSession?.authentication?.accessToken) {
    console.log("  ✗ FAIL: missing accessToken after select");
    return;
  }
  console.log("  ✓ accessToken received");
  if (!finalSession.user) {
    console.log("  ✗ FAIL: missing user in final session");
    return;
  }
  console.log("  ✓ user object present");

  // 6) Verify the user is bound to the chosen (dept, role) by inspecting
  // the access token's JWT payload. The chosen (userDepartmentRoleId,
  // departmentId) is encoded in the JWT claims, not in /auth/me.
  const me = await request("GET", "/auth/me", null, finalSession.authentication.accessToken);
  console.log("\n--- GET /auth/me with new token ---");
  console.log("  status:", me.status);
  const meData = me.body.data ?? me.body;
  console.log("  user.departments:", JSON.stringify(meData.user?.departments, null, 2));

  // Decode JWT (no signature check — local-only inspection)
  const token = finalSession.authentication.accessToken;
  const payload64 = token.split(".")[1];
  const jwtPayload = JSON.parse(
    Buffer.from(payload64, "base64").toString("utf8"),
  );
  console.log("  JWT claims:", JSON.stringify(jwtPayload, null, 2));
  if (jwtPayload.userDepartmentRoleId !== chosenUdr) {
    console.log(`  ✗ FAIL: JWT userDepartmentRoleId=${jwtPayload.userDepartmentRoleId}, expected=${chosenUdr}`);
    return;
  }
  console.log("  ✓ JWT encodes the chosen userDepartmentRoleId");
  if (String(jwtPayload.departmentId) !== String(payload.departments[1].departmentId)) {
    console.log(`  ✗ FAIL: JWT departmentId=${jwtPayload.departmentId}, expected=${payload.departments[1].departmentId}`);
    return;
  }
  console.log("  ✓ JWT encodes the chosen departmentId");

  // 7) Cleanup
  await request("DELETE", `/users/${userId}`, null, adminToken);
  console.log("\n✓ cleaned up");

  console.log("\n=== ALL 2-STEP CHECKS PASSED ===");
})();
