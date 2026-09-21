/**
 * Fresh live generation quality battery. Questions are not copied from prior eval files.
 * Routing is always scored. Generation is scored when /api/chat is healthy.
 *
 * Local diagnostic. Writes eval/results/generation-quality-battery.json
 */
const fs = require("fs");
const path = require("path");
const { resolveInterviewContext } = require("../lib/interviewContext");
const { generateAnswer } = require("./lib/generateAnswer");
const { DEFAULT_CAREER_BACKGROUND } = require("./lib/careerTimeline");

const CASES = [
  { id: "INV1", dim: "investigation", q: "A launchpad tile shows up, but nothing happens when the user clicks it. How would you investigate?" },
  { id: "INV2", dim: "investigation", q: "An ARM request sits in submitted status and never appears in the approver inbox. Walk me through your investigation." },
  { id: "INV3", dim: "investigation", q: "Cloud Connector shows connected, yet the BTP app cannot reach the named backend resource. How do you troubleshoot that?" },
  { id: "INV4", dim: "investigation", q: "A BW query executes but the user sees an empty result set even though they should be authorized. How would you investigate?" },
  { id: "INV5", dim: "investigation", q: "The IPS job finishes with errors and the target identities are incomplete. How would you approach that?" },
  { id: "INV6", dim: "investigation", q: "SSO into SAC succeeds, but the story still will not open. What do you look at first?" },
  { id: "INV7", dim: "investigation", q: "A custom S/4 app dumps an authorization error for one user only. How would you diagnose it?" },
  { id: "INV8", dim: "investigation", q: "IAG privileged access activation never starts the session. Walk me through how you would establish why." },
  { id: "PMP1", dim: "pmp", q: "We are two weeks behind during hypercare. How would you handle this?" },
  { id: "PMP2", dim: "pmp", q: "A vendor delay is affecting the cutover plan. What would you do?" },
  { id: "PMP3", dim: "pmp", q: "The steering committee wants the stabilization phase shortened. How would you approach it?" },
  { id: "PMP4", dim: "pmp", q: "A high project risk has surfaced during SAP go-live. How would you manage it?" },
  { id: "PMP5", dim: "pmp", q: "We need to recover schedule without compromising quality. Walk me through your approach." },
  { id: "PMP6", dim: "pmp", q: "A RAID item is escalating and multiple stakeholders disagree. How would you handle it?" },
  { id: "PMP7", dim: "pmp", q: "The PMO wants to freeze scope while security still has open defects. How do you decide?" },
  { id: "PMP8", dim: "pmp", q: "Cutover weekend is slipping because a supplier missed a delivery. What is your governance path?" },
  { id: "ARC1", dim: "architecture", q: "How would you design S/4 authorization so company-code autonomy does not explode the role catalog?" },
  { id: "ARC2", dim: "architecture", q: "Where should SoD live if we keep GRC AC for ECC and introduce IAG for the cloud landscape?" },
  { id: "ARC3", dim: "architecture", q: "How should Fiori content security sit relative to backend PFCG in a spaces-and-pages model?" },
  { id: "ARC4", dim: "architecture", q: "For a RISE hybrid, who owns identity versus who owns application enforcement?" },
  { id: "ARC5", dim: "architecture", q: "Design JML so a mover does not accumulate finance access after moving to retail." },
  { id: "ARC6", dim: "architecture", q: "How would you bound SAC story access versus Datasphere space privileges?" },
  { id: "ARC7", dim: "architecture", q: "What architecture would you use so IAS is not treated as the authorization system?" },
  { id: "ARC8", dim: "architecture", q: "How should Cloud Connector principal propagation sit in a BTP-to-S/4 call path?" },
  { id: "IMP1", dim: "implementation", q: "How would you expose a custom OData service on a Fiori app and make it callable for a business role?" },
  { id: "IMP2", dim: "implementation", q: "Take me through creating a derived role for a new company code in PFCG." },
  { id: "IMP3", dim: "implementation", q: "How do you stand up an IPS source system against SuccessFactors?" },
  { id: "IMP4", dim: "implementation", q: "How would you switch on privileged access in IAG for a break-glass ID?" },
  { id: "IMP5", dim: "implementation", q: "Walk me through wiring Cloud Connector so a BTP app can reach an on-prem OData service." },
  { id: "IMP6", dim: "implementation", q: "How would you create a Datasphere space and restrict a finance view?" },
  { id: "IMP7", dim: "implementation", q: "What is the sequence for assigning an SAC team to a folder without opening the model?" },
  { id: "IMP8", dim: "implementation", q: "How would you add a Fiori tile for a new semantic object and action?" },
  { id: "EXP1", dim: "experience", q: "Have you implemented IAG Access Analysis in production?" },
  { id: "EXP2", dim: "experience", q: "Tell me exactly how you implemented Ariba security." },
  { id: "EXP3", dim: "experience", q: "Which customer did you build SAP IDM 8.0 Developer Studio for?" },
  { id: "EXP4", dim: "experience", q: "What metrics improved after your last SoD cleanse?" },
  { id: "EXP5", dim: "experience", q: "Walk me through the GRC programme you actually owned." },
  { id: "EXP6", dim: "experience", q: "Have you delivered Cloud Connector as an SAP-managed RISE service?" },
  { id: "CON1", dim: "concept", q: "What is SoD?" },
  { id: "CON2", dim: "concept", q: "What exactly is SoD?" },
  { id: "CON3", dim: "concept", q: "Define IAS in one sentence." },
  { id: "CON4", dim: "concept", q: "What does IPS actually do?" },
  { id: "CON5", dim: "concept", q: "What is a RAID log?" },
  { id: "CON6", dim: "concept", q: "What is a Fiori target mapping?" },
  { id: "COL1", dim: "collision", q: "How would you design a sustainable S/4 role model after rationalization?" },
  { id: "COL2", dim: "collision", q: "How would you troubleshoot a BW query authorization miss?" },
  { id: "COL3", dim: "collision", q: "How would you implement JML for a SuccessFactors joiner?" },
  { id: "COL4", dim: "collision", q: "Have you designed IAG privileged access?" },
  { id: "COL5", dim: "collision", q: "How would you govern SoD exceptions without blocking go-live?" },
  { id: "COL6", dim: "collision", q: "How would you troubleshoot a production issue during hypercare?" }
];

