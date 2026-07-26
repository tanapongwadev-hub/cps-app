// Check ordering of /menus list vs /menus/tree
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
  if (login.status >= 400) {
    console.log("LOGIN FAILED:", login.status, JSON.stringify(login.body).slice(0, 200));
    return;
  }
  const token = login.body.data.authentication.accessToken;
  console.log("token length:", token?.length);

  console.log("\n=== /menus (list) ===");
  const list = await req("GET", "/api/v1/menus?page=1&limit=100", null, token);
  console.log("status:", list.status);
  console.log("body keys:", Object.keys(list.body || {}));
  console.log("body.data keys:", Object.keys(list.body?.data || {}));
  const listItems = list.body.data?.items ?? list.body.items ?? [];
  console.log("items count:", listItems.length);
  listItems.slice(0, 10).forEach((m) => {
    console.log(`  ${m.code} (sortOrder=${m.sortOrder}, parentId=${m.parentId ?? "null"}, isVisible=${m.isVisible})`);
  });

  console.log("\n=== /menus/tree ===");
  const tree = await req("GET", "/api/v1/menus/tree", null, token);
  console.log("status:", tree.status);
  console.log("body keys:", Object.keys(tree.body || {}));
  const treeItems = tree.body.data ?? tree.body ?? [];
  console.log("root count:", treeItems.length);
  treeItems.forEach((m) => {
    console.log(`  ${m.code} (sortOrder=${m.sortOrder})`);
    (m.children ?? []).forEach((c) => {
      console.log(`    └─ ${c.code} (sortOrder=${c.sortOrder})`);
    });
  });
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
