const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { headingAlignment } = require("../services/sectionHeading.js");

const root = path.join(__dirname, "..");
const fiori = fs.readFileSync(path.join(root, "knowledge/s4hana/s4hana-security.md"), "utf8");
const publicMissingApp = fiori.match(/Resolution — Public Edition only:[\s\S]*?(?=\n\nFor the same missing-app symptom)/)?.[0];
const privateMissingApp = fiori.match(/For the same missing-app symptom on Private Edition[\s\S]*?(?=\n\n## |$)/)?.[0];
assert.ok(publicMissingApp, "Public Edition missing-app procedure is independently retrievable");
assert.doesNotMatch(publicMissingApp, /\bPFCG\b|\/UI2\/FLPCM/, "Public Edition procedure must not contain ABAP transactions");
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
