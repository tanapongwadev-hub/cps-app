// Debug POST /menus
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

  const tag = "DEBUG_" + Date.now();
  const trials = [
    {
      name: "with name + openInNewTab",
      body: { code: tag, name: "Test", nameEn: "Test", nameTh: "ทดสอบ", path: "/test", menuType: "MAIN", sortOrder: 99, isVisible: true, isActive: true, openInNewTab: false },
    },
    {
      name: "only nameTh (Thai) + isVisible/isActive",
      body: { code: tag + "_B", nameTh: "ทดสอบ", nameEn: "Test", path: "/test", menuType: "MAIN", sortOrder: 99, isVisible: true, isActive: true },
    },
    {
      name: "minimal — just required fields",
      body: { code: tag + "_C", nameTh: "ทดสอบ", path: "/test", menuType: "MAIN" },
    },
  ];

  for (const t2 of trials) {
    const r = await req(
      { path: "/api/v1/menus", method: "POST", headers: { Authorization: "Bearer " + t } },
      t2.body,
    );
    console.log(`- ${t2.name}: HTTP ${r.status}`);
    console.log("  " + r.body.slice(0, 200));
  }
})();
