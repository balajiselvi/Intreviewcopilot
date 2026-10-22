/**
 * Principal Architect answer-quality battery.
 *
 * Deterministic by default: routing (intent/scope), source contracts, and
 * same-topic distinctness. Live generation is opt-in (--live or EVAL_LIVE=1)
 * against the real /api/chat single-pass path.
 *
 * Evaluation is dimensional. There is no overall quality score. Keyword
 * presence is never a pass by itself.
 *
 * Unseen paraphrases are the majority. Strings reused from earlier routing
 * batteries are marked seen:true so the mix can be audited.
 */
const fs = require("fs");
const path = require("path");
const { resolveInterviewContext, QUESTION_INTENTS } = require("../lib/interviewContext");
const { DEFAULT_CAREER_BACKGROUND } = require("./lib/careerTimeline");

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const requestedMode = modeArg ? modeArg.slice("--mode=".length) : null;
const LIVE = requestedMode === "live" || (!requestedMode && (process.argv.includes("--live") || process.env.EVAL_LIVE === "1"));
const MODE = requestedMode || (LIVE ? "live" : process.argv.includes("--rescore") ? "rescore" : "offline");
const RESCORE = requestedMode === "rescore" || process.argv.includes("--rescore");
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const inputArg = process.argv.find((arg) => arg.startsWith("--input="));
const defaultStamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUT = path.resolve(outputArg ? outputArg.slice("--output=".length) : path.join(__dirname, "results", `principal-architect-answer-quality-${MODE}-${defaultStamp}.json`));
const INPUT = inputArg ? path.resolve(inputArg.slice("--input=".length)) : null;
const INJECT_FAILURE = process.argv.includes("--test-failure");
const INJECT_LIVE_FAILURE = process.argv.includes("--test-live-failure");
const INJECT_PARTIAL_OUTPUT = process.argv.includes("--test-partial-output");
let outputCreatedByRun = false;
const TARGET_JOB_DESCRIPTION = "Chalhoub Group — Lead, Identity Security & Access Management. SAP S/4HANA IAM/Security workstream. Do not invent Chalhoub experience.";

const I = QUESTION_INTENTS;
const SCOPE = {
  IMPL: "IMPLEMENTATION_WALKTHROUGH",
  INVEST: "STAGE_INVESTIGATION",
  CONFIRM: "EXPERIENCE_CONFIRMATION",
  DIVE: "EXPERIENCE_DEEP_DIVE"
};

function notImplInvest(c) {
  return c.answerScope !== SCOPE.IMPL && c.answerScope !== SCOPE.INVEST;
}
function conceptRoute(c) {
  return notImplInvest(c)
    && c.answerScope !== SCOPE.CONFIRM
    && c.answerScope !== SCOPE.DIVE;
}
function implRoute(c) {
  return c.answerScope === SCOPE.IMPL;
}
function tsRoute(c) {
  return c.answerScope === SCOPE.INVEST;
}
function archRoute(c) {
  return notImplInvest(c)
    && (c.questionIntent === I.REQUEST_FOR_ARCHITECTURE || c.questionIntent === I.DIRECT_QUESTION);
}
function pmpRoute(c) {
  return c.answerScope !== SCOPE.IMPL && c.answerScope !== SCOPE.INVEST;
}
function expConfirmRoute(c) {
  return c.answerScope === SCOPE.CONFIRM || c.questionIntent === I.CONFIRMATION;
}
function expDiveRoute(c) {
  return c.answerScope === SCOPE.DIVE
    || c.questionIntent === I.REQUEST_FOR_EXPERIENCE
    || c.questionIntent === I.REQUEST_FOR_EXAMPLE;
}

