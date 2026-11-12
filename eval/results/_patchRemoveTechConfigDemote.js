const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "../../lib/procedureRetention.js");
const lines = fs.readFileSync(file, "utf8").split("\n");
const next = lines.filter((line) => !line.includes("technical configuration sequence"));
if (next.length === lines.length) {
  console.log("no demotion line found");
  process.exit(1);
}
fs.writeFileSync(file, next.join("\n"));
console.log("removed technical configuration demotion; lines", lines.length, "->", next.length);
