// Debug /auth/refresh response shape
const http = require("http");
function req(opts, body) {
  return new Promise((r) => {
    const data = body ? JSON.stringify(body) : null;
    const r2 = http.request(
      {
        host: "localhost",
        port: 3001,
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => r({ status: res.statusCode, body: b }));
      },
    );
    r2.on("error", (e) => r({ error: e.message }));
    if (data) r2.write(data);
    r2.end();
  });
}
(async () => {
  // Login
  const login = await req({ path: "/api/v1/auth/login", method: "POST" }, { username: "superadmin", password: "change-me-secure-password" });
  const env = JSON.parse(login.body);
  const access = env.data.authentication.accessToken;
  const refresh = env.data.authentication.refreshToken;
  console.log("Got tokens. access len:", access.length, "refresh len:", refresh.length);

  // Refresh
  const ref = await req({ path: "/api/v1/auth/refresh", method: "POST" }, { refreshToken: refresh });
  console.log("Refresh status:", ref.status);
  console.log("Refresh body (first 600 chars):", ref.body.slice(0, 600));
  try {
    const refEnv = JSON.parse(ref.body);
    console.log("Top-level keys:", Object.keys(refEnv));
    if (refEnv.data) {
      console.log("data keys:", Object.keys(refEnv.data));
      console.log("data.authentication exists:", !!refEnv.data.authentication);
      if (refEnv.data.authentication) {
        console.log("  - accessToken len:", refEnv.data.authentication.accessToken?.length);
        console.log("  - refreshToken len:", refEnv.data.authentication.refreshToken?.length);
      }
    }
  } catch (e) {
    console.log("Parse error:", e.message);
  }
})();
