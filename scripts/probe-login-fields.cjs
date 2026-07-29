/**
 * Probe what the real /auth/login response includes about departments.
 * The user's request: if user has more than 1 department, force them to
 * pick one before entering the dashboard.
 */
const http = require("http");

const BASE = "http://localhost:3001/api/v1";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = data.length;
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
  // 1) Login as superadmin
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  console.log("LOGIN status:", login.status);
  const data = login.body?.data;
  if (!data) {
    console.log("LOGIN text:", login.text);
    return;
  }
  console.log("\n=== data keys ===");
  console.log(Object.keys(data).join(", "));
  console.log("\n=== data.authentication keys ===");
  console.log(Object.keys(data.authentication ?? {}).join(", "));
  console.log("\n=== data.user keys ===");
  console.log(Object.keys(data.user ?? {}).join(", "));
  console.log("\n=== data.user.departments (if any) ===");
  console.log(JSON.stringify(data.user?.departments, null, 2));
  console.log("\n=== data.user.roles (if any) ===");
  console.log(JSON.stringify(data.user?.roles, null, 2));
  console.log("\n=== data.userDepartmentRoles (if any) ===");
  console.log(JSON.stringify(data.user?.userDepartmentRoles, null, 2));
  console.log("\n=== data.currentDepartmentRole (if any) ===");
  console.log(JSON.stringify(data.currentDepartmentRole, null, 2));
  console.log("\n=== data.accessControl keys ===");
  console.log(Object.keys(data.accessControl ?? {}).join(", "));

  const token = data.authentication.accessToken;

  // 2) GET /auth/me
  console.log("\n\n=== /auth/me ===");
  const me = await request("GET", "/auth/me", null);
  // Manually add auth header
  const me2 = await new Promise((res, rej) => {
    const url = new URL(BASE + "/auth/me");
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      (r) => {
        let chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try { json = JSON.parse(text); } catch { /* not JSON */ }
          res({ status: r.statusCode, body: json, text });
        });
      }
    );
    req.on("error", rej);
    req.end();
  });
  console.log("status:", me2.status);
  console.log("body keys:", Object.keys(me2.body ?? {}).join(", "));
  console.log("data keys:", Object.keys(me2.body?.data ?? {}).join(", "));
  console.log("user keys:", Object.keys(me2.body?.data?.user ?? me2.body?.user ?? {}).join(", "));
  const meUser = me2.body?.data?.user ?? me2.body?.user;
  console.log("user.departments:", JSON.stringify(meUser?.departments, null, 2));
  console.log("user.userDepartmentRoles:", JSON.stringify(meUser?.userDepartmentRoles, null, 2));
  console.log("userDepartmentRoles (root):", JSON.stringify(me2.body?.data?.userDepartmentRoles, null, 2));
  console.log("currentDepartmentRole:", JSON.stringify(me2.body?.data?.currentDepartmentRole, null, 2));
  console.log("FULL /auth/me body:", JSON.stringify(me2.body, null, 2).slice(0, 3000));

  // 3) Try /auth/me/menus
  console.log("\n\n=== /auth/me/menus ===");
  const menus = await new Promise((res, rej) => {
    const url = new URL(BASE + "/auth/me/menus");
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      (r) => {
        let chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try { json = JSON.parse(text); } catch { /* not JSON */ }
          res({ status: r.statusCode, body: json, text });
        });
      }
    );
    req.on("error", rej);
    req.end();
  });
  console.log("status:", menus.status, "items:", menus.body?.length);
  console.log("sample:", JSON.stringify(menus.body?.[0], null, 2).slice(0, 500));
})();
