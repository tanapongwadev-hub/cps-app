// Compare parentId in list vs tree for the same items
const http = require("http");
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const r = http.request(
      { hostname: "localhost", port: 3001, path, method, headers },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
          catch { resolve({ status: res.statusCode, body: chunks }); }
        });
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const login = await req("POST", "/api/v1/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  const token = login.body.data.authentication.accessToken;

  // Get specific menu by id
  const list = await req("GET", "/api/v1/menus?page=1&limit=100", null, token);
  const items = list.body.items ?? [];
  const depts = items.filter((m) => m.code.includes("DEPARTMENT"));
  console.log("=== DEPARTMENT_LIST from /menus list ===");
  depts.forEach((m) => {
    console.log(`  code=${m.code} id=${m.id} parentId=${m.parentId} sortOrder=${m.sortOrder} parent=${m.parent}`);
  });

  console.log("\n=== Try GET /menus/:id for DEPARTMENT_LIST ===");
  const deptList = depts.find((m) => m.code === "DEPARTMENT_LIST");
  if (deptList) {
    const single = await req("GET", `/api/v1/menus/${deptList.id}`, null, token);
    console.log("status:", single.status);
    console.log("body:", JSON.stringify(single.body, null, 2).slice(0, 500));
  }
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
