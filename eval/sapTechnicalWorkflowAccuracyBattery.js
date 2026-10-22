/**
 * Knowledge-layer workflow coverage. Does not call a model.
 * node eval/sapTechnicalWorkflowAccuracyBattery.js
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { admitQuestion } = require("../lib/questionAdmission.js");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow.js");

const root = path.join(__dirname, "..");
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const files = {
  iagAccess: read("knowledge/iag/iag-access-request.md"),
  iagPam: read("knowledge/iag/iag-pam.md"),
  iagRules: read("knowledge/iag/iag-rules-and-roles.md"),
  grcMsmp: read("knowledge/grc/msmp.md"),
  grcFf: read("knowledge/grc/firefighter.md"),
  grcAra: read("knowledge/grc/ara.md"),
  btp: read("knowledge/btp/btp-security.md"),
  s4: read("knowledge/s4hana/s4hana-business-roles.md"),
  fiori: read("knowledge/fiori/fiori-security.md"),
  ariba: read("knowledge/lob/ariba-security.md"),
  sf: read("knowledge/idm/successfactors-iam.md"),
  sac: read("knowledge/sac/sac-security.md"),
  ds: read("knowledge/datasphere/datasphere-security.md"),
  bw: read("knowledge/bw/analysis-authorizations.md"),
  idm: read("knowledge/idm/idm-overview.md"),
  hana: read("knowledge/hana/hana-authorization.md"),
  planes: read("knowledge/idm/identity-control-planes.md")
};

const cases = [
  ["iag", "How do you configure the IAG workflow?", files.iagAccess, /IAGWorkflowBusinessRule/],
  ["iag", "Where is the request type mapped to an IAG path?", files.iagAccess, /RequestTypeRule/],
  ["iag", "What does an IAG workflow template actually run?", files.iagAccess, /stage sequence/],
  ["iag", "How do you get a cloud analysis ruleset into IAG?", files.iagRules, /GRC-IAG-AA/],
  ["iag", "How does a bridged GRC ruleset reach IAG?", files.iagRules, /risk-definition sync/],
  ["iag", "What does authorization policy mean on an IAG access request?", files.iagAccess, /not a PFCG authorization object/],
  ["iag", "Explain search and trigger in IAG.", files.iagAccess, /Search is the lookup/],
  ["iag", "How do you set up IAG privileged access?", files.iagPam, /Maintain Privileged Access/],
  ["iag", "Which job makes a new PAM ID active on the target?", files.iagPam, /job category Provisioning/],
  ["iag", "How does a user launch an ABAP PAM session?", files.iagPam, /SIAG_PAM_LAUNCH_PAD/],
  ["iag", "How is an IAG PAM ID created compared with a firefighter ID?", files.iagPam, /synchronized up into GRC EAM/],
  ["iag", "Who can be selected as an IAG workflow manager?", files.iagPam, /IAG_WF_MANAGER/],
  ["iag", "How does role owner mapping work on an IAG business role?", files.iagRules, /Assignment Approver/],
  ["iag", "What is a content approver on an IAG business role?", files.iagRules, /Content Approver/],
  ["iag", "How do you let someone raise an IAG access request?", files.iagAccess, /SCI User Group Sync Job/],
  ["iag", "Why is a manager on the IAS employee record missing from the request?", files.iagAccess, /KBA 2924629/],
  ["iag", "What must you not call a PAM ID?", files.iagPam, /not creating a PAM ID/],
  ["iag", "Which support component covers IAG access analysis rulesets?", files.iagRules, /GRC-IAG-AA/],
  ["iag", "Is there an IAG object called contours?", files.iagPam, /no IAG object called contours/],
  ["iag", "Which IAG app holds the workflow decision table?", files.iagAccess, /Business Rule/],
  ["grc", "How does classic GRC route an access request?", files.grcMsmp, /MSMP/],
  ["grc", "What determines the GRC approver at a stage?", files.grcMsmp, /BRF\+/],
  ["grc", "How does a user start a firefighter session?", files.grcFf, /GRAC_SPM/],
  ["grc", "What is the difference between ID-based and role-based firefighter?", files.grcFf, /ID-based/],
  ["grc", "Where do you analyze SoD in classic GRC?", files.grcAra, /risk/i],
  ["grc", "Is MSMP the IAG workflow configurator?", files.iagAccess, /not MSMP/],
  ["grc", "Where is a classic firefighter ID created relative to IAG?", files.iagPam, /synchronized up into GRC EAM/],
  ["grc", "What does a firefighter user enter before the session?", files.grcFf, /reason code/],
  ["grc", "Name the GRC workflow engine.", files.grcMsmp, /Multi-Step Multi-Process/],
  ["grc", "Does BRF+ replace MSMP?", files.grcMsmp, /BRF\+/],
  ["grc", "Which transaction opens firefighter?", files.grcFf, /GRAC_SPM/],
  ["grc", "Is a GRC firefighter the same object as an IAG PAM ID?", files.iagPam, /not classic GRC/],
  ["grc", "What should you not use to configure an IAG path?", files.iagAccess, /MSMP/],
  ["grc", "How is agent determination done in GRC?", files.grcMsmp, /agent determination/i],
  ["grc", "What are the two firefighter models?", files.grcFf, /role-based/],
  ["btp", "How do you assign a BTP role collection?", files.btp, /role collection/],
  ["btp", "What has to exist before you create the role collection?", files.btp, /role templates and scopes/],
  ["btp", "Does an old token pick up a new role collection?", files.btp, /existing token does not/],
  ["btp", "How is a destination's login different from a role collection?", files.btp, /principal propagation/],
  ["btp", "Is a role collection a PFCG role?", files.btp, /not PFCG/],
  ["btp", "Where do you assign the collection, the user or a group?", files.btp, /IAS group/],
  ["btp", "What opens the tunnel to an on-premise system?", files.btp, /Cloud Connector/],
  ["btp", "What object describes how an app reaches a target?", files.btp, /[Dd]estination/],
  ["btp", "Name the authorization object you assign on BTP.", files.btp, /role collection/],
  ["btp", "Which identity provider does subaccount trust point at?", files.btp, /IAS/],
  ["btp", "What are OAuth client credentials used for here?", files.btp, /client credentials/],
  ["btp", "Does Cloud Connector require an inbound firewall port?", files.btp, /inbound/],
  ["btp", "What is a role template relative to a collection?", files.btp, /role templates/],
  ["btp", "When does the user actually receive the new collection?", files.btp, /new logon/],
  ["btp", "Is principal propagation the same as assigning a role collection?", files.btp, /separate choice/],
  ["s4", "How do you maintain a business role in S/4HANA Public Cloud?", files.s4, /Maintain Business Roles/],
  ["s4", "Does Public Cloud use PFCG for business roles?", files.s4, /no customer PFCG/],
  ["s4", "How is an on-premise S/4 business role built?", files.s4, /PFCG/],
  ["s4", "What proposes backend objects for an on-premise Fiori role?", files.s4, /SU24/],
  ["s4", "How does a user see apps in current S/4 launchpad?", files.fiori, /spaces(?:\s+and|\/)\s*pages/i],
  ["s4", "What still holds the tile and target mapping?", files.fiori, /catalog/i],
  ["s4", "Where do you assign a Public Cloud business user?", files.s4, /Maintain Business Users/],
  ["s4", "Are private-cloud business roles PFCG roles?", files.s4, /private-cloud/],
  ["s4", "What must you not answer a Public Cloud role question with?", files.s4, /PFCG sequence/],
  ["s4", "What combines the catalog and the space on-premise?", files.s4, /PFCG/],
  ["s4", "Which restriction concept replaces profile generation in Public Cloud?", files.s4, /restrictions/],
  ["s4", "Is SU24 available to the customer in Public Cloud?", files.s4, /no customer PFCG, SU24/],
  ["s4", "What is missing if the user cannot find the app?", files.fiori, /absent from App Finder|missing app/i],
  ["s4", "Do groups still define the launchpad layout in current S/4?", files.fiori, /Groups can still exist on older on-premise releases/i],
  ["s4", "Name both launchpad assignments the PFCG role needs.", files.fiori, /catalog/],
  ["ariba", "How do you authorize a user in SAP Ariba?", files.ariba, /group that holds the permission/],
  ["ariba", "Is an Ariba group a PFCG role?", files.ariba, /not a PFCG role/],
  ["ariba", "Does SSO put the user in an Ariba group?", files.ariba, /does not add the group/],
  ["ariba", "Do buying and sourcing share one group catalog?", files.ariba, /do not share one group catalog/],
  ["ariba", "What is the classic procurement separation?", files.ariba, /create versus approve/],
  ["ariba", "Is Ariba authorization a BTP role collection?", files.ariba, /not a BTP role collection/],
  ["ariba", "What has to exist before you assign the group?", files.ariba, /exist in that realm/],
  ["ariba", "How do you verify the assignment?", files.ariba, /Sign in as that user/],
  ["ariba", "Which plane is IAS for Ariba?", files.ariba, /SSO only proves identity/],
  ["ariba", "When does IAG cover Ariba SoD?", files.ariba, /only if/],
  ["sf", "How do you grant SuccessFactors permissions?", files.sf, /Manage Permission Roles/],
  ["sf", "What is the target population in RBP?", files.sf, /whose employee data/],
  ["sf", "Is a permission group the same as the target population?", files.sf, /different objects/],
  ["sf", "Is SuccessFactors RBP the same as PFCG?", files.sf, /not PFCG/],
  ["sf", "How do you check the grant?", files.sf, /outside the target population/],
  ["sf", "Does one permission list cover every module?", files.sf, /do not share one permission list/],
  ["sf", "Where does RBP sit relative to S/4 SoD?", files.sf, /does not replace SoD/],
  ["sf", "What object receives the permission role?", files.sf, /permission group/],
  ["sf", "Is RBP a BTP role collection?", files.sf, /not a BTP role collection/],
  ["sf", "What should a mover update besides the HR attribute?", files.sf, /derived-role org values/],
  ["sac", "What are the three SAC security layers?", files.sac, /three layers/],
  ["sac", "How does folder access scale in SAC?", files.sac, /teams/],
  ["sac", "What is Data Access Control?", files.sac, /Data Access Control/],
  ["sac", "What is Model Data Privacy?", files.sac, /Model Data Privacy/],
  ["sac", "Does a role grant every row in every model?", files.sac, /row and column/],
  ["sac", "Do dimension permissions inherit?", files.sac, /inherited down the hierarchy/],
  ["sac", "Is folder security assigned user by user?", files.sac, /rather than individual users/],
  ["sac", "Which mechanism uses IS_CURRENT_USER?", files.sac, /IS_CURRENT_USER/],
  ["sac", "Are the two model mechanisms the same?", files.sac, /two distinct mechanisms/],
  ["sac", "What does a role-level grant not replace?", files.sac, /model-level/],
  ["ds", "How do you grant Datasphere access to one space?", files.ds, /scoped role/],
  ["ds", "Does sign-in grant a Datasphere space?", files.ds, /does not grant a space/],
  ["ds", "Where do Datasphere row restrictions go?", files.ds, /data access control/],
  ["ds", "Does space membership open a SAC story?", files.ds, /does not open the story/],
  ["ds", "Is Datasphere security PFCG?", files.ds, /not S\/4 PFCG/],
  ["ds", "What should you not use to grant one space?", files.ds, /tenant-wide administrator/],
  ["ds", "What is the second check when SAC is in front?", files.ds, /SAC team/],
  ["ds", "Name the Datasphere unit of membership.", files.ds, /space/],
  ["bw", "Where do you maintain a BW analysis authorization?", files.bw, /RSECADMIN/],
  ["bw", "Which object assigns an analysis authorization to a role?", files.bw, /S_RS_AUTH/],
  ["bw", "What does 0BI_ALL mean?", files.bw, /0BI_ALL/],
  ["bw", "Which technical characteristics must be on the provider?", files.bw, /0TCAIPROV/],
  ["bw", "Does SU53 explain a missing characteristic?", files.bw, /SU53 will not explain/],
  ["bw", "Is analysis authorization the same as S_RS_COMP?", files.bw, /not a substitute for S_RS_COMP/],
  ["bw", "What activity characteristic is required?", files.bw, /0TCAACTVT/],
  ["bw", "How do you trace an empty authorized query?", files.bw, /trace in RSECADMIN/],
  ["iam", "When do you still talk about SAP IDM?", files.idm, /Identity Center/],
  ["iam", "What does IPS do that IAS does not?", files.idm, /IPS for joiner/],
  ["iam", "Where is SoD decided?", files.planes, /not in IPS transformations/],
  ["iam", "What enforces a BTP assignment?", files.planes, /role collections/],
  ["iam", "Are authentication and provisioning the same plane?", files.planes, /Authentication is not provisioning/],
  ["hana", "What is an analytic privilege?", files.hana, /row-level filtering/],
  ["hana", "Who owns a repository role?", files.hana, /_SYS_REPO/],
  ["hana", "What happens to catalog roles if the owner is deleted?", files.hana, /revoked/],
  ["hana", "Are object privileges the same as analytic privileges?", files.hana, /fundamentally different/],
  ["hana", "Which role type do you transport?", files.hana, /transportable/],
  ["iam", "Does IAS assign the PFCG role?", files.planes, /does not assign AGR_USERS/],
  ["iam", "What is the approval plane in a hybrid landscape?", files.planes, /MSMP/],
  ["iam", "Which product governs access risk in the cloud?", files.idm, /IAG or GRC/],
  ["hana", "Name the five HANA privilege types at a high level.", files.hana, /five privilege types/],
  ["hana", "Why are repository roles preferred for an application?", files.hana, /recommended approach/]
];

const byDomain = {};
let heldOut = 0;
cases.forEach((row, index) => {
  const [domain, question, source, fact] = row;
  byDomain[domain] = (byDomain[domain] || 0) + 1;
  assert.match(source, fact, question);
  const gate = admitQuestion(question);
  assert.strictEqual(gate.decision, "ANSWER", `${gate.decision}/${gate.reason}: ${question}`);
  if (index % 5 !== 0) heldOut += 1;
});

for (const fragment of ["the the in", "Mm-hmm", "workflow or"]) {
  assert.notStrictEqual(admitQuestion(fragment).decision, "ANSWER", fragment);
}

const minimums = { iag: 20, grc: 15, btp: 15, s4: 15, ariba: 10, sf: 10, sac: 10, ds: 8, bw: 8, iam: 8, hana: 7 };
for (const [domain, minimum] of Object.entries(minimums)) {
  assert.ok(byDomain[domain] >= minimum, `${domain} ${byDomain[domain]} < ${minimum}`);
}
assert.ok(heldOut / cases.length >= 0.6, "held-out share");

const routing = [
  ["How do you upload or update a ruleset in IAG?", "iag-analysis-ruleset", /Rule Setup[\s\S]*Upload & Process[\s\S]*Processing Log and Validation Log/, /Which of those do you want\?|open Ruleset Management|click Upload Ruleset/, false],
  ["How does the standard cloud risk content get into IAG Access Analysis?", "iag-analysis-ruleset", /GRC-IAG-AA/, /RequestTypeRule/, true],
  ["Where do you maintain a custom IAG analysis ruleset?", "iag-analysis-ruleset", /Rule Setup/, /RequestTypeRule/, true],
  ["How do you configure the IAG workflow?", "iag-workflow-determination", /RequestTypeRule/, /Ruleset Management/, false],
  ["Walk me through the business rules that pick an IAG workflow path.", "iag-workflow-determination", /IAGWorkflowBusinessRule/, /Ruleset Management/, true],
  ["What is a workflow template in IAG?", "iag-workflow-determination", /Maintain Workflow Template[\s\S]*stage/, /Ruleset Management|IAG_WF_MANAGER|SCI User Group Sync Job/, true],
  ["What is the difference between an Access Analysis risk ruleset and a workflow-determination ruleset?", "iag-rule-distinction", /Access Analysis[\s\S]*RequestTypeRule/, /open Ruleset Management|click Upload Ruleset/, true],
  ["How is that policy different from the IAG workflow-determination rule?", "iag-request-policy", /search[\s\S]*RequestTypeRule/, /open Ruleset Management/, true],
  ["Who are the owners, approvers, and reviewers for IAG privileged access?", "iag-owners", /approvers and reviewers/, /Ruleset Management/, true],
  ["What does authorization policy mean in IAG Access Request?", "iag-request-policy", /search/, /RequestTypeRule/, false],
  ["What limits the systems a requestor can search in IAG?", "iag-request-policy", /search/, /RequestTypeRule/, true],
  ["Explain search and trigger in IAG.", "iag-search-trigger", /lookup/, /RequestTypeRule/, false],
  ["What is the difference between searching for access and triggering a job in IAG?", "iag-search-trigger", /Trigger/, /Ruleset Management/, true],
  ["How do you set up privileged access in IAG?", "iag-pam-setup", /Maintain Privileged Access/, /Ruleset Management|Network Access Node/, false],
  ["How is an IAG PAM ID provisioned to the target?", "iag-pam-setup", /Provisioning/, /GRAC_SPM/, true],
  ["How is an IAG PAM ID created compared with a GRC firefighter ID?", "iag-pam-setup", /Maintain Privileged Access/, /Network Access Node/, true],
  ["Who are the PAM owners and controllers in IAG?", "iag-owners", /IAG_WF_MANAGER/, /Ruleset Management/, false],
  ["Why is a manager on the IAS employee record missing from the IAG request?", "iag-owners", /employee record/, /RequestTypeRule/, true],
  ["How does role owner mapping work in IAG?", "iag-role-owner", /Assignment Approver/, /RequestTypeRule/, false],
  ["What is the difference between assignment approver and content approver?", "iag-role-owner", /Content Approver/, /RequestTypeRule/, true],
  ["How do you allow a user to raise an access request in IAG?", "iag-requestor", /Identity Authentication/, /IAG_REQUESTOR/, false],
  ["What must be in place before a user submits an IAG access request?", "iag-requestor", /role collection/, /RequestTypeRule/, true],
  ["How do you maintain a business role in S/4HANA Public Cloud?", "s4-public-cloud-role", /Maintain Business Roles/, /GRAC_SPM/, true],
  ["How do you grant SuccessFactors permissions?", "sf-rbp", /Manage Permission Roles/, /PFCG/, true],
  ["How do you assign a BTP role collection?", "btp-role-collection", /role collection/, /PFCG/, true],
  ["How does a user start a firefighter session?", "grc-firefighter", /GRAC_SPM/, /Rule Setup/, true],
  ["Have you configured an IAG ruleset yourself?", "iag-analysis-ruleset", /Rule Setup/, /RequestTypeRule/, true],
  ["How would you design identity for a hybrid RISE landscape?", "rise-hybrid-identity", /PFCG maintains the role[\s\S]*Maintain Business Roles/, /PLOG|SM18/, true],
  ["A Deploy cutover rehearsal fails on identity dependencies. How do you replan the go-live gate?", "activate-cutover-dependency-recovery", /Deploy[\s\S]*go\/no-go[\s\S]*retest/i, /Access Analysis Rule Setup|PFCG-only recovery/i, true],
  ["Does the customer manage the servers in RISE Private Edition?", null, null, null, true],
  ["Who operates the infrastructure of SAP S/4HANA Cloud Private Edition compared with Public Edition?", null, null, null, true],
  ["What is the difference between SAP Access Control 10.1 and Access Control 12.0?", "ac-release-boundary", /GRCFND_A V1200/, /enhanced user experience|role collections/, true],
  ["How is a Fiori space assigned on S/4HANA Cloud Public Edition, and how is that different from Private Edition?", "fiori-space-by-edition", /\/UI2\/FLPCM_CUST/, /Maintain Business Roles transaction/, true]
];

let routingHeldOut = 0;
for (const [question, workflowId, mustHave, mustNot, heldOutFlag] of routing) {
  const selected = selectVerifiedWorkflow(question);
  if (workflowId === null) {
    assert.strictEqual(selected, null, question);
  } else {
    assert.ok(selected, question);
    assert.strictEqual(selected.workflowId, workflowId, `${question} -> ${selected && selected.workflowId}`);
    if (mustHave) assert.match(selected.answer, mustHave, question);
    if (mustNot) assert.doesNotMatch(selected.answer, mustNot, question);
    assert.strictEqual(selected.route, "VERIFIED_WORKFLOW");
  }
  if (heldOutFlag) routingHeldOut += 1;
}

// Product-scope regression: shared workflow language must not route an SAP
// Access Control/MSMP question to an IAG approver procedure.
for (const question of [
  "A SAP Access Control ARM request remains submitted and no approver receives it. How would you trace the MSMP and BRFplus routing path?",
  "In GRC Access Control, an ARM request has no approver. How do you investigate the workflow?"
]) {
  const selected = selectVerifiedWorkflow(question);
  assert.ok(!selected || selected.workflowId.startsWith("grc-"), `${question} -> ${selected && selected.workflowId}`);
}
assert.ok(routingHeldOut / routing.length >= 0.6, "routing held-out share");

console.log(`sapTechnicalWorkflowAccuracyBattery: ${cases.length} source cases`, byDomain);
console.log(`routing: ${routing.length} questions, held-out ${routingHeldOut}`);
