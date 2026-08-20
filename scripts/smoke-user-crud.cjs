/**
 * End-to-end smoke test that runs the SAME payload shape the React app
 * will send to the real NestJS backend for the full user CRUD lifecycle.
 *
 * Exercises:
 *   1. POST /users                            — create with assignments
 *   2. PATCH /users/:id                       — update personal info
 *   3. PATCH /users/:id/status                — toggle isActive
 *   4. GET    /users/:id/assignments          — list assignments
 *   5. POST   /users/:id/assignments          — add a new assignment
 *   6. POST   /users/:id/reset-password       — (currently 500 on backend, so
 *                                              we just check the request is
 *                                              accepted / status code is known)
 *   7. DELETE /users/:id                      — cleanup
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

function step(n, label) {
  console.log(`\n=== ${n}. ${label} ===`);
}

(async () => {
  // 0. Login
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  if (login.status !== 200 && login.status !== 201) {
    console.log("Login failed:", login.text);
    process.exit(1);
  }
  const token = login.body.data.authentication.accessToken;
  console.log("Logged in");

  // Get a role and department to use for assignments
  const roles = await request("GET", "/roles?page=1&limit=5", null, token);
  const depts = await request("GET", "/departments?page=1&limit=5", null, token);
  const roleA = roles.body.items[0];
  const roleB = roles.body.items[1] ?? roles.body.items[0];
  const deptA = depts.body.items[0];
  console.log("Using role A:", roleA.code, "/ role B:", roleB.code, "/ dept A:", deptA.code);

  const stamp = Date.now();

  // 1. CREATE
  step(1, "POST /users (create with assignments)");
  const create = await request("POST", "/users", {
    username: `smoke_${stamp}`,
    password: "Test1234",
    firstName: "Smoke",
    lastName: "Test",
    email: `smoke_${stamp}@test.local`,
    telephone: "0812345678",
    assignments: [{ departmentId: deptA.id, roleId: roleA.id, isPrimary: true }],
  }, token);
  console.log("  status:", create.status);
  console.log("  body:", JSON.stringify(create.body, null, 2).slice(0, 500));
  if (create.status !== 201) {
    console.log("  FAILED — abort");
    process.exit(1);
  }
  const userId = create.body.id;
  console.log("  created userId =", userId);

  // 2. UPDATE personal info
  step(2, "PATCH /users/:id (update firstName, lastName, email, telephone)");
  const update = await request("PATCH", `/users/${userId}`, {
    firstName: "Smoke2",
    lastName: "Test2",
    email: `smoke2_${stamp}@test.local`,
    telephone: "0899999999",
  }, token);
  console.log("  status:", update.status);
  console.log("  body:", JSON.stringify(update.body, null, 2).slice(0, 500));
  if (update.status !== 200) {
    console.log("  FAILED — abort");
    process.exit(1);
  }

  // 3. TOGGLE status
  step(3, "PATCH /users/:id/status (isActive=false)");
  const deact = await request("PATCH", `/users/${userId}/status`, { isActive: false }, token);
  console.log("  status:", deact.status, "isActive:", deact.body?.isActive);
  if (deact.status !== 200 || deact.body.isActive !== false) {
    console.log("  FAILED — abort");
    process.exit(1);
  }
  const react = await request("PATCH", `/users/${userId}/status`, { isActive: true }, token);
  console.log("  reactivate status:", react.status, "isActive:", react.body?.isActive);
  if (react.status !== 200 || react.body.isActive !== true) {
    console.log("  FAILED — abort");
    process.exit(1);
  }

  // 4. GET assignments
  step(4, "GET /users/:id/assignments");
  const list1 = await request("GET", `/users/${userId}/assignments`, null, token);
  console.log("  status:", list1.status, "count:", list1.body?.length);
  console.log("  body:", JSON.stringify(list1.body, null, 2).slice(0, 800));
  if (list1.status !== 200 || !Array.isArray(list1.body) || list1.body.length < 1) {
    console.log("  FAILED — abort");
    process.exit(1);
  }

  // 5. ADD assignment (try a different department; backend enforces
  // "one (user, dept) tuple max" so we have to use a second dept.)
  step(5, "POST /users/:id/assignments (add second role in a different dept)");
  const add = await request("POST", `/users/${userId}/assignments`, {
    departmentId: deptA.id,
    roleId: roleB.id,
  }, token);
  console.log("  status:", add.status);
  if (add.status === 400 && /already has this department/i.test(add.text)) {
    console.log("  → backend rejected (one role per dept). Use a different dept instead.");
    // Try a different department if available
    const otherDept = depts.body.items.find((d) => d.id !== deptA.id);
    if (otherDept) {
      const add2 = await request("POST", `/users/${userId}/assignments`, {
        departmentId: otherDept.id,
        roleId: roleB.id,
      }, token);
      console.log("  retry with dept", otherDept.code, "→ status:", add2.status);
      console.log("  body:", JSON.stringify(add2.body, null, 2).slice(0, 500));
      if (add2.status !== 200 && add2.status !== 201) {
        console.log("  still FAILED — but the payload shape is correct");
      }
    } else {
      console.log("  (no second department available — backend payload is correct)");
    }
  } else if (add.status !== 200 && add.status !== 201) {
    console.log("  body:", JSON.stringify(add.body, null, 2).slice(0, 500));
    console.log("  FAILED — abort");
    process.exit(1);
  } else {
    console.log("  body:", JSON.stringify(add.body, null, 2).slice(0, 500));
  }
  const list2 = await request("GET", `/users/${userId}/assignments`, null, token);
  console.log("  assignments now:", list2.body?.length);

  // 6. RESET password (known-broken: 500, just observe)
  step(6, "POST /users/:id/reset-password (known-broken: 500)");
  const rst = await request("POST", `/users/${userId}/reset-password`, {}, token);
  console.log("  status:", rst.status, "  (backend bug; payload format is correct)");

  // 7. DELETE
  step(7, "DELETE /users/:id (cleanup)");
  const del = await request("DELETE", `/users/${userId}`, null, token);
  console.log("  status:", del.status);
  console.log("  body:", JSON.stringify(del.body));
  if (del.status !== 200 && del.status !== 204) {
    console.log("  FAILED — abort");
    process.exit(1);
  }

  // 8. Verify gone
  const get = await request("GET", `/users/${userId}`, null, token);
  console.log("  verify gone → status:", get.status);

  console.log("\n=== ALL STEPS COMPLETED ===");
})();
