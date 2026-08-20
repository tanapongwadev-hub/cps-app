// Quick health check for Next.js dev server (3000) and NestJS backend (3001).
const http = require("http");
function check(port, path) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "localhost", port, path, method: "GET", timeout: 3000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ port, path, status: res.statusCode, body: body.slice(0, 200) }));
      },
    );
    req.on("error", (e) => resolve({ port, path, error: e.code || e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ port, path, error: "TIMEOUT" });
    });
    req.end();
  });
}
function post(port, path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { host: "localhost", port, path, method: "POST", timeout: 5000, headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve({ port, path, status: res.statusCode, body: b.slice(0, 300) }));
      },
    );
    req.on("error", (e) => resolve({ port, path, error: e.code || e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ port, path, error: "TIMEOUT" }); });
    req.write(data); req.end();
  });
}
(async () => {
  const front = await check(3000, "/");
  const back = await check(3001, "/api/v1/health");
  const login = await post(3001, "/api/v1/auth/login", { username: "superadmin", password: "change-me-secure-password" });
  console.log("Frontend 3000:", front.status ?? front.error, front.body?.slice(0, 80));
  console.log("Backend  3001:", back.status ?? back.error, back.body?.slice(0, 80));
  console.log("Login    3001:", login.status ?? login.error, login.body?.slice(0, 200));
})();
