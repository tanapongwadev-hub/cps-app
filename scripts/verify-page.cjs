// Verify the page renders correctly with hidden menus
const http = require("http");

http
  .get("http://localhost:3000/system/menu-management", (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log("STATUS:", res.statusCode);
      // Look for the page heading
      console.log("HAS_HEADING:", body.includes("จัดการเมนู"));
      // Look for the create button
      console.log("HAS_ADD_BTN:", body.includes("เพิ่มเมนู"));
    });
  })
  .on("error", (e) => console.error("ERR:", e.message));
