const http = require("http");

// Login first
const loginData = JSON.stringify({ username: "superadmin", password: "change-me-secure-password" });
const loginReq = http.request(
  {
    hostname: "localhost",
    port: 3001,
    path: "/api/v1/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginData),
    },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const env = JSON.parse(data);
      const token = env.data?.authentication?.accessToken;
      if (!token) {
        console.log("Login failed:", data);
        return;
      }
      console.log("Got token:", token.slice(0, 30) + "...");

      // Now fetch /dashboard
      const dashReq = http.request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/dashboard",
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
        (dres) => {
          let ddata = "";
          dres.on("data", (c) => (ddata += c));
          dres.on("end", () => {
            console.log("Dashboard status:", dres.statusCode);
            const menuMatches = ddata.match(/จัดการ[^<>"\\]{0,40}/g) || [];
            const unique = [...new Set(menuMatches)];
            console.log("Menu items:", unique.length);
            unique.forEach((m) => console.log("  -", m));
            const hasReal = /REAL/i.test(ddata);
            const hasMock = /MOCK/i.test(ddata);
            console.log("REAL=", hasReal, " MOCK=", hasMock);
            console.log("HTML length:", ddata.length);
            console.log("First 500 chars:", ddata.slice(0, 500));
          });
        },
      );
      dashReq.end();
    });
  },
);
loginReq.write(loginData);
loginReq.end();
