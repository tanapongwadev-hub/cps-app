// Check what backend returns for /menus/tree
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
  const r = await req("GET", "/api/v1/menus/tree", null, token);
  const items = r.body.data ?? r.body.items ?? r.body;
  const flat = [];
  const walk = (arr) => arr.forEach((m) => { flat.push(m); if (m.children?.length) walk(m.children); });
  walk(items);
  console.log("total:", flat.length);
  const off = flat.filter((m) => m.isVisible === false || m.isActive === false);
  console.log("invisible or inactive:", off.length);
  off.slice(0, 5).forEach((m) => console.log(`  - ${m.code}: isVisible=${m.isVisible} isActive=${m.isActive}`));
  console.log("\nAll codes + flags:");
  flat.forEach((m) => console.log(`  ${m.code}: isVisible=${m.isVisible} isActive=${m.isActive}`));
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
