const { generateAnswer } = require("./lib/generateAnswer");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const JD = `Head of Global SAP IT Security & Compliance. Landscape: S/4, SuccessFactors, BW/4, SAC, Datasphere, Ariba, CAR, BTP, RISE. Planes: SF=HR attributes; IAS=authn; IPS=provisioning; IAG=governance; app=enforcement.`;

const cases = [
  { id: "IAS", q: "What belongs in IAS versus what must stay in S/4 or BTP when you federate a corporate IdP?", must: [/authenticat|federation|SSO|MFA|trust/i], mustNot: [/role collections in IAS|IAS hosts PFCG|IAS.*SoD ruleset/i] },
  { id: "IPS_IAG", q: "Where does IPS fit in joiner handling, and what does it not decide?", must: [/IPS|provision/i], mustNot: [/IPS approves SoD|IPS authenticates/i] },
  { id: "JML", q: "If an employee is promoted into a new division, how should their SAP and non-SAP access change end to end?", must: [/deprovision|remove|reconcile|old/i] },
  { id: "ROLE", q: "You inherit several thousand overlapping SAP roles. How would you rationalize them without wrapping everything into new composites?", must: [/AGR_USERS|usage|mine|SUIM|ST03/i], mustNot: [/wrap.*composite.*cleanup|composites are the cleanup/i] },
  { id: "EXCEL", q: "I give you a 50,000-row user-role extract. How do you assess data quality before recommending remediation?", must: [/duplicate|source|reconcil|inactive|SoD/i] },
  { id: "RISE", q: "In RISE with SAP, who owns IAS trust configuration and PFCG after go-live?", must: [/customer (owns|retain)/i] },
  { id: "HYPER", q: "How do you run SAP security hypercare in week one after S/4 go-live?", must: [/SUIM|Firefighter|PFUD|IPS/i], mustNot: [/SU53 as cutover|sign off because SU53/i] },
  { id: "ARIBA", q: "How is access actually controlled inside an Ariba realm, and how does that connect to enterprise IAM?", must: [/group|permission|realm/i], mustNot: [/PFCG role in Ariba|Ariba catalogs in PFCG/i] },
  { id: "CAR", q: "How would you secure SAP Customer Activity Repository POS data versus downstream SAC reporting?", must: [/HANA|analytic privilege|POS/i], mustNot: [/PFCG catalog for CAR/i] },
  { id: "SAC", q: "How do you design authorization for SAP Analytics Cloud stories versus live Datasphere data?", must: [/team|folder|story/i] },
  { id: "BW", q: "How do Analysis Authorizations differ from PFCG execute access in BW/4HANA?", must: [/RSECADMIN|S_RS_AUTH|characteristic/i] },
  { id: "SF_RBP", q: "How do SuccessFactors role-based permissions differ from S/4 PFCG for a hire?", must: [/RBP|permission/i], mustNot: [/RBP replaces SoD|SF RBP is PFCG/i] },
  { id: "IAG", q: "Should we replace GRC Access Control with IAG just because we are moving to RISE?", must: [/IAG|GRC/i] },
  { id: "S4", q: "Explain S/4HANA Fiori business roles and where CDS DCL fits. Do not invent product names.", must: [/catalog|PFCG|DCL/i], mustNot: [/Dynamic Authorization Control Language/i] },
  { id: "PMP", q: "A finance stakeholder is blocking a SoD remediation decision two weeks before go-live. How do you handle it?", must: [/stakeholder|risk|escalat|trade-off|I would/i] },
  { id: "BEH", q: "Tell me about a time you personally resolved a production access incident last year.", must: [/Fortune 500|manufacturing|8,700|hypercare|I would|my method/i], mustNot: [/ticket INC|Acme Corp|last year I resolved ticket/i] }
];

function score(item, answer) {
  const fails = [];
  for (const re of item.must || []) {
    if (!re.test(answer)) fails.push("missing " + re);
  }
  for (const re of item.mustNot || []) {
    if (re.test(answer)) fails.push("forbidden " + re);
  }
  return fails;
}

(async () => {
  let failed = 0;
  for (const item of cases) {
    const r = await generateAnswer(item.q, {
      candidateResume: CANDIDATE_BACKGROUND,
      jobDescription: JD
    });
    const fails = score(item, r.answer || "");
    const status = fails.length ? "FAIL" : "OK";
    if (fails.length) failed += 1;
    console.log("\n==== " + item.id + " " + status + " (" + r.latencyMs + "ms) ====");
    console.log(r.answer);
    if (fails.length) console.log("FLAGS: " + fails.join("; "));
  }
  console.log("\nSUMMARY failed=" + failed + "/" + cases.length);
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
