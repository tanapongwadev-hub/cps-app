// Quick test: does the form's stripped payload get accepted by the backend?
// And does the OLD payload (with isVisible etc.) still 400?
const http = require("http");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = http.request(
      { hostname: "localhost", port: 3001, path, method, headers },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(chunks) });
          } catch {
            resolve({ status: res.statusCode, body: chunks });
          }
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Login
  const login = await request("POST", "/api/v1/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  if (login.status !== 201 && login.status !== 200) {
    console.error("LOGIN FAILED:", login.status, JSON.stringify(login.body));
    return;
  }
  const token = login.body.data.authentication.accessToken;
  console.log("✓ Login OK");

  // 2. Send the CLEAN payload (what the form now sends)
  const code = `TEST_${Date.now()}`.slice(0, 20);
  const clean = await request(
    "POST",
    "/api/v1/menus",
    {
      code,
      nameTh: "ทดสอบ",
      nameEn: "Test",
      menuType: "MAIN",
      path: "/test",
      sortOrder: 99,
      parentId: null,
      icon: null,
    },
    token,
  );
  console.log(`CLEAN payload → ${clean.status}`);
  if (clean.status >= 400) {
    console.log("  body:", JSON.stringify(clean.body).slice(0, 300));
  } else {
    console.log("  ✓ Created:", JSON.stringify(clean.body).slice(0, 300));
    // cleanup — find the id
    const createdId = clean.body?.data?.id;
    if (createdId) await request("DELETE", `/api/v1/menus/${createdId}`, null, token);
  }

  // 3. Send the OLD/UNSUPPORTED payload (what the form used to send)
  const oldPayload = await request(
    "POST",
    "/api/v1/menus",
    {
      code: `TEST_OLD_${Date.now()}`.slice(0, 20),
      nameTh: "ทดสอบเก่า",
      nameEn: "Old Test",
      menuType: "MAIN",
      path: "/old-test",
      sortOrder: 99,
      parentId: null,
      icon: null,
      // These are what the backend rejects:
      isVisible: true,
      isActive: true,
      openInNewTab: false,
      externalUrl: "",
      description: "",
      name: "Old Test",
    },
    token,
  );
  console.log(`OLD/UNSUPPORTED payload → ${oldPayload.status}`);
  if (oldPayload.status >= 400) {
    console.log("  body:", JSON.stringify(oldPayload.body).slice(0, 300));
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