const CASES = [
  // --- 10 concept ---
  { id: "CON-01", family: "concept", unseen: true, q: "What is SoD?", route: conceptRoute },
  { id: "CON-02", family: "concept", unseen: false, q: "What exactly is SoD?", route: conceptRoute },
  { id: "CON-03", family: "concept", unseen: true, q: "What is SU53 used for?", route: conceptRoute },
  { id: "CON-04", family: "concept", unseen: true, q: "What is an authorization object?", route: conceptRoute },
  { id: "CON-05", family: "concept", unseen: true, q: "Why is SU24 used?", route: conceptRoute },
  { id: "CON-06", family: "concept", unseen: true, q: "What is the difference between IAS and IPS?", route: (c) => notImplInvest(c) },
  { id: "CON-07", family: "concept", unseen: true, q: "What is a Fiori business role?", route: conceptRoute },
  { id: "CON-08", family: "concept", unseen: true, q: "What is IAG Access Analysis?", route: conceptRoute },
  { id: "CON-09", family: "concept", unseen: true, q: "What is JML in SAP IAM?", route: conceptRoute },
  { id: "CON-10", family: "concept", unseen: true, q: "What does STAUTHTRACE actually show?", route: conceptRoute },

  // --- 10 implementation ---
  { id: "IMP-01", family: "implementation", unseen: true, q: "Take me through creating a derived role for a new company code in PFCG.", route: implRoute },
  { id: "IMP-02", family: "implementation", unseen: true, q: "How would you configure MSMP for an ARM access request path?", route: implRoute },
  { id: "IMP-03", family: "implementation", unseen: false, q: "How would you stand up a new IPS source system for SuccessFactors?", route: implRoute },
  { id: "IMP-04", family: "implementation", unseen: true, q: "Walk me through assigning a Fiori catalog to a business role.", route: implRoute },
  { id: "IMP-05", family: "implementation", unseen: true, q: "How would you set up a mitigating control in GRC ARA?", route: implRoute },
  { id: "IMP-06", family: "implementation", unseen: true, q: "What's the sequence to generate and assign a new single role?", route: implRoute },
  { id: "IMP-07", family: "implementation", unseen: true, q: "How would you wire IAS trust for a BTP subaccount?", route: implRoute },
  { id: "IMP-08", family: "implementation", unseen: true, q: "Walk me through the configuration steps to enable IAG privileged access for a break-glass ID.", route: implRoute },
  { id: "IMP-09", family: "implementation", unseen: true, q: "What's the exact sequence for maintaining SU24 proposals for a custom transaction?", route: implRoute },
  { id: "IMP-10", family: "implementation", unseen: true, q: "Walk me through configuring a joiner job in IPS.", route: implRoute },

  // --- 10 troubleshooting ---
  { id: "TS-01", family: "troubleshooting", unseen: true, q: "A user gets an authorization error after FB01. How would you investigate?", route: tsRoute },
  { id: "TS-02", family: "troubleshooting", unseen: false, q: "How would you troubleshoot a Fiori tile?", route: tsRoute },
  { id: "TS-03", family: "troubleshooting", unseen: true, q: "How would you diagnose an IPS job that creates duplicate users?", route: tsRoute },
  { id: "TS-04", family: "troubleshooting", unseen: true, q: "A GRC access request is approved but the role never appears. What do you look at?", route: tsRoute },
  { id: "TS-05", family: "troubleshooting", unseen: true, q: "Walk me through investigating a user who can post but cannot display the same document.", route: tsRoute },
  { id: "TS-06", family: "troubleshooting", unseen: true, q: "How would you troubleshoot an SoD risk that fires on a clean-looking role?", route: tsRoute },
  { id: "TS-07", family: "troubleshooting", unseen: true, q: "IAS login succeeds but the S/4 session has no roles. How do you isolate that?", route: tsRoute },
  { id: "TS-08", family: "troubleshooting", unseen: true, q: "How would you investigate a STAUTHTRACE that shows RC=4 on S_TABU_DIS?", route: tsRoute },
  { id: "TS-09", family: "troubleshooting", unseen: true, q: "A Fiori tile is visible but the OData call returns 403. How would you diagnose it?", route: tsRoute },
  { id: "TS-10", family: "troubleshooting", unseen: true, q: "How would you troubleshoot a leaver who still has S/4 access the next morning?", route: tsRoute },

  // --- 10 architecture ---
  { id: "ARC-01", family: "architecture", unseen: true, q: "How do you approach SAP S/4HANA role design from scratch?", route: archRoute },
  { id: "ARC-02", family: "architecture", unseen: false, q: "How should identity boundaries sit between IAS, IPS and IAG?", route: archRoute },
  { id: "ARC-03", family: "architecture", unseen: true, q: "Design a GRC Access Control architecture for a multi-ERP landscape.", route: archRoute },
  { id: "ARC-04", family: "architecture", unseen: true, q: "How would you design Fiori security for a new S/4 rollout?", route: archRoute },
  { id: "ARC-05", family: "architecture", unseen: true, q: "How would you architect hybrid IAM for RISE with SAP?", route: archRoute },
  { id: "ARC-06", family: "architecture", unseen: true, q: "Design the JML model across HR, IAS, IPS and the target apps.", route: archRoute },
  { id: "ARC-07", family: "architecture", unseen: true, q: "How would you design SoD governance relative to provisioning?", route: archRoute },
  { id: "ARC-08", family: "architecture", unseen: true, q: "How would you design IAG for SAP and non-SAP applications together?", route: archRoute },
  { id: "ARC-09", family: "architecture", unseen: true, q: "Walk me through the overall security architecture for S/4HANA Cloud.", route: archRoute },
  { id: "ARC-10", family: "architecture", unseen: true, q: "How would you structure approval workflow so SoD is decided before the write?", route: archRoute },

  // --- 8 PMP / governance ---
  { id: "PMP-01", family: "pmp", unseen: true, q: "A vendor delay is affecting the cutover plan. What would you do?", route: pmpRoute },
  { id: "PMP-02", family: "pmp", unseen: false, q: "The steering committee wants to cut two weeks off hypercare. How do you handle that?", route: pmpRoute },
  { id: "PMP-03", family: "pmp", unseen: true, q: "How would you recover a slipping security workstream without dropping quality?", route: pmpRoute },
  { id: "PMP-04", family: "pmp", unseen: true, q: "Two process owners disagree on SoD exception authority. How do you govern that?", route: pmpRoute },
  { id: "PMP-05", family: "pmp", unseen: true, q: "How would you communicate a role-design delay to business sponsors?", route: pmpRoute },
  { id: "PMP-06", family: "pmp", unseen: true, q: "A RAID item on data quality is blocking UAT. What's your next governance action?", route: pmpRoute },
  { id: "PMP-07", family: "pmp", unseen: true, q: "How would you manage resource constraints on the security workstream?", route: pmpRoute },
  { id: "PMP-08", family: "pmp", unseen: true, q: "Change control is being bypassed to hit go-live. How do you respond?", route: pmpRoute },

  // --- 8 experience ---
  { id: "EXP-01", family: "experience", unseen: true, q: "Have you implemented SoD analysis in GRC ARA?", route: expConfirmRoute },
  { id: "EXP-02", family: "experience", unseen: true, q: "Where did you implement IAG access analysis?", route: expDiveRoute },
  { id: "EXP-03", family: "experience", unseen: true, q: "What exactly did you do on the S/4 role landscape?", route: expDiveRoute },
  { id: "EXP-04", family: "experience", unseen: true, q: "What problem did you solve with ARM auto-provisioning?", route: expDiveRoute },
  { id: "EXP-05", family: "experience", unseen: true, q: "What was the outcome of the SoD work you owned?", route: expDiveRoute },
  { id: "EXP-06", family: "experience", unseen: true, q: "What was the outcome of the role redesign you delivered?", route: expDiveRoute },
  { id: "EXP-07", family: "experience", unseen: true, q: "Have you implemented SAP IDM 8.0 Developer Studio?", route: expConfirmRoute },
  { id: "EXP-08", family: "experience", unseen: true, q: "Did you deliver GRC at Chalhoub?", route: expConfirmRoute },

  // --- 8 same-topic intent variants (SoD) ---
  { id: "SOD-01", family: "same-topic", unseen: true, q: "What is SoD?", topic: "SoD", route: conceptRoute },
  { id: "SOD-02", family: "same-topic", unseen: false, q: "What exactly is SoD?", topic: "SoD", route: conceptRoute },
  { id: "SOD-03", family: "same-topic", unseen: true, q: "Why is SoD important?", topic: "SoD", route: conceptRoute },
  { id: "SOD-04", family: "same-topic", unseen: true, q: "Have you implemented SoD?", topic: "SoD", route: expConfirmRoute },
  { id: "SOD-05", family: "same-topic", unseen: true, q: "How would you implement SoD?", topic: "SoD", route: (c) => c.answerScope === SCOPE.IMPL || c.questionIntent === I.REQUEST_FOR_ARCHITECTURE },
  { id: "SOD-06", family: "same-topic", unseen: true, q: "How would you troubleshoot an SoD issue?", topic: "SoD", route: tsRoute },
  { id: "SOD-07", family: "same-topic", unseen: true, q: "Design a GRC SoD architecture.", topic: "SoD", route: archRoute },
  { id: "SOD-08", family: "same-topic", unseen: true, q: "Walk me through what you did on a SoD issue.", topic: "SoD", route: expDiveRoute },

  // --- 10 adversarial technical-precision ---
  { id: "ADV-01", family: "adversarial", unseen: true, q: "Is SU53 a simulation of a role?", route: conceptRoute },
  { id: "ADV-02", family: "adversarial", unseen: true, q: "Should composite roles generally be avoided?", route: archRoute },
  { id: "ADV-03", family: "adversarial", unseen: true, q: "When would you use composite roles versus single and derived roles?", route: (c) => notImplInvest(c) },
  { id: "ADV-04", family: "adversarial", unseen: true, q: "Does IAS provision S/4 roles?", route: conceptRoute },
  { id: "ADV-05", family: "adversarial", unseen: true, q: "Can you prove cutover succeeded with a clean SU53?", route: (c) => true },
  { id: "ADV-06", family: "adversarial", unseen: true, q: "Is ST03N the way you design a role from scratch?", route: archRoute },
  { id: "ADV-07", family: "adversarial", unseen: true, q: "Does a Fiori missing tile mean you start in SU53?", route: (c) => c.answerScope !== SCOPE.IMPL },
  { id: "ADV-08", family: "adversarial", unseen: true, q: "Is IAG the identity provider?", route: conceptRoute },
  { id: "ADV-09", family: "adversarial", unseen: true, q: "How would you design identity boundaries for IAS, IPS and IAG across SAP and non-SAP in a RISE landscape?", route: archRoute },
  { id: "ADV-10", family: "adversarial", unseen: true, q: "What's the difference between a last failed AUTHORITY-CHECK and a system trace?", route: (c) => notImplInvest(c) },

  // Domain coverage that the original 74 did not represent. Routing is not asserted
  // here; these cases exist so the live answer path is audited for each product.
  { id: "DOM-GRC-REL", family: "architecture", unseen: true, q: "What differs between SAP Access Control 10.1 and Access Control 12.0?", route: () => true },
  { id: "DOM-GRC-CONN", family: "implementation", unseen: true, q: "How would you connect ECC so GRC Access Control can run risk analysis?", route: () => true },
  { id: "DOM-GRC-BRF", family: "implementation", unseen: true, q: "How is BRFplus used when you configure MSMP agent determination?", route: () => true },
  { id: "DOM-IAG-WF", family: "implementation", unseen: true, q: "How do you configure an IAG access request workflow?", route: () => true },
  { id: "DOM-IAG-RULE", family: "implementation", unseen: true, q: "How do you upload a ruleset in IAG Access Analysis?", route: () => true },
  { id: "DOM-IAG-CERT", family: "architecture", unseen: true, q: "How does IAG access certification work?", route: () => true },
  { id: "DOM-BTP-RC", family: "architecture", unseen: true, q: "How do SAP BTP role collections differ from S/4HANA PFCG roles?", route: () => true },
  { id: "DOM-BTP-DEST", family: "troubleshooting", unseen: true, q: "A BTP application cannot reach an on-premise system. What do you check in the destination and Cloud Connector?", route: () => true },
  { id: "DOM-S4-ED", family: "architecture", unseen: true, q: "What changes in role administration between SAP S/4HANA Cloud Public Edition and Private Edition?", route: () => true },
  { id: "DOM-S4-VERIFY", family: "architecture", unseen: true, q: "How would you design security for SAP S/4HANA Cloud, and how would you verify that the user has the required access?", route: () => true },
  { id: "DOM-FIORI-MISS", family: "troubleshooting", unseen: true, q: "In SAP S/4HANA Cloud Public Edition, a user cannot see a Fiori app. What do you check first?", route: () => true },
  { id: "DOM-SF", family: "implementation", unseen: true, q: "How are role-based permissions assigned in SAP SuccessFactors?", route: () => true },
  { id: "DOM-ARIBA", family: "troubleshooting", unseen: true, q: "A user can log in to SAP Ariba but cannot create a requisition. What do you check?", route: () => true },
  { id: "DOM-BW", family: "troubleshooting", unseen: true, q: "A BW query returns no data for one user. How do you check analysis authorizations?", route: () => true },
  { id: "DOM-HANA", family: "troubleshooting", unseen: true, q: "A SAP HANA user receives an insufficient privilege error. How do you diagnose it?", route: () => true },
  { id: "DOM-SAC", family: "implementation", unseen: true, q: "How do you assign roles and teams in SAP Analytics Cloud?", route: () => true },
  { id: "DOM-DS", family: "architecture", unseen: true, q: "How is access controlled in SAP Datasphere?", route: () => true },
  { id: "DOM-IDM", family: "architecture", unseen: true, q: "How did SAP Identity Management provisioning differ from SAP IPS?", route: () => true },
  { id: "DOM-ACT", family: "pmp", unseen: true, q: "What do you do during cutover and hypercare on an SAP Activate security workstream?", route: () => true },
  { id: "FOL-01", family: "follow-up", unseen: true, q: "What changes if that same missing app is on SAP S/4HANA Cloud Public Edition?", history: [{ role: "user", content: "A user cannot see a Fiori app on SAP S/4HANA Cloud Private Edition. What do you check?" }], route: () => true },
  { id: "IMP-11", family: "implementation", unseen: true, q: "How would you create a derived role for a different company code?", route: implRoute },
  { id: "FOL-02", family: "follow-up", unseen: true, q: "How would you prove that user can post in the new company code?", history: [{ role: "user", content: "Take me through creating a derived role for a new company code in PFCG." }], route: () => true }
];

