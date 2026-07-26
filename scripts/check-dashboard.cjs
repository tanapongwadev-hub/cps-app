// Quick check — does the dashboard page compile & respond?
const http = require("http");

http
  .get("http://localhost:3000/dashboard", (res) => {
    console.log("STATUS:", res.statusCode);
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      // Look for "สวัสดี" or error
      if (res.statusCode === 200) {
        const hasHero = body.includes("สวัสดี") || body.includes("dashboard") || body.includes("ภาพรวม");
        console.log("HAS_HERO_TEXT:", hasHero);
        if (!hasHero) console.log("BODY_HEAD:", body.slice(0, 500));
      } else {
        console.log("BODY:", body.slice(0, 500));
      }
    });
  })
  .on("error", (e) => console.error("ERR:", e.message));
