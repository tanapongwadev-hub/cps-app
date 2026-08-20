// Comprehensive: what fields does PATCH /menus/:id accept?
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
  const l = await req({ path: "/api/v1/auth/login", method: "POST" }, { username: "superadmin", password: "change-me-secure-password" });
  const t = JSON.parse(l.body).data.authentication.accessToken;

  const menus = await req({ path: "/api/v1/menus?page=1&limit=5", method: "GET", headers: { Authorization: "Bearer " + t } });
  const list = JSON.parse(menus.body).items || [];
  const target = list[0];
  if (!target) return;

  // Try each PATCH field individually to see what's accepted
  const fields = [
    "code", "nameTh", "nameEn", "path", "icon", "parentId", "menuType", "sortOrder",
    "isVisible", "isActive", "openInNewTab", "externalUrl", "description",
  ];
  for (const f of fields) {
    let value;
    if (f === "isVisible" || f === "isActive") value = true;
    else if (f === "openInNewTab") value = false;
    else if (f === "sortOrder") value = target.sortOrder;
    else if (f === "menuType") value = "MAIN";
    else if (f === "parentId") value = target.parentId;
    else value = "test_" + f;
    const r = await req(
      { path: "/api/v1/menus/" + target.id, method: "PATCH", headers: { Authorization: "Bearer " + t } },
      { [f]: value },
    );
    const ok = r.status === 200 ? "✅" : "❌";
    const preview = r.body.replace(/"accessToken"/g, '"AT"').slice(0, 100);
    console.log(`${ok} ${f}: HTTP ${r.status} → ${preview}`);
  }
})();
