// Hit the real backend and dump the first permission record
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
  const r = await req("GET", "/api/v1/permissions?page=1&limit=3", null, token);
  if (r.status >= 400) { console.log("ERR:", r.status, JSON.stringify(r.body).slice(0, 200)); return; }
  const items = r.body.data?.items ?? r.body.items ?? [];
  console.log("count:", items.length);
  console.log("first item keys:", Object.keys(items[0] ?? {}));
  console.log("first item:", JSON.stringify(items[0], null, 2));
  // Check the type of 'action' field
  if (items[0]) {
    const a = items[0].action;
    console.log("action type:", typeof a, "isArray:", Array.isArray(a));
    if (a && typeof a === "object") console.log("action keys:", Object.keys(a));
  }
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
