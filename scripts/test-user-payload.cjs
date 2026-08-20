/**
 * Test the actual user API payload shape.
 *
 * Logs in as superadmin, then probes POST /users with various payload shapes
 * to figure out exactly what the real NestJS backend accepts/rejects.
 *
 * Output: prints status code and response body for each probe.
 */
const http = require("http");

const BASE = "http://localhost:3001/api/v1";

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (data) headers["Content-Length"] = data.length;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            // not JSON
          }
          resolve({ status: res.statusCode, body: json, text });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  // 1) Login
  const login = await request("POST", "/auth/login", {
    username: "superadmin",
    password: "change-me-secure-password",
  });
  console.log("LOGIN status:", login.status);
  if (login.status !== 200 && login.status !== 201) {
    console.log(login.text);
    return;
  }
  const accessToken =
    login.body?.data?.authentication?.accessToken ?? login.body?.accessToken;
  console.log("Got token:", !!accessToken);

  // 2) GET /users to see exact shape
  const list = await request("GET", "/users?page=1&limit=1", null, accessToken);
  console.log("\nGET /users status:", list.status);
  console.log("First user shape:", JSON.stringify(list.body?.items?.[0] ?? list.body?.data?.items?.[0], null, 2)?.slice(0, 1500));

  // 3) Try POST /users with different payloads
  const probes = [
    {
      name: "minimal (username, password, firstName, lastName, email)",
      body: {
        username: "probe1",
        password: "Test1234",
        firstName: "Probe",
        lastName: "One",
        email: "probe1@test.local",
      },
    },
    {
      name: "+ departmentId + roleIds[]",
      body: {
        username: "probe2",
        password: "Test1234",
        firstName: "Probe",
        lastName: "Two",
        email: "probe2@test.local",
        departmentId: null,
        roleIds: [],
      },
    },
    {
      name: "+ roleIds (string)",
      body: {
        username: "probe3",
        password: "Test1234",
        firstName: "Probe",
        lastName: "Three",
        email: "probe3@test.local",
        roleIds: [],
      },
    },
  ];
  for (const p of probes) {
    const r = await request("POST", "/users", p.body, accessToken);
    console.log(`\n--- Probe: ${p.name}`);
    console.log("  status:", r.status);
    console.log("  body:", JSON.stringify(r.body, null, 2)?.slice(0, 800));
  }
})();
