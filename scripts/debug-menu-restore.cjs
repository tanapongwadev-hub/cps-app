// Restore menus that got modified by debug scripts
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

  // Get the test_pg_dump — list all menus and show what was modified
  const menus = await req({ path: "/api/v1/menus?page=1&limit=100", method: "GET", headers: { Authorization: "Bearer " + t } });
  const list = JSON.parse(menus.body).items || [];

  // Find any menu with test_ prefix
  const dirty = list.filter(m =>
    m.code?.startsWith("test_") ||
    m.nameTh?.startsWith("test_") ||
    m.nameEn?.startsWith("test_") ||
    m.code?.startsWith("DEBUG_")
  );

  if (dirty.length === 0) {
    console.log("No dirty menus found. Nothing to restore.");
    return;
  }

  console.log("Dirty menus:");
  dirty.forEach(m => console.log(`- ${m.id} code=${m.code} nameTh=${m.nameTh}`));

  // For test_ entries, delete them (they're just debug artifacts)
  for (const m of dirty) {
    if (m.code?.startsWith("test_") || m.code?.startsWith("DEBUG_")) {
      console.log(`Deleting ${m.id} (${m.code})...`);
      const r = await req(
        { path: "/api/v1/menus/" + m.id, method: "DELETE", headers: { Authorization: "Bearer " + t } },
        {},
      );
      console.log(`  → ${r.status}`);
    }
  }

  // Find the original menu (id 11) that we mutated — restore from what we know
  // (the test mutated it to test_ values; original was "DEPARTMENT_LIST", "รายการ ตำแน่งงาน", "Department List")
  const orig = list.find(m => m.id === "11");
  if (orig && (orig.code === "test_code" || orig.nameTh === "test_nameTh")) {
    console.log("\nRestoring menu 11 (DEPARTMENT_LIST)...");
    const r = await req(
      { path: "/api/v1/menus/11", method: "PATCH", headers: { Authorization: "Bearer " + t } },
      {
        code: "DEPARTMENT_LIST",
        nameTh: "รายการ ตำแน่งงาน",
        nameEn: "Department List",
        path: "/departments",
        icon: null,
      },
    );
    console.log(`  → ${r.status} ${r.body.slice(0, 100)}`);
  } else {
    console.log("\nMenu 11 looks clean:", orig?.code, orig?.nameTh);
  }
})();
