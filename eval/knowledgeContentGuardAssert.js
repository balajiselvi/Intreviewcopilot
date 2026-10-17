const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { headingAlignment } = require("../services/sectionHeading.js");

const root = path.join(__dirname, "..");
const authorizationErrors = fs.readFileSync(path.join(root, "knowledge/troubleshooting/authorization-errors.md"), "utf8");
const su53Definition = authorizationErrors.match(/## SU53: What It Shows and What It Does Not Prove[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(su53Definition, "SU53 has a directly retrievable definition and limitation");
assert.match(su53Definition, /recent failed authorization checks/i);
assert.match(su53Definition, /not a simulation or proof/i);
assert.match(su53Definition, /assigned user perform(?:ing)? the intended transaction or application action/i);
assert.match(su53Definition, /Sources? checked 2026-10-17[\s\S]*learning\.sap\.com/i);
const fiori = fs.readFileSync(path.join(root, "knowledge/s4hana/s4hana-security.md"), "utf8");
const publicMissingApp = fiori.match(/## Troubleshooting: Public Edition app is missing[\s\S]*?(?=\n## Troubleshooting: Fiori app opens)/)?.[0];
const privateMissingApp = fiori.match(/## Troubleshooting: Private Edition or on-premise app is missing[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(publicMissingApp, "Public Edition missing-app procedure is independently retrievable");
assert.doesNotMatch(publicMissingApp, /\bPFCG\b|\/UI2\/FLPCM/, "Public Edition procedure must not contain ABAP transactions");
assert.match(publicMissingApp, /App Finder[\s\S]*app is in App Finder[\s\S]*absent from App Finder/i,
  "Public Edition procedure must branch on App Finder before inspecting role and page configuration");
assert.match(publicMissingApp, /2608[\s\S]*SAP Help Portal/i, "the release-scoped App Finder behavior must carry current SAP Help provenance");
assert.doesNotMatch(publicMissingApp, /\/IWFND\/ERROR_LOG|\/IWBEP\/ERROR_LOG|SU53|STAUTHTRACE/,
  "a missing Public Edition app must not share a chunk with opened-app diagnostics");
const fioriPublicProcedure = fs.readFileSync(path.join(root, "knowledge/fiori/fiori-security.md"), "utf8")
  .match(/## Public Edition troubleshooting: app is missing[\s\S]*?(?=\n## |$)/)?.[0];
const cloudPublicProcedure = fs.readFileSync(path.join(root, "knowledge/rise/public-cloud.md"), "utf8")
  .match(/## Troubleshooting[\s\S]*?(?=\n## |$)/)?.[0];
const authorizationDiagnostic = fs.readFileSync(path.join(root, "knowledge/troubleshooting/authorization-errors.md"), "utf8")
  .match(/## Diagnostic Split[\s\S]*?(?=\n## |$)/)?.[0];
for (const [source, procedure] of [
  ["Fiori security", fioriPublicProcedure],
  ["Public Cloud", cloudPublicProcedure],
  ["authorization diagnostics", authorizationDiagnostic]
]) {
  assert.ok(procedure, `${source} must retain its independently retrievable Public Edition content`);
  assert.match(procedure, /App Finder[\s\S]*page|page[\s\S]*App Finder/i,
    `${source} must preserve the App Finder-versus-page diagnostic split`);
  assert.match(procedure, /2608[\s\S]*SAP Help Portal|SAP Help Portal[\s\S]*2608/i,
    `${source} must identify the release and current SAP Help source`);
}
assert.ok(privateMissingApp, "Private Edition/on-premise missing-app procedure is independently retrievable");
assert.match(privateMissingApp, /PFCG[\s\S]*\/UI2\/FLPCM/);
assert.equal(headingAlignment("On SAP S/4HANA Cloud Private Edition, a user cannot see a Fiori app on the launchpad.", "Private Edition: user cannot see a Fiori app"), 1);
assert.equal(headingAlignment("On SAP S/4HANA Cloud Public Edition, a user cannot see a Fiori app on the launchpad.", "Public Edition: user cannot see a Fiori app"), 1);
const fioriKnowledge = require("fs").readFileSync(require("path").join(__dirname, "..", "knowledge/s4hana/s4hana-fiori.md"), "utf8");
assert.match(fioriKnowledge, /App Finder[\s\S]*pages intentionally show only an administrator-selected subset/i);
assert.match(fioriKnowledge, /If the app is in App Finder[\s\S]*If it is not in App Finder/i);

const cutover = fs.readFileSync(path.join(root, "knowledge/rise/rise-cutover.md"), "utf8");
assert.match(cutover, /SAP does not prescribe a universal Friday-to-Monday schedule/i);
assert.match(cutover, /project-specific/i);
assert.doesNotMatch(cutover, /typically[^.]{0,100}(Friday|Monday|48–72|1–2 weeks)/i, "must not state a generic cutover schedule as typical");
assert.match(cutover, /Each step has an owner/i);
assert.match(cutover, /identity\/provisioning dependencies/i);

const ariba = fs.readFileSync(path.join(root, "knowledge/lob/ariba-security.md"), "utf8");
const aribaTriage = ariba.match(/### Troubleshooting: a user can sign in but cannot perform a procurement action[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(aribaTriage, "Ariba access diagnosis has a retrievable symptom-led procedure");
assert.match(aribaTriage, /correct realm/i);
assert.match(aribaTriage, /User Groups view/i);
assert.match(aribaTriage, /Purchasing User[\s\S]*PUR001/);
assert.match(aribaTriage, /Sources checked 2026-10-14[\s\S]*version 2605/i);
assert.doesNotMatch(aribaTriage, /PFCG transaction|\/IWFND\/ERROR_LOG/);

const bw = fs.readFileSync(path.join(root, "knowledge/bw/bw-security.md"), "utf8");
const bwTriage = bw.match(/## Troubleshooting: query runs but returns no data for one user[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(bwTriage, "BW empty-result diagnosis has an independently retrievable procedure");
assert.match(bwTriage, /RSRT or RSRT2[\s\S]*RSECADMIN[\s\S]*final check result/i);
assert.match(bwTriage, /Disable the log after the test/i);
assert.match(bwTriage, /distinct from SU53/i);
assert.match(bwTriage, /query variables and filters[\s\S]*data-load result/i);
assert.match(bwTriage, /Sources checked|Source checked 2026-10-14/);

const ias = fs.readFileSync(path.join(root, "knowledge/btp/ias.md"), "utf8");
const btpAccess = ias.match(/## Troubleshooting: IAS sign-in succeeds but a BTP app denies access[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(btpAccess, "IAS-to-BTP authorization has a distinct technical diagnostic procedure");
assert.match(btpAccess, /Security > Role Collections[\s\S]*custom identity provider[\s\S]*Groups assertion attribute/i);
assert.match(btpAccess, /end the session and sign in again/i);
assert.match(btpAccess, /2026-10-14/);

const hana = fs.readFileSync(path.join(root, "knowledge/hana/hana-authorization.md"), "utf8");
const hanaTriage = hana.match(/## Troubleshooting: SAP HANA insufficient privilege error[\s\S]*?(?=\n## |$)/)?.[0];
assert.ok(hanaTriage, "HANA insufficient-privilege errors have a version-scoped procedure");
assert.match(hanaTriage, /2\.0 SPS 08[\s\S]*GET_INSUFFICIENT_PRIVILEGE_ERROR_DETAILS/);
assert.match(hanaTriage, /error-guid[\s\S]*missing privilege/i);
assert.match(hanaTriage, /not fixed by granting a normal user privilege/i);

console.log("knowledgeContentGuardAssert: edition boundaries, cutover, Ariba, BW, IAS/BTP, and HANA procedures passed");