const LIVE_IDS = new Set([
  "CON-01", "CON-03", "IMP-01", "TS-01", "ARC-01", "ARC-02",
  "PMP-01", "EXP-01", "EXP-07", "ADV-01", "ADV-02", "ADV-03",
  "SOD-06", "ADV-09"
]);

const ABAP_TOOLS = /\b(SU53|ST01|STAUTHTRACE|SU24|PFCG|SUIM|ST03N|AGR_USERS|AGR_1251|PFUD|SU01|SU21|SU25)\b/g;
const EMPLOYERS_OK = /\b(Dover|Eminnov|Fabtech|Enerlife|Nabati|WMS|MMT|Ascent)\b/i;
const EMPLOYERS_BAD = /\b(Accenture|Chalhoub|Deloitte|PwC|KPMG|EY)\b/i;
const INVENTED_METRIC = /\b(20\s*[-–to]+\s*25\s*percent|10,?000-user|3-day-to-30-minute|70\s*[-–to]+\s*80\s*percent)\b/i;

function incomplete(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  return !/[.!?]"?$/.test(t) || /^(?:the|a|an|to|of|and|or|for|with|by|in|on)$/i.test(t.split(/\s+/).slice(-1)[0]);
}

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function uniqueTools(text) {
  return [...new Set(String(text || "").match(ABAP_TOOLS) || [])];
}

function firstWindowTools(text, n = 40) {
  return uniqueTools(words(text).slice(0, n).join(" "));
}

const ROLE_TABLES = "AGR_USERS|AGR_1251|AGR_1252|AGR_TCODES|AGR_DEFINE";

function unrelatedArtifactProvesOutcome(answer) {
  return String(answer || "").split(/(?<=[.?!])\s+/).some((sentence) => (
    /\b(?:ST03N|AGR_USERS|AGR_1251|AGR_DEFINE)\b/i.test(sentence)
    && /\b(?:confirm\w*|prove\w*|proof|ensur\w*|verif\w*)\b/i.test(sentence)
    && /\b(?:post\w*|business (?:action|transaction)|succeeded|being executed)\b/i.test(sentence)
    && !/\b(?:not|do not|don't|cannot|isn't|is not|does not|only if|if (?:it|the action|any) fails)\b/i.test(sentence)
  ));
}

function su53ProvesSuccess(text) {
  const source = String(text || "");
  const sentences = source.split(/(?<=[.?!])\s+/);
  const instrument = sentences.some((sentence) => {
    if (!/\bSU53\b/i.test(sentence)) return false;
    if (/\b(?:troubleshoot|only if|if any authorization|last failed|not evidence|not proof|does not|do not|cannot|is not|not a simulation|does not store a passed)\b/i.test(sentence)) return false;
    return /\b(?:using|via|through|use)\s+(?:transaction\s+)?SU53\b[\s\S]{0,70}\b(?:to\s+)?(?:confirm|verify|prove|ensure|validate)\b/i.test(sentence)
      || /\bSU53\b[\s\S]{0,50}\bto\s+(?:confirm|verify|prove|ensure|validate)\b/i.test(sentence)
      || /\bSU53\b[\s\S]{0,180}\b(?:verification tool|confirm whether|verify whether|confirm that|verify that)\b[\s\S]{0,100}\b(?:user|access|authorization|action|succeed|success)\b/i.test(sentence)
      || /\b(?:clean|successful)\s+SU53\b[\s\S]{0,160}\b(?:no authorization|functioning as intended|succeeded|success|proves?|confirms?)\b/i.test(sentence)
      || /\b(?:confirm(?:s|ing)?|prove[sd]?|validat(?:e|es|ing)|ensur(?:e|es|ing))\b[\s\S]{0,80}\bSU53\b[\s\S]{0,80}\b(?:without|can access|success|functioning)\b/i.test(sentence);
  });
  const passedCheck = sentences.some((sentence) => {
    if (!/\b(?:SU53|last authorization check)\b/i.test(sentence)) return false;
    if (/\b(?:does not|do not|cannot|is not|not mean|not store)\b/i.test(sentence)) return false;
    return /\b(?:last authorization check|check)\s+passed\b/i.test(sentence)
      || /\bpassed without errors\b/i.test(sentence)
      || /\bdid not fail\b/i.test(sentence);
  });
  return instrument || passedCheck;
}

function s4CloudQuestion(question) {
  const q = String(question || "");
  if (!/\bS\/?4(?:HANA)?\s+Cloud\b/i.test(q)) return false;
  const privateOnly = /\b(?:private\s+(?:cloud\s+)?edition|private\s+cloud|on[- ]premise)\b/i.test(q)
    && !/\bpublic\b/i.test(q);
  return !privateOnly;
}

