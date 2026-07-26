// Test menu create with different menuType values
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
  console.log("✓ Login OK");

  const baseFields = {
    nameTh: "ทดสอบ",
    nameEn: "Test",
    path: null,
    icon: null,
    sortOrder: 99,
    parentId: null,
  };

  for (const menuType of ["MAIN", "MENU", "BUTTON"]) {
    const code = `TEST_MT_${menuType}_${Date.now()}`.slice(0, 30);
    const r = await req(
      "POST",
      "/api/v1/menus",
      { ...baseFields, code, menuType },
      token,
    );
    console.log(`menuType=${menuType} → ${r.status}`);
    if (r.status >= 400) console.log("  body:", JSON.stringify(r.body).slice(0, 200));
    if (r.status === 201) {
      const id = r.body.data?.id;
      if (id) await req("DELETE", `/api/v1/menus/${id}`, null, token);
    }
  }

  // Also test that the OLD bad values are rejected (regression check)
  console.log("\nRegression — old menuType values should be rejected:");
  for (const menuType of ["SUB", "GROUP", "EXTERNAL"]) {
    const code = `TEST_OLD_${menuType}_${Date.now()}`.slice(0, 30);
    const r = await req(
      "POST",
      "/api/v1/menus",
      { ...baseFields, code, menuType },
      token,
    );
    console.log(`menuType=${menuType} → ${r.status} (expected 400)`);
  }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
