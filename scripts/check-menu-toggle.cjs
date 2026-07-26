// Toggle a menu to isVisible=false, isActive=false, then GET /menus/tree
// to see if backend filters them out.
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

  // Create a test menu
  const code = `TOGGLE_TEST_${Date.now()}`.slice(0, 30);
  const create = await req(
    "POST",
    "/api/v1/menus",
    { code, nameTh: "Toggle Test", nameEn: "Toggle Test", menuType: "MAIN", path: "/toggle-test", sortOrder: 99 },
    token,
  );
  if (create.status >= 400) {
    console.log("create failed:", create.status, JSON.stringify(create.body).slice(0, 200));
    return;
  }
  console.log("create response keys:", Object.keys(create.body));
  const id = create.body.id;
  if (!id) {
    console.log("could not find id in create response");
    return;
  }
  console.log(`✓ Created id=${id} code=${code} isVisible=${create.body.isVisible} isActive=${create.body.isActive}`);

  // PATCH to isVisible=false, isActive=false
  const patch = await req(
    "PATCH",
    `/api/v1/menus/${id}`,
    { isVisible: false, isActive: false },
    token,
  );
  console.log(`PATCH → ${patch.status} isVisible=${patch.body?.isVisible} isActive=${patch.body?.isActive}`);

  // Now GET /menus/tree
  const tree = await req("GET", "/api/v1/menus/tree", null, token);
  const items = tree.body.data ?? tree.body;
  const flat = [];
  const walk = (arr) => arr.forEach((m) => { flat.push(m); if (m.children?.length) walk(m.children); });
  walk(items);
  const found = flat.find((m) => m.id === id);
  console.log(`GET /menus/tree — found? ${!!found} ${found ? `(isVisible=${found.isVisible} isActive=${found.isActive})` : ""}`);

  // Also try GET /menus (list)
  const list = await req("GET", "/api/v1/menus?page=1&limit=100", null, token);
  const listItems = list.body.data?.items ?? list.body.items ?? list.body;
  const foundInList = listItems.find((m) => m.id === id);
  console.log(`GET /menus — found? ${!!foundInList} ${foundInList ? `(isVisible=${foundInList.isVisible} isActive=${foundInList.isActive})` : ""}`);

  // Cleanup
  await req("DELETE", `/api/v1/menus/${id}`, null, token);
  console.log("✓ Cleaned up");
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