const INTENT_SCOPE = {
  investigation: { scope: "STAGE_INVESTIGATION", not: ["IMPLEMENTATION_WALKTHROUGH"] },
  pmp: { not: ["STAGE_INVESTIGATION", "IMPLEMENTATION_WALKTHROUGH"] },
  architecture: { not: ["IMPLEMENTATION_WALKTHROUGH", "STAGE_INVESTIGATION"] },
  implementation: { scope: "IMPLEMENTATION_WALKTHROUGH" },
  experience: { oneOf: ["EXPERIENCE_CONFIRMATION", "EXPERIENCE_DEEP_DIVE"] },
  concept: { not: ["IMPLEMENTATION_WALKTHROUGH", "EXPERIENCE_DEEP_DIVE", "STAGE_INVESTIGATION"] }
};

function words(s) {
  return String(s || "").trim().split(/\s+/).filter(Boolean).length;
}

function score(dim, ctx, answer, question = "") {
  const a = String(answer || "");
  const w = words(a);
  const dims = {};
  const spec = INTENT_SCOPE[dim] || INTENT_SCOPE.collision || {};
  let intent = "PASS";
  if (spec.scope && ctx.answerScope !== spec.scope) intent = "FAIL";
  if (spec.oneOf && !spec.oneOf.includes(ctx.answerScope)) intent = "FAIL";
  if (spec.not && spec.not.includes(ctx.answerScope)) intent = "FAIL";
  dims.intent = intent;
  dims.scope = intent;

  dims.antiFab = /\b(Accenture|Chalhoub|Deloitte|Capgemini)\b/i.test(a) ? "FAIL" : "PASS";
  dims.truncation = (w > 0 && w < 12 && dim !== "concept") ? "FAIL" : ((dim === "implementation" && w < 80) ? "FAIL" : "PASS");
  dims.repetition = (/(\bI would\b.*){12,}/is.test(a)) ? "FAIL" : "PASS";

  if (dim === "investigation" || (dim === "collision" && ctx.answerScope === "STAGE_INVESTIGATION")) {
    const premature = /\b(the fix is|I would then (?:fix|remediate|transport|grant)|corrective action is|I would assign Firefighter)\b/i.test(a);
    dims.prematureRemediation = premature ? "FAIL" : "PASS";
    dims.troubleshooting = /\b(check|inspect|distinguish|confirm|symptom|cause|log|trace)\b/i.test(a) ? "PASS" : (w ? "FAIL" : "FAIL");
  }
  if (dim === "pmp") {
    const tools = (a.match(/\b(SUIM|Firefighter|SU53|ST01|PFCG|PFUD)\b/gi) || []).length;
    const gov = (a.match(/\b(stakeholders?|RAID|schedule|escalat|trade-?off|change control|committee|quality|scope|risks?|govern|timeline|impact)\b/gi) || []).length;
    dims.pmp = (gov >= 2 && tools <= gov) ? "PASS" : (w ? "FAIL" : "FAIL");
    dims.productInjection = tools > 3 ? "FAIL" : "PASS";
  }
  if (dim === "architecture") {
    const namedPlanes = (String(question).match(/\b(IAS|IPS|IAG|BTP|Cloud Connector)\b/gi) || []).length;
    dims.architecture = /\b(boundar|responsib|trade-?off|plane|enforce|authenticat|provision|govern|derived|catalog|least.privilege|autonomy|decision|separat)/i.test(a) ? "PASS" : (w ? "FAIL" : "FAIL");
    const inventory = (a.match(/\b(IAS|IPS|IAG|BTP|Cloud Connector)\b/g) || []).length;
    dims.productInjection = (namedPlanes >= 1) ? "PASS" : (inventory >= 8 ? "FAIL" : "PASS");
  }
  if (dim === "implementation") {
    dims.completeness = /\b(PFCG|FLPA|FLPC|catalog|OData|IPS|IAG|space|SAC|Cloud Connector|SU24|role)\b/i.test(a) && /\b(test|validat|trace|check|UAT)\b/i.test(a) ? "PASS" : (w ? "FAIL" : "FAIL");
  }
  if (dim === "concept") {
    dims.stop = w <= 140 ? "PASS" : "FAIL";
    dims.antiFab = (/\bDover\b/i.test(a) && /\bI implemented\b/i.test(a)) ? "FAIL" : dims.antiFab;
  }
  if (dim === "experience") {
    dims.grounding = /\b(Dover|Eminnov|Fabtech|not a documented|skill|would treat|I would|did not|do not have|not documented)\b/i.test(a)
      && !/^I implemented Ariba|^I implemented .*Ariba/i.test(a.trim())
      ? "PASS" : (w ? "FAIL" : "FAIL");
    if (/\bI (?:implemented|configured|set up)\b/i.test(a) && /Ariba/i.test(a) && !/not a documented|not documented|do not have|would treat/i.test(a)) {
      dims.grounding = "FAIL";
      dims.antiFab = "FAIL";
    }
  }

  const fails = Object.entries(dims).filter(([, v]) => v === "FAIL").map(([k]) => k);
  return { dims, fails, words: w };
}

