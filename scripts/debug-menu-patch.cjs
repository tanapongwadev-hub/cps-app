// Debug what fields PATCH /menus/:id accepts
const http = require("http");

function req(opts, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        host: "localhost",
        port: 3001,
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve({ status: res.statusCode, body: b }));
      },
    );
    r.on("error", (e) => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req({ path: "/api/v1/auth/login", method: "POST" }, { username: "superadmin", password: "change-me-secure-password" });
  const env = JSON.parse(login.body);
  const token = env.data.authentication.accessToken;

  const menus = await req({ path: "/api/v1/menus?page=1&limit=5", method: "GET", headers: { Authorization: "Bearer " + token } });
  const list = JSON.parse(menus.body).items || [];
  const target = list[0];
  if (!target) { console.log("no menus"); return; }
  console.log("Target id:", target.id, "code:", target.code);

  const trials = [
    { name: "isVisible only", body: { isVisible: false } },
    { name: "isActive only", body: { isActive: false } },
    { name: "isVisible + isActive", body: { isVisible: false, isActive: false } },
    { name: "name only (sanity)", body: { name: "ทดสอบ " + Date.now() } },
    { name: "all UI fields", body: { isVisible: true, isActive: true, openInNewTab: false, name: "test" } },
    { name: "sortOrder only", body: { sortOrder: 999 } },
    { name: "menuType only", body: { menuType: "MAIN" } },
  ];

  for (const t of trials) {
    const r = await req(
      { path: "/api/v1/menus/" + target.id, method: "PATCH", headers: { Authorization: "Bearer " + token } },
      t.body,
    );
    const preview = r.body.replace(/\\"accessToken\\"[^,]+/, "...").slice(0, 150);
    console.log(`- ${t.name}: HTTP ${r.status} → ${preview}`);
  }
})();
