const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "knowledge");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function bytes(rel) {
  return fs.statSync(path.join(root, rel)).size;
}

for (const rel of [
  "cloud/oauth.md",
  "cloud/saml.md",
  "cloud/identity-federation.md",
  "cloud/cloud-security.md",
  "cutover/rollback-plan.md",
  "fiori/catalogs.md",
  "fiori/launchpad.md",
  "fiori/spaces-pages.md",
  "hypercare/post-go-live.md",
  "hypercare/knowledge-transfer.md",
  "compliance/sox.md",
  "compliance/gdpr.md",
  "compliance/iso27001.md",
  "compliance/compliance.md",
  "compliance/risk-mitigation.md",
  "grc/msmp.md",
  "grc/brf-plus.md"
]) {
  const text = read(rel);
  assert.ok(text.length > 200, `${rel} is still empty`);
  assert.match(text, /Source checked 2026-10-21|Sources and scope|Source checked/i, `${rel} missing source note`);
  assert.match(text, /^## .+/m, `${rel} missing procedure heading`);
}
assert.match(read("grc/msmp.md"), /Troubleshoot an MSMP access request with no approver/);
assert.match(read("grc/brf-plus.md"), /Configure a BRFplus agent rule for MSMP/);
assert.match(read("compliance/sox.md"), /15 U\.S\.C\. § 7262|Section 404/);
assert.match(read("compliance/gdpr.md"), /Regulation \(EU\) 2016\/679|Article 5/);
assert.match(read("compliance/iso27001.md"), /ISO\/IEC 27001:2022/);

assert.match(read("cloud/oauth.md"), /authorization-code|OpenID Connect|role collections/i);
assert.match(read("cloud/saml.md"), /Identity Authentication|Assertion Consumer|SAP Note 3521979/);
assert.match(read("cloud/identity-federation.md"), /corporate IdP|Identity Directory|does not.*business role/i);
assert.match(read("cutover/rollback-plan.md"), /AGR_USERS|Firefighter|clean SU53/i);
assert.match(read("fiori/catalogs.md"), /Public Edition|PFCG|target mapping/);

assert.equal(bytes("transports/chaRM.md"), 0, "chaRM.md must stay empty until screens are verified");
assert.equal(bytes("transports/release-process.md"), 0, "release-process.md stays empty without a sourced ChaRM/release procedure");

console.log("knowledgeStubCoverageAssert: PASS");
