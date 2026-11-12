const fs = require("fs");
const path = require("path");
const names = [
  "infoproviders.md", "cloud-security.md", "identity-federation.md", "oauth.md", "saml.md",
  "compliance.md", "risk-mitigation.md", "rollback-plan.md", "catalogs.md", "launchpad.md",
  "spaces-pages.md", "knowledge-transfer.md", "post-go-live.md", "client-management.md",
  "delivery-management.md", "team-management.md", "vendor-management.md", "chaRM.md",
  "release-process.md", "transport-management.md", "debugging.md", "job-failures.md", "performance.md"
];
const root = path.join("D:/My Projects/InterviewCopilot/knowledge");
const rows = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (names.includes(entry.name)) {
      rows.push({ file: path.relative(root, full).replace(/\\/g, "/"), bytes: fs.statSync(full).size });
    }
  }
}
walk(root);
const found = new Set(rows.map((row) => path.basename(row.file)));
const missing = names.filter((name) => !found.has(name));
fs.writeFileSync(
  path.join("D:/My Projects/InterviewCopilot/eval/results/_stubBytes.json"),
  JSON.stringify({ rows, missing, nonempty: rows.filter((row) => row.bytes > 0) }, null, 2)
);
console.log(JSON.stringify({ count: rows.length, missing, nonempty: rows.filter((row) => row.bytes > 0).length }));
