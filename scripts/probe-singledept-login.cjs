/**
 * Quick check: what does /auth/login return for a user with 1 dept?
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
  const adminLogin = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  const adminToken = adminLogin.body.data.authentication.accessToken;

  const roles = await request("GET", "/roles?page=1&limit=10", null, adminToken);
  const depts = await request("GET", "/departments?page=1&limit=10", null, adminToken);
  const userRole = roles.body.items.find(
    (r) => r.code !== "SUPER_ADMIN" && r.code !== "ADMIN",
  );
  const deptA = depts.body.items[0];

  const stamp = Date.now();
  const username = `singletest_${stamp}`;
  const create = await request("POST", "/users", {
    username,
    password: "Test1234",
    firstName: "Single",
    lastName: "Test",
    email: `${username}@test.local`,
    assignments: [{ departmentId: deptA.id, roleId: userRole.id, isPrimary: true }],
  }, adminToken);
  console.log("Created user:", create.body.id);

  // Login as the new user
  const userLogin = await request("POST", "/auth/login", {
    username,
    password: "Test1234",
  });
  console.log("\n=== Single-dept user login response ===");
  console.log("status:", userLogin.status);
  console.log("body:", JSON.stringify(userLogin.body, null, 2).slice(0, 1500));
  console.log("\nuser.departments.length:", (userLogin.body.data?.user?.departments || []).length);
  console.log("requiresDepartmentSelection:", userLogin.body.data?.requiresDepartmentSelection);
  console.log("has authentication:", !!userLogin.body.data?.authentication);

  // Cleanup
  await request("DELETE", `/users/${create.body.id}`, null, adminToken);
})();