async function chatHealthy() {
  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What is SoD?", model: "gpt-4o-mini" })
    });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || type.includes("text/html")) return false;
    return true;
  } catch {
    return false;
  }
}

(async () => {
  const rows = [];
  let live = await chatHealthy();
  if (!live) {
    await new Promise((r) => setTimeout(r, 4000));
    live = await chatHealthy();
  }
  console.log(`generationQualityBattery live=${live}`);

  for (const c of CASES) {
    const ctx = resolveInterviewContext({ questionRaw: c.q });
    const row = {
      id: c.id,
      dim: c.dim,
      q: c.q,
      answerScope: ctx.answerScope,
      questionIntent: ctx.questionIntent,
      scenarioMode: ctx.scenarioMode,
      step: ctx.step || "",
      live: false,
      answer: "",
      error: ""
    };
    const routeScore = score(c.dim, ctx, "placeholder investigation check distinguish confirm cause");
    if (c.dim === "investigation" && ctx.answerScope !== "STAGE_INVESTIGATION") {
      row.routeFail = "scope";
    }
    if (c.dim === "pmp" && (ctx.answerScope === "STAGE_INVESTIGATION" || ctx.answerScope === "IMPLEMENTATION_WALKTHROUGH")) {
      row.routeFail = "scope";
    }
    if (c.dim === "implementation" && ctx.answerScope !== "IMPLEMENTATION_WALKTHROUGH") {
      row.routeFail = "scope";
    }
    if (live) {
      try {
        const gen = await generateAnswer(c.q, { candidateResume: DEFAULT_CAREER_BACKGROUND, history: [] });
        row.live = true;
        row.answer = gen.answer;
        row.latencyMs = gen.latencyMs;
        Object.assign(row, score(c.dim, ctx, gen.answer, c.q));
      } catch (error) {
        row.error = error.message || String(error);
        row.fails = ["generation"];
      }
    } else {
      row.fails = row.routeFail ? ["scope"] : [];
      row.dims = { intent: row.routeFail ? "FAIL" : "PASS", scope: row.routeFail ? "FAIL" : "PASS" };
    }
    rows.push(row);
    const mark = (row.fails && row.fails.length) ? "FAIL" : "PASS";
    console.log(`${mark} ${c.id} scope=${ctx.answerScope} words=${row.words || 0} ${row.fails ? row.fails.join(",") : ""}`);
  }

  const out = path.join(__dirname, "results", "generation-quality-battery.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ live, rows }, null, 2));
  const failed = rows.filter((r) => r.fails && r.fails.length);
  console.log(`generationQualityBattery: ${failed.length ? "FAIL" : "PASS"} live=${live} failed=${failed.length}/${rows.length}`);
  if (failed.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
