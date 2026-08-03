// Check if dev server is responding
const http = require("http");
function get(path) {
  return new Promise((resolve) => {
    const r = http.request(
      { hostname: "localhost", port: 3000, path, method: "GET", timeout: 5000 },
      (res) => {
        let c = [];
        res.on("data", (x) => c.push(x));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: Buffer.concat(c).toString() });
        });
      }
    );
    r.on("error", (e) => resolve({ error: e.message }));
    r.on("timeout", () => {
      r.destroy();
      resolve({ error: "timeout" });
    });
    r.end();
  });
}
(async () => {
  const r = await get("/login");
  console.log("status:", r.status, "len:", r.body?.length);
  if (r.status === 200) {
    const match = r.body?.match(/<title>([^<]+)/);
    console.log("title:", match?.[1]);
  } else {
    console.log("body preview:", r.body?.slice(0, 200));
  }
})();