function publicEditionUsesOnPremStep(question, answer) {
  const q = String(question || "");
  if (!/public edition/i.test(q) || /private edition/i.test(q)) return false;
  return String(answer || "").split(/(?<=[.?!])\s+/).some((sentence) => {
    const onPrem = /\b(?:PFCG|SU53|STAUTHTRACE|\/UI2\/FLPCM_CUST)\b/.test(sentence);
    if (!onPrem) return false;
    return !/\b(?:do not|don't|does not|not involve|not the|not a|not used|not by|private edition|on-premise|on premise)\b/i.test(sentence);
  });
}

function s4CloudUsesForeignAuthorization(question, answer) {
  if (!s4CloudQuestion(question)) return false;
  let privateScope = false;
  return String(answer || "").split(/(?<=[.?!])\s+/).some((sentence) => {
    if (/\bpublic edition\b/i.test(sentence) && !/\b(?:private edition|on-premise|on premise)\b/i.test(sentence)) privateScope = false;
    if (/\b(?:private edition|on-premise|on premise)\b/i.test(sentence)) privateScope = true;
    const foreign = /\b(?:PFCG|SUIM|SU24|AGR_USERS|AGR_1251|role collections?)\b/i.test(sentence);
    if (!foreign || privateScope) return false;
    return !/\b(?:do not|don't|does not|not involve|not the|not a|not used|not by|private edition|on-premise|on premise)\b/i.test(sentence);
  });
}

function s4CloudVerificationMissing(question, answer) {
  const q = String(question || "");
  if (!s4CloudQuestion(q) || !/\b(?:verif|design|architect)\b/i.test(q)) return false;
  const a = String(answer || "");
  return !/Maintain Business Roles/i.test(a)
    || !/Maintain Business Users/i.test(a)
    || !/Display Authorization Trace/i.test(a)
    || !/\b(?:assigned user|business user)\b[\s\S]{0,80}\b(?:perform|complet|execut)/i.test(a);
}

function tableCalledTransaction(text) {
  const table = `(?:${ROLE_TABLES})`;
  const labeled = new RegExp(
    `\\b(?:transactions?|t-codes?)\\s+(?:like|such as|including|named|called)\\s+${table}\\b|\\b(?:transaction|t-code)\\s+${table}\\b|\\b${table}\\s+(?:transaction|t-code)\\b`,
    "gi"
  );
  return String(text || "").split(/(?<=[.?!])\s+/).some((sentence) => {
    labeled.lastIndex = 0;
    return labeled.test(sentence) && !/\b(?:not|aren't|are not)\b[\s\S]{0,40}\btransactions?\b/i.test(sentence);
  });
}

function evaluateLive(c, answer, generation) {
  const failures = [];
  const a = String(answer || "");
  const family = c.family;
  const lower = a.toLowerCase();

  const push = (dimension, owningLayer, evidence) => {
    failures.push({
      question: c.q,
      mode: family,
      relevantResponseContract: c.id,
      actualAnswer: a,
      failureCategory: dimension,
      owningLayer,
      evidence,
      proposedGeneralizedFix: "Inspect the named layer; do not add a phrase-specific rule."
    });
  };

  if (/^#{1,6}\s+|\b(?:direct answer|technical mechanism and exact artifacts|validation and operational boundary|key takeaways)\b/i.test(a)) {
    push("answer contract", "prompt synthesis", "spoken answer used a report heading");
  }
  if (publicEditionUsesOnPremStep(c.q, a)) {
    push("wrong edition", "retrieval or answer construction", "Public Edition answer used an on-premise artifact as a step");
  }
  if (s4CloudUsesForeignAuthorization(c.q, a)) {
    push("wrong edition", "retrieval or answer construction", "S/4HANA Cloud answer used PFCG, SUIM, an AGR table, or a BTP role collection as the authorization design");
  }
  if (s4CloudVerificationMissing(c.q, a)) {
    push("verification evidence", "retrieval or answer construction", "S/4HANA Cloud design did not use Maintain Business Roles, Maintain Business Users, the assigned user performing the app, and Display Authorization Trace");
  }

  if (incomplete(a)) {
    const finish = generation?.finish_reason || "unknown";
    const cap = generation?.maxTokens;
    const used = generation?.completion_tokens;
    const layer = finish === "length" || (cap && used && used >= cap - 4)
      ? "streaming"
      : "model variance";
    push("truncation/completeness", layer, `finish_reason=${finish} completion_tokens=${used} maxTokens=${cap}`);
  }

  if (family === "concept" || c.id === "CON-01" || c.id === "SOD-01") {
    if (EMPLOYERS_OK.test(a) || /\bI (?:implemented|delivered|led|owned|configured)\b/i.test(a)) {
      push("stopping behavior", "prompt synthesis", "concept answer used employer or past-delivery biography");
    }
    if (words(a).length > 220) {
      push("unnecessary verbosity", "prompt synthesis", `concept ${words(a).length} words`);
    }
  }

  if (c.id === "CON-03" || c.id === "ADV-01" || c.id === "ADV-10") {
    if (/\bsu53\b/i.test(a) && /\bsimulat/i.test(a) && !/\bnot\s+(?:a\s+)?(?:role\s+)?simulat/i.test(a)) {
      push("technical terminology precision", "prompt synthesis", "SU53 described as simulation");
    }
    if (c.id === "ADV-01" && /\byes\b/i.test(lower.slice(0, 40)) && /\bsimulat/i.test(a)) {
      push("factual correctness", "prompt synthesis", "answered that SU53 is role simulation");
    }
    if (c.id === "CON-03" && !/\blast (?:failed authorization check|authorization check that failed)s?\b/i.test(a)) {
      push("factual correctness", "knowledge/retrieval", "SU53 definition omitted that it displays the last failed authorization check");
    }
  }

  if (c.id === "ADV-02" || c.id === "ARC-01") {
    if (/\b(?:never use|always avoid|generally (?:avoid(?:ed)?|forbidden)|do not use)\b.{0,50}\bcomposite/i.test(a)
      || /\bcomposite roles?\b.{0,50}\b(?:never|always avoid|generally forbidden)\b/i.test(a)) {
      push("factual correctness", "reasoning contract", "composites stated as generally forbidden");
    }
  }

  if (c.id === "ADV-04") {
    if (/\bias\b.{0,80}\bprovision/i.test(lower) && !/\bias (?:does not|never|only authenticat)/i.test(lower)) {
      push("factual correctness", "prompt synthesis", "IAS described as provisioning");
    }
  }

  if (c.id === "ADV-08") {
    if (/\biag\b.{0,80}\b(?:identity provider|idp)\b/i.test(lower) && !/\bnot\b.{0,40}\b(?:identity provider|idp)\b/i.test(lower)) {
      push("factual correctness", "prompt synthesis", "IAG described as IdP");
    }
  }

  if (family === "architecture" || family === "adversarial" && /^ARC-|^ADV-02|^ADV-06|^ADV-09/.test(c.id)) {
    if (firstWindowTools(a, 35).length >= 3) {
      push("unnecessary tool inventory", "prompt synthesis", `opened with ${firstWindowTools(a, 35).join(",")}`);
    }
  }

  if (uniqueTools(a).length >= 8) {
    push("unnecessary tool inventory", "prompt synthesis", `tool count ${uniqueTools(a).join(",")}`);
  }

  const toolCounts = {};
  for (const m of a.match(ABAP_TOOLS) || []) toolCounts[m] = (toolCounts[m] || 0) + 1;
  const repeated = Object.entries(toolCounts).filter(([, n]) => n >= 8);
  if (repeated.length) {
    push("repetition", "prompt synthesis", repeated.map(([k, n]) => `${k}x${n}`).join(","));
  }

  if (family === "troubleshooting") {
    const tail = a.slice(-280);
    if (/\b(?:implement the fix|validate the fix|deploy the fix|then I would fix|then transport the role)\b/i.test(tail)
      && !/\bunless (?:asked|requested)\b/i.test(tail)) {
      push("premature remediation", "reasoning contract", "investigation closed on remediation");
    }
    if (/\binvestigation discipline\b/i.test(a)) {
      // not a defect
    }
  }

  if (family === "pmp") {
    const asked = new Set(uniqueTools(c.q));
    const unrelated = uniqueTools(a).filter((tool) => !asked.has(tool));
    if (unrelated.length) {
      push("governance alignment", "prompt synthesis", `delivery answer names unrelated configuration transactions: ${unrelated.join(",")}`);
    }
    if (!/\b(?:work\s*plan|critical path|RAID|dependenc(?:y|ies)|accountable|\bowner\b|change[- ]control|quality gate|sponsors?|milestones?|exit criteria|forecast)\b/i.test(a)) {
      push("governance alignment", "answer contract", "delivery answer does not name a project-delivery control");
    }
  }

  if (family === "experience") {
    if (EMPLOYERS_BAD.test(a) && /\bI (?:implemented|delivered|led|worked at)\b/i.test(a) && !/\b(?:did not|have not|haven't|didn't)\b/i.test(a)) {
      push("anti-fabrication", "prompt synthesis", "invented employer as personal delivery");
    }
    if (INVENTED_METRIC.test(a)) {
      push("anti-fabrication", "data", "CV-forbidden metric emitted");
    }
    if (c.id === "EXP-07" && /\byes\b/i.test(lower.slice(0, 80)) && /developer studio/i.test(a) && !/\bnot (?:a )?documented\b/i.test(a)) {
      push("anti-fabrication", "prompt synthesis", "claimed IDM 8.0 Developer Studio delivery");
    }
    if (c.id === "EXP-08" && /\byes\b/i.test(lower.slice(0, 40))) {
      push("anti-fabrication", "prompt synthesis", "claimed Chalhoub delivery");
    }
  }

  if (family === "implementation" && String(a).split(/(?<=[.?!])\s+/).some((sentence) =>
    /\bSU53\b/i.test(sentence)
    && /\b(uat|simulat\w*|test(?:ing)? the role|access testing)\b/i.test(sentence)
    && !/\b(?:not (?:a |role )?simulat|only be used|investigate any failures|last failed)\b/i.test(sentence)
  )) {
    push("technical terminology precision", "prompt synthesis", "SU53 used as role UAT/simulation");
  }

  if (su53ProvesSuccess(a)) {
    push("technical terminology precision", "prompt synthesis", "SU53 presented as proof that access succeeded");
  }
  if (tableCalledTransaction(a)) {
    push("technical terminology precision", "prompt synthesis", "a role table was named as a transaction");
  }
  if (/\bderived\b/i.test(c.q) && /\bcompany[- ]code\b/i.test(c.q)) {
    if (!/\bPFCG\b/.test(a) || !/\b(?:org(?:anizational)? level|company[- ]code)\b/i.test(a)) {
      push("factual correctness", "prompt synthesis", "derived-role answer omitted PFCG or the company-code organizational level");
    }
    if (!/\bderive from role\b/i.test(a) || !/\bmenu\b/i.test(a)) {
      push("factual correctness", "prompt synthesis", "derived-role answer did not use the Derive from Role field or the inherited menu");
    }
    const orgOnDescription = a.split(/(?<=[.?!])\s+/).some((sentence) => (
      /\bdescription tab\b/i.test(sentence)
      && /\b(?:organizational levels?|company[- ]code)\b/i.test(sentence)
      && !/\bnot\b/i.test(sentence)
    ));
    if (orgOnDescription) {
      push("factual correctness", "prompt synthesis", "organizational levels were entered on the Description tab");
    }
    const prescribesCopy = a.split(/(?<=[.?!])\s+/).some((sentence) => (
      /\bcopy role\b/i.test(sentence) || /\bcopy(?:ing)?\s+(?:an |the )?(?:existing )?(?:master|parent) role\b/i.test(sentence)
    ) && !/\b(?:do not|don't|not|instead of|rather than|different)\b/i.test(sentence));
    if (prescribesCopy) {
      push("factual correctness", "prompt synthesis", "derived role was created by copying the role");
    }
  }
  if (/\b(?:prove|proof)\b/i.test(c.q) && unrelatedArtifactProvesOutcome(a)) {
    push("factual correctness", "prompt synthesis", "a usage statistic or assignment table was used as proof of the business action");
  }

  return failures;
}

function sourceContracts() {
  const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
  const planner = fs.readFileSync(path.join(__dirname, "../lib/reasoningPlanner.js"), "utf8");
  const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
  const failures = [];
  const check = (name, ok, evidence) => {
    if (!ok) failures.push({ name, evidence });
  };
  check("define-not-apply-override", !/Open with how you apply this in SAP/.test(prompt), "define requiredElements overwrite still present");
  check("define-structure-what-it-is", /define: "Structure: what it is/.test(prompt), "MODE_STRUCTURES.define missing what-it-is");
  check("simple-definition-diagnostic-boundary", /diagnostic tool, define exactly what evidence it displays/.test(prompt) && /not an invented validation procedure/.test(prompt), "simple factual diagnostic answer lacks an explicit evidence boundary");
  check("impl-su53-not-simulation", /not a simulation of the role/.test(prompt) && /not proof that access succeeded/.test(prompt), "IMPLEMENTATION_WALKTHROUGH missing SU53 distinction");
  check("artifact-type-in-prompt", /a table is not a transaction/.test(prompt) && /tables AGR_USERS/.test(prompt), "prompt does not distinguish role tables from transactions");
  check("cutover-su53-not-proof", /clean SU53 is not cutover proof/i.test(prompt) && /does not store a passed check/.test(prompt), "Cutover template still allows SU53 as success evidence");
  check("derive-from-role-in-prompt", /Derive from Role/.test(prompt) && /independent copy is not derivation/.test(prompt), "role-design prompt still allows Copy Role as derivation");
  check("composites-not-forbidden", /do not state them as generally forbidden/.test(planner), "design contract missing composite conditionality");
  check("finish-reason-captured", /finish_reason/.test(chat), "stream does not record finish_reason");
  check("generation-sse", /writeSSEEvent\(res, "generation"/.test(chat), "generation metadata event missing");
  check("concept-no-cv-first", /This is a concept question\. Reason from the product mechanism/.test(prompt), "concept still selects CV engagement first");
  check("delivery-artifacts-in-prompt", /project-delivery artifacts and controls/.test(prompt) && /must name only the relevant verified/.test(prompt), "delivery and technical mechanism instructions are not both present");
  check("spoken-style-in-prompt", /speak one continuous answer the candidate can say aloud/.test(prompt) && /Do not use Markdown headings/.test(prompt), "prompt still requests report headings");
  const deliveryAnswer = [
    "I would recover the slip by resequencing only the work the critical path can release.",
    "The controls are the integrated workplan, the RAID register, the accountable owner, the change-control record, and the quality gate.",
    "I would measure the forecast milestone, the test exit criteria, and the closure evidence, and I would get sponsor approval before any date trade-off."
  ].join("\n");
  const transactionAnswer = deliveryAnswer.replace(
    "The controls are the integrated workplan, the RAID register, the accountable owner, the change-control record, and the quality gate.",
    "I would utilize ST03N, AGR_USERS, PFCG, and SU24 to document the role changes."
  );
  const technicalAnswer = [
    "I would create the derived role in PFCG by entering the imparting role in Derive from Role.",
    "The derived role inherits the menu and the non-organizational values. I maintain the company-code organizational level on the derived role. Table AGR_1251 holds the authorization values.",
    "I would generate the profile and have the assigned user complete the business transaction for that company code."
  ].join("\n");
  const pmpCase = CASES.find((item) => item.id === "PMP-03");
  const implCase = CASES.find((item) => item.id === "IMP-01");
  const deliveryFailures = evaluateLive(pmpCase, deliveryAnswer, { finish_reason: "stop" });
  const transactionFailures = evaluateLive(pmpCase, transactionAnswer, { finish_reason: "stop" });
  const technicalFailures = evaluateLive(implCase, technicalAnswer, { finish_reason: "stop" });
  check("pmp-delivery-controls-pass", deliveryFailures.length === 0, JSON.stringify(deliveryFailures));
  check("pmp-unrelated-transactions-fail", transactionFailures.some((item) => item.failureCategory === "governance alignment"), JSON.stringify(transactionFailures));
  check("technical-transactions-remain-valid", !technicalFailures.some((item) => item.failureCategory === "governance alignment" || item.evidence.includes("omitted PFCG")), JSON.stringify(technicalFailures));
  const su53SuccessAnswer = technicalAnswer.replace(
    "I would generate the profile and have the assigned user complete the business transaction for that company code.",
    "I would use SU53 to confirm that users assigned to the derived role can access the transactions without encountering authorization errors."
  );
  const failedCheckAnswer = [
    "No. SU53 reports the last failed authorization check.",
    "After an AUTHORITY-CHECK fails, transaction SU53 shows the object and the failed value. It is not proof that access succeeded.",
    "Use it only when the business action fails."
  ].join("\n");
  const su53FalseVerification = [
    "SU53 analyzes authorization failures and displays the last failed check.",
    "It shows the object and checked values after a denial.",
    "The output of SU53 serves as a verification tool for administrators to confirm whether the user has the necessary authorizations to perform a specific action."
  ].join("\n");
  const su53ConceptCase = CASES.find((item) => item.id === "CON-03");
  const falseVerificationFailures = evaluateLive(su53ConceptCase, su53FalseVerification, { finish_reason: "stop" });
  check("su53-general-verification-claim-fails", falseVerificationFailures.some((item) => item.evidence.includes("proof that access succeeded")), JSON.stringify(falseVerificationFailures));
  const su53CorrectConcept = [
    "SU53 is an ABAP authorization-error analysis transaction that displays the user's last failed authorization check.",
    "After reproducing a denial, it shows the failed object and checked values for investigation.",
    "It is failure evidence, not a role simulation or proof that a business action succeeds. Test the intended action with the assigned user."
  ].join("\n");
  const correctConceptFailures = evaluateLive(su53ConceptCase, su53CorrectConcept, { finish_reason: "stop" });
  check("su53-correct-concept-passes", correctConceptFailures.length === 0, JSON.stringify(correctConceptFailures));
  const cloudCase = CASES.find((item) => item.id === "DOM-S4-VERIFY");
  const cloudAbapAnswer = [
    "I would design SAP S/4HANA Cloud security in PFCG and verify the user with SUIM.",
    "AGR_USERS shows the assignment and a BTP role collection grants the app.",
    "User acceptance testing and an authorization trace confirm the access."
  ].join("\n");
  const cloudCorrectAnswer = [
    "For SAP S/4HANA Cloud Public Edition I design the business role in Maintain Business Roles and assign it in Maintain Business Users.",
    "The role carries the business catalogs and the restriction values. Private Edition role maintenance stays in PFCG and is not this path.",
    "The assigned user performs the intended app. Display Authorization Trace then shows successful, failed, or filtered checks. A filtered check is a missing role or restriction value, not proof that the business action succeeded."
  ].join("\n");
  const cloudAbapFailures = evaluateLive(cloudCase, cloudAbapAnswer, { finish_reason: "stop" });
  const cloudCorrectFailures = evaluateLive(cloudCase, cloudCorrectAnswer, { finish_reason: "stop" });
  check("s4-cloud-pfcg-verification-fails", cloudAbapFailures.some((item) => item.evidence.includes("PFCG")), JSON.stringify(cloudAbapFailures));
  check("s4-cloud-business-user-verification-passes", cloudCorrectFailures.length === 0, JSON.stringify(cloudCorrectFailures));
  const tableTransactionAnswer = [
    "I would read the role contents before changing the ruleset.",
    "I would check the assignments using transactions like AGR_USERS and AGR_1251.",
    "I would compare that result with the ruleset function before calling it a false positive."
  ].join("\n");
  const tableNamedAnswer = tableTransactionAnswer.replace(
    "I would check the assignments using transactions like AGR_USERS and AGR_1251.",
    "I would read tables AGR_USERS and AGR_1251, then use transaction SUIM for the assignment report."
  );
  const su53Failures = evaluateLive(implCase, su53SuccessAnswer, { finish_reason: "stop" });
  const failedCheckFailures = evaluateLive(CASES.find((item) => item.id === "ADV-01"), failedCheckAnswer, { finish_reason: "stop" });
  const tableFailures = evaluateLive(CASES.find((item) => item.id === "TS-06"), tableTransactionAnswer, { finish_reason: "stop" });
  const namedTableFailures = evaluateLive(CASES.find((item) => item.id === "TS-06"), tableNamedAnswer, { finish_reason: "stop" });
  const cleanSu53Answer = [
    "Yes, a clean SU53 indicates that there were no authorization failures during the cutover.",
    "I would review the role assignments after the transport.",
    "That result shows the cutover access succeeded."
  ].join("\n");
  const cleanSu53Denial = [
    "No. A clean SU53 is not evidence that cutover succeeded.",
    "Transaction SU53 stores the last failed authorization check. Transaction SUIM shows the assignment.",
    "The cutover check is the assigned user completing the business transaction, plus reconciliation."
  ].join("\n");
  const cleanFailures = evaluateLive(CASES.find((item) => item.id === "ADV-05"), cleanSu53Answer, { finish_reason: "stop" });
  const cleanDenialFailures = evaluateLive(CASES.find((item) => item.id === "ADV-05"), cleanSu53Denial, { finish_reason: "stop" });
  check("su53-success-evidence-fails", su53Failures.some((item) => item.evidence.includes("proof that access succeeded")), JSON.stringify(su53Failures));
  check("su53-failed-check-remains-valid", !failedCheckFailures.some((item) => item.evidence.includes("proof that access succeeded") || item.evidence.includes("role table")), JSON.stringify(failedCheckFailures));
  check("clean-su53-success-fails", cleanFailures.some((item) => item.evidence.includes("proof that access succeeded")), JSON.stringify(cleanFailures));
  check("clean-su53-denial-passes", !cleanDenialFailures.some((item) => item.evidence.includes("proof that access succeeded")), JSON.stringify(cleanDenialFailures));
  const imp01Su53 = [
    "I would derive the role in PFCG and set the company-code organizational level.",
    "Transaction PFCG copies the parent. Generate the profile and assign the user.",
    "To validate the derived role, use transaction SU53 to check for any authorization failures after testing the role with a user assigned to it. Ensure that the user can perform the required transactions for the new company code. This end-to-end check confirms that the derived role is functioning correctly."
  ].join("\n\n");
  const fol02Su53 = [
    "I would have the assigned user post a document in the new company code.",
    "I would read tables AGR_USERS and AGR_1251.",
    "The validation would involve executing a test transaction while monitoring the authorization trace (using transaction SU53) to confirm that the necessary authorizations are granted."
  ].join("\n\n");
  const imp11Ok = [
    "I would derive the role in PFCG for the new company code.",
    "I enter the imparting role in Derive from Role. The derived role inherits the menu. I maintain the company-code organizational level, then generate the profile. I would read tables AGR_USERS and AGR_1251.",
    "I would have a user assigned to the derived role complete a business transaction for the new company code. The success of this process is validated when that user can execute the transaction without encountering authorization errors. A trace or SU53 can be used to troubleshoot any issues that arise, but the assigned user completes the intended business action."
  ].join("\n\n");
  check("imp01-su53-paragraph-fails", evaluateLive(implCase, imp01Su53, { finish_reason: "stop" }).some((item) => /proof that access succeeded|role UAT/.test(item.evidence)), "saved IMP-01 validation paragraph was not rejected");
  check("followup-su53-confirmation-fails", evaluateLive(CASES.find((item) => item.id === "FOL-02"), fol02Su53, { finish_reason: "stop" }).some((item) => item.evidence.includes("proof that access succeeded")), "follow-up SU53 confirmation was not rejected");
  const fol02UsageProof = [
    "I would have the assigned user post in the new company code.",
    "I would use transaction ST03N to confirm that the posting transactions are being executed.",
    "The assigned user completes the posting."
  ].join("\n");
  const fol02TablesNotProof = [
    "I would have the assigned user post a document in the new company code.",
    "Tables AGR_USERS and AGR_1251 show the assignment. They do not prove the posting succeeded.",
    "The proof is the user completing the posting transaction. SU53 is only used if that action fails."
  ].join("\n");
  const fol02Case = CASES.find((item) => item.id === "FOL-02");
  check("usage-statistic-as-posting-proof-fails", evaluateLive(fol02Case, fol02UsageProof, { finish_reason: "stop" }).some((item) => item.evidence.includes("proof of the business action")), "ST03N was accepted as proof of posting");
  check("assignment-table-denial-passes", !evaluateLive(fol02Case, fol02TablesNotProof, { finish_reason: "stop" }).some((item) => /proof of the business action|proof that access succeeded/.test(item.evidence)), "a negated table check was rejected");
  check("failure-branch-su53-passes", !evaluateLive(implCase, imp11Ok, { finish_reason: "stop" }).some((item) => /proof that access succeeded|role UAT|role table|omitted PFCG|copying the role|Derive from Role field|Description tab/.test(item.evidence)), "derived-role failure branch was rejected");
  const copyRoleAnswer = [
    "You start by copying an existing master role.",
    "In PFCG, use the Copy Role function, then set the company-code organizational level.",
    "The assigned user completes the business transaction for that company code."
  ].join("\n");
  check("copy-role-method-fails", evaluateLive(implCase, copyRoleAnswer, { finish_reason: "stop" }).some((item) => item.evidence.includes("copying the role")), "Copy Role was accepted as derivation");
  check("derive-from-role-passes", !technicalFailures.some((item) => /copying the role|Derive from Role field|Description tab|omitted PFCG/.test(item.evidence)), JSON.stringify(technicalFailures));
  const orgOnDescription = [
    "I would derive the role in PFCG.",
    "On the Description tab, specify the organizational levels, such as the new company code. The role inherits the menu.",
    "The assigned user completes the business transaction."
  ].join("\n");
  check("org-level-on-description-tab-fails", evaluateLive(implCase, orgOnDescription, { finish_reason: "stop" }).some((item) => item.evidence.includes("Description tab")), "organizational levels on the Description tab were accepted");
  const passedCheck = [
    "A clean SU53 does not prove that the cutover succeeded. It only indicates that the last authorization check did not fail.",
    "Transaction SUIM shows the assignments.",
    "The assigned user still has to complete the business transaction."
  ].join("\n");
  check("su53-passed-check-misstatement-fails", evaluateLive(CASES.find((item) => item.id === "ADV-05"), passedCheck, { finish_reason: "stop" }).some((item) => item.evidence.includes("proof that access succeeded")), "clean SU53 described as a passed check was not rejected");
  const msmpOk = [
    "I would configure the MSMP path for the ARM request.",
    "I would maintain the stages and the BRFplus agent rule.",
    "I would simulate an access request and check the instance status. A trace or SU53 would only be used to investigate any failures after the request has been processed."
  ].join("\n\n");
  check("msmp-simulation-plus-failure-su53-passes", !evaluateLive(CASES.find((item) => item.id === "IMP-02"), msmpOk, { finish_reason: "stop" }).some((item) => /role UAT|proof that access succeeded/.test(item.evidence)), "MSMP simulation was treated as SU53 success evidence");
  check("table-called-transaction-fails", tableFailures.some((item) => item.evidence.includes("role table")), JSON.stringify(tableFailures));
  check("table-named-as-table-passes", !namedTableFailures.some((item) => item.evidence.includes("role table")), JSON.stringify(namedTableFailures));
  return failures;
}

function familyCounts(list) {
  const counts = {};
  for (const c of list) counts[c.family] = (counts[c.family] || 0) + 1;
  return counts;
}

(async () => {
  if (!["offline", "live", "rescore"].includes(MODE) || (MODE === "live") !== LIVE || (RESCORE && !INPUT)) {
    console.error("Invalid evaluation mode. Use --mode=offline, --mode=live, or --mode=rescore --input=<existing-report>.");
    process.exitCode = 2;
    return;
  }
  if (fs.existsSync(OUT)) {
    console.error(`Refusing to overwrite evaluation output: ${OUT}`);
    process.exitCode = 2;
    return;
  }
  if (INJECT_PARTIAL_OUTPUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ status: "running", partial: true }), { flag: "wx" });
    outputCreatedByRun = true;
  }
  if (LIVE) {
    const { APP_BASE_URL, OPENAI_API_KEY } = require("./lib/env");
    let serviceAvailable = false;
    try {
      const response = await fetch(APP_BASE_URL, { signal: AbortSignal.timeout(3000) });
      serviceAvailable = response.status < 500;
    } catch {}
    if (!serviceAvailable || !OPENAI_API_KEY) {
      const report = {
        generatedAt: new Date().toISOString(),
        mode: MODE,
        status: "blocked",
        infrastructure: {
          serviceAvailable,
          providerCredentialPresent: Boolean(OPENAI_API_KEY),
          reason: !serviceAvailable ? "Application service is unavailable at the configured evaluation URL." : "Provider credential is not configured."
        },
        counts: { total: CASES.length, completed: 0 },
        live: false,
        liveRows: [],
        liveFailures: []
      };
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(report, null, 2), { flag: "wx" });
      outputCreatedByRun = true;
      console.log(JSON.stringify({ mode: MODE, status: "blocked", reason: report.infrastructure.reason, out: OUT }, null, 2));
      process.exitCode = 2;
      return;
    }
  }
  const routingFailures = [];
  const routed = [];
  for (const c of CASES) {
    const ctx = resolveInterviewContext({ questionRaw: c.q, history: [] });
    const ok = c.route(ctx);
    const row = {
      id: c.id,
      family: c.family,
      unseen: c.unseen !== false,
      q: c.q,
      intent: ctx.questionIntent,
      scope: ctx.answerScope,
      depth: ctx.depth,
      topic: ctx.questionTopic,
      ok
    };
    routed.push(row);
    if (!ok) {
      routingFailures.push({
        question: c.q,
        mode: c.family,
        relevantResponseContract: c.id,
        actualAnswer: `${ctx.questionIntent}/${ctx.answerScope}`,
        failureCategory: "intent correctness",
        owningLayer: "interview context / answerScope (frozen unless this is a new defect)",
        evidence: JSON.stringify(row),
        proposedGeneralizedFix: "Do not add phrase routing unless this is a reproduced scope miss."
      });
    }
  }

  const sod = routed.filter((r) => r.id.startsWith("SOD-"));
  const sodKeys = new Set(sod.map((r) => `${r.intent}|${r.scope}`));
  const sameTopicDistinct = sodKeys.size >= 4;

  const unseen = CASES.filter((c) => c.unseen !== false).length;
  const unseenPct = unseen / CASES.length;
  const contracts = sourceContracts();

  const liveFailures = [];
  const liveRows = [];
  if (RESCORE && INPUT && fs.existsSync(INPUT)) {
    const prev = JSON.parse(fs.readFileSync(INPUT, "utf8"));
    for (const row of prev.liveRows || []) {
      const c = CASES.find((x) => x.id === row.id);
      if (!c) continue;
      const dims = evaluateLive(c, row.answer, {
        finish_reason: row.finish_reason,
        maxTokens: row.maxTokens,
        completion_tokens: row.completion_tokens
      });
      liveFailures.push(...dims);
      liveRows.push(row);
      console.log([
        row.id,
        `w=${row.words}`,
        row.incomplete ? "INCOMPLETE" : "complete",
        dims.length ? `FAIL:${dims.map((d) => d.failureCategory).join(",")}` : "ok"
      ].join(" | "));
    }
  } else if (LIVE) {
    const { generateAnswer } = require("./lib/generateAnswer");
    const onlyIds = new Set(String(process.env.EVAL_CASE_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
    const resume = INPUT && fs.existsSync(INPUT) && (onlyIds.size || process.argv.includes("--resume"));
    const priorRows = resume ? (JSON.parse(fs.readFileSync(INPUT, "utf8")).liveRows || []) : [];
    const done = new Set(priorRows.filter((row) => row.answer && !row.error && !onlyIds.has(row.id)).map((row) => row.id));
    for (const row of priorRows.filter((row) => done.has(row.id))) {
      const c = CASES.find((item) => item.id === row.id);
      if (!c) continue;
      const dims = evaluateLive(c, row.answer, row);
      liveFailures.push(...dims);
      liveRows.push(row);
    }
    for (const c of CASES.filter((item) => (onlyIds.size ? onlyIds.has(item.id) : !done.has(item.id)))) {
      let gen = { answer: "", latencyMs: 0, generation: null, error: null };
      try {
        gen = await Promise.race([
          generateAnswer(c.q, {
            candidateResume: DEFAULT_CAREER_BACKGROUND,
            jobDescription: TARGET_JOB_DESCRIPTION,
            history: c.history,
            interviewSessionId: `paq_${c.id}`
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000))
        ]);
      } catch (error) {
        gen.error = error.message;
      }
      if (!gen.error && !String(gen.answer || "").trim()) {
        gen.error = "empty answer";
      }
      const answer = gen.answer || "";
      const dims = gen.error
        ? [{
            question: c.q,
            mode: c.family,
            relevantResponseContract: c.id,
            actualAnswer: "",
            failureCategory: "live generation",
            owningLayer: "runtime",
            evidence: gen.error,
            proposedGeneralizedFix: "Investigate /api/chat availability; do not treat as a wording defect."
          }]
        : evaluateLive(c, answer, gen.generation);
      liveFailures.push(...dims);
      liveRows.push({
        id: c.id,
        q: c.q,
        family: c.family,
        words: words(answer).length,
        incomplete: incomplete(answer),
        finish_reason: gen.generation?.finish_reason || null,
        maxTokens: gen.generation?.maxTokens ?? null,
        completion_tokens: gen.generation?.completion_tokens ?? null,
        error: gen.error || null,
        latencyMs: gen.latencyMs,
        answer
      });
      console.log([
        c.id,
        `w=${words(answer).length}`,
        incomplete(answer) ? "INCOMPLETE" : "complete",
        `finish=${gen.generation?.finish_reason || "-"}`,
        `${gen.generation?.completion_tokens || "-"}/${gen.generation?.maxTokens || "-"}`,
        dims.length ? `FAIL:${dims.map((d) => d.failureCategory).join(",")}` : "ok",
        gen.error || ""
      ].join(" | "));
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify({
        generatedAt: new Date().toISOString(),
        mode: MODE,
        status: "running",
        live: true,
        partial: true,
        counts: { total: CASES.length, completed: liveRows.length },
        liveFailures,
        liveRows
      }, null, 2), { flag: outputCreatedByRun ? "w" : "wx" });
      outputCreatedByRun = true;
    }
  }

  if (INJECT_FAILURE) contracts.push({ name: "injected-regression-failure", evidence: "Deliberate test failure." });
  if (INJECT_LIVE_FAILURE) liveFailures.push({ failureCategory: "injected-live-answer-quality-failure", evidence: "Deliberate test failure." });
  const hardFail = contracts.length
    || routingFailures.length
    || !sameTopicDistinct
    || unseenPct < 0.6
    || liveFailures.length;
  const report = {
    generatedAt: new Date().toISOString(),
    mode: MODE,
    status: hardFail ? "failed" : "passed",
    live: LIVE,
    answerSource: RESCORE ? "saved-live-captures" : LIVE ? "current-live-calls" : "deterministic-offline-checks",
    counts: {
      total: CASES.length,
      unseen,
      unseenPct,
      families: familyCounts(CASES)
    },
    sourceContracts: contracts,
    routingFailures,
    sameTopicSodDistinct: { ok: sameTopicDistinct, uniqueIntentScope: [...sodKeys] },
    liveFailures,
    routed,
    liveRows,
    domainVerification: [
      { domain: "PFCG derived roles", status: "verified", scope: "SAP Business Suite and SAP S/4HANA systems that use PFCG. Not S/4HANA Cloud Public Edition business roles.", source: "SAP Learning, Implementing a Derived Role Strategy, checked 2026-10-16. The lesson cites SAP Note 314513 for organizational levels.", artifact: "Transaction PFCG. Description-tab field Derive from Role. Imparting role. Generate Derived Roles copies normal fields, not maintained organizational levels." },
      { domain: "SU53", status: "verified", scope: "ABAP authorization checks on Business Suite and S/4HANA.", source: "SAP Help, Analyzing Authorization Checks, NetWeaver 7.31; SAP Learning, Troubleshooting Authorization Checks, checked 2026-10-16.", artifact: "Transaction SU53 displays recent failed authorization checks. It is not proof that a business action succeeded." },
      { domain: "AGR_USERS and AGR_1251", status: "partially-verified", scope: "ABAP PFCG role tables.", source: "SAP KBA 3307728 names table AGR_TCODES and lists AGR_1251, BC-SEC-AUT-PFC, ABAP platform. Column pages were not opened. They are absent from the SAP Learning transaction list checked 2026-10-16.", artifact: "Tables, not transactions." },
      { domain: "GRC Access Control, IAG, IAS, IPS, BTP, Fiori Public versus Private, SuccessFactors, Ariba, SAC, Datasphere, BW, HANA, SAP IDM, Activate", status: "not-reverified", scope: "Present in the knowledge files. Currency was not rechecked against SAP Help, Notes, or Learning in this pass.", source: "None re-opened this session.", artifact: "Do not treat the index as proof of the current release." }
    ]
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), { flag: outputCreatedByRun ? "w" : "wx" });
  outputCreatedByRun = true;

  if (hardFail && contracts.length) {
    console.error(contracts.map((item) => `${item.name}: ${item.evidence}`).join("\n"));
  }
  console.log(JSON.stringify({
    total: CASES.length,
    mode: MODE,
    status: report.status,
    unseenPct: Number(unseenPct.toFixed(3)),
    families: familyCounts(CASES),
    sourceContracts: contracts.length,
    routingFailures: routingFailures.length,
    sameTopicSodDistinct: sameTopicDistinct,
    live: LIVE,
    liveFailures: liveFailures.length,
    out: OUT
  }, null, 2));
  process.exit(hardFail ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
