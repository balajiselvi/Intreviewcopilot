const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  resolveInterviewContext,
  evaluateLayer7Clarity,
  clarificationRequired
} = require("../lib/interviewContext.js");
const {
  isBehavioralStarIntent,
  buildStarFrameworkBlock,
  buildLowRelevanceArchitectFramework
} = require("../lib/intentRouter.js");
const { formatSessionPreparation, normalizeSessionPreparation } = require("../lib/sessionPreparation.js");

let n = 0;
function check(label, fn) {
  fn();
  n += 1;
  console.log(`  ✓ ${label}`);
}

console.log("layer78Assert:");

check("Layer 7 clarify format", () => {
  assert.match(clarificationRequired("Need edition."), /^\* \*\*Clarification Required:\*\*/);
});

check("Layer 7: unspecified S/4 role design answers — no edition stall", () => {
  const hit = evaluateLayer7Clarity({ question: "How do you design roles in S/4HANA?" });
  assert.equal(hit.needsClarify, false);
  assert.equal(hit.lanes.assumedEdition, "on-premise-private");
});

check("Layer 7: Public Cloud + PFCG conflict does not stall — answers with assumed contrast", () => {
  const hit = evaluateLayer7Clarity({
    question: "How do I configure PFCG roles in S/4HANA Public Cloud?"
  });
  assert.equal(hit.needsClarify, false);
});

check("Layer 7: clear Public Cloud ask does not clarify", () => {
  const hit = evaluateLayer7Clarity({
    question: "How do you design business roles in S/4HANA Public Cloud?"
  });
  assert.equal(hit.needsClarify, false);
});

check("Layer 7: clear IAG configure does not clarify", () => {
  const hit = evaluateLayer7Clarity({ question: "How would you configure IAG Access Request?" });
  assert.equal(hit.needsClarify, false);
});

check("Layer 7: S/4 vs BW difference does not clarify", () => {
  const hit = evaluateLayer7Clarity({
    question: "What is the difference between S4 HANA role design vs BW role?"
  });
  assert.equal(hit.needsClarify, false);
});

check("Layer 7 wired into resolveInterviewContext — technical asks generate", () => {
  const ctx = resolveInterviewContext({
    questionRaw: "How do you design roles in S/4HANA?",
    history: []
  });
  assert.notEqual(ctx.retrievalDecision, "clarify");
});

check("Layer 8 detects behavioral STAR intents", () => {
  assert.equal(isBehavioralStarIntent("What challenges did you face during go-live?"), true);
  assert.equal(isBehavioralStarIntent("How did you handle pushback from stakeholders?"), true);
  assert.equal(isBehavioralStarIntent("Tell me about a difficult GRC issue you resolved."), true);
  assert.equal(isBehavioralStarIntent("How would you configure MSMP and BRF+?"), false);
  assert.equal(isBehavioralStarIntent("How do you troubleshoot SU53 authorization failures?"), false);
});

check("Layer 8 STAR framework block shape", () => {
  const block = buildStarFrameworkBlock({
    domain: "SAP GRC",
    sessionPrep: { role: "Principal Architect", seniority: "Senior", focus: "governance" },
    question: "What challenges did you face during go-live?"
  });
  assert.match(block, /BEHAVIORAL STAR MODE/);
  assert.match(block, /\*\*Situation:\*\*/);
  assert.match(block, /\*\*Task:\*\*/);
  assert.match(block, /\*\*Action:\*\*/);
  assert.match(block, /\*\*Result:\*\*/);
  assert.match(block, /NEVER invent or mention specific company names/i);
  assert.match(block, /Do NOT name Dover/i);
  assert.match(block, /aligned with security best practices/i);
  assert.match(block, /ARA ruleset|SU25 step 2/i);
  assert.match(block, /Principal Architect/);
});

check("STAR may name employer only when interviewer asks", () => {
  const { starMayNameEmployer } = require("../lib/intentRouter.js");
  assert.equal(starMayNameEmployer("What challenges did you face during go-live?"), false);
  assert.equal(starMayNameEmployer("Which company was that GRC go-live for?"), true);
});

check("anonymizeStarEmployers strips Dover Corporation", () => {
  const { anonymizeStarEmployers } = require("../lib/generationGuard.js");
  const clean = anonymizeStarEmployers(
    "Situation: During the go-live for GRC Access Control at Dover Corporation, we faced 2,400+ SoD conflicts."
  );
  assert.doesNotMatch(clean, /Dover/);
  assert.match(clean, /2,400\+/);
});

check("STAR local fallback is anonymized and artifact-dense", () => {
  const { buildStarLocalFallback } = require("../lib/intentRouter.js");
  const fb = buildStarLocalFallback("What challenges did you face during go-live?");
  assert.doesNotMatch(fb, /Dover|Eminnov|Fabtech/i);
  assert.match(fb, /\*\*Situation:\*\*/);
  assert.match(fb, /\*\*Action:\*\*/);
  assert.match(fb, /ARA|BRF\+|SU25|PFCG|MSMP/i);
  assert.doesNotMatch(fb, /aligned with security best practices/i);
});

check("Profile facts include ITIL and frank Process Control", () => {
  const { PROFILE_FACTS } = require("./lib/careerTimeline.js");
  assert.match(PROFILE_FACTS, /ITIL V4 Foundation/);
  assert.match(PROFILE_FACTS, /Process Control: basic conceptual knowledge ONLY/i);
  assert.match(PROFILE_FACTS, /Senior Principal SAP Security/);
});

check("Low-relevance directive is internal-only (no UI leak string)", () => {
  const fb = buildLowRelevanceArchitectFramework({ domain: "IAG", question: "obscure xyz" });
  assert.doesNotMatch(fb, /LOW-RELEVANCE RETRIEVAL FALLBACK/);
  assert.doesNotMatch(fb, /no high-confidence/i);
  assert.match(fb, /INTERNAL RETRIEVAL NOTE/);
  assert.match(fb, /do not print/i);
  assert.match(fb, /NEVER Decision:\/Mechanism:\/Governance:\/Validation|Decision\/Mechanism\/Governance\/Validation/i);
  assert.match(fb, /Never mention retrieval/i);
  assert.match(fb, /IAG/);
});

check("sanitizeSpokenAnswer strips leak and Fiori stub echoes", () => {
  const { sanitizeSpokenAnswer } = require("../lib/generationGuard.js");
  const dirty = [
    "LOW-RELEVANCE RETRIEVAL FALLBACK — no high-confidence chunk matched.",
    "* **Decision:** Keep SU24 Check/Maintain for Z-transactions.",
    "If the server is on premise, I would follow the ABAP Fiori path for the same user and app."
  ].join("\n");
  const clean = sanitizeSpokenAnswer(dirty);
  assert.doesNotMatch(clean, /LOW-RELEVANCE RETRIEVAL FALLBACK/);
  assert.doesNotMatch(clean, /ABAP Fiori path/);
  assert.doesNotMatch(clean, /\*\*Decision:\*\*/);
  assert.match(clean, /SU24 Check\/Maintain for Z-transactions/i);
});

check("NON-NEGOTIABLE SYSTEM RULES section is in interviewPrompt", () => {
  const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /NON-NEGOTIABLE SYSTEM RULES/);
  assert.match(prompt, /INTERVIEW COPILOT V2\.1 OPERATING CONTRACT/);
  assert.match(prompt, /RULE 1 — ZERO PROMPT LEAKS/);
  assert.match(prompt, /RULE 3 — UNBREAKABLE PRODUCT BOUNDARIES/);
  assert.match(prompt, /RULE 10 — ABSOLUTE RESPONSE COMPLETENESS/);
  assert.match(prompt, /SuccessFactors: Permission Roles/);
  assert.match(prompt, /RSECADMIN/);
});

check("Sidebar session preparation formats role/seniority", () => {
  const row = normalizeSessionPreparation({
    role: "Principal SAP Security Architect",
    seniority: "Principal / Lead",
    round: "Technical deep-dive",
    focus: "IAG vs GRC boundaries",
    style: "concise spoken"
  });
  const text = formatSessionPreparation(row);
  assert.match(text, /Target role: Principal SAP Security Architect/);
  assert.match(text, /Seniority: Principal \/ Lead/);
  assert.match(text, /not candidate experience/i);
});

check("chat.js wires Layer 7/8, relevance threshold 0.45, sessionPrep, no leak into knowledge text", () => {
  const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
  assert.match(chat, /evaluateLayer7Clarity/);
  assert.match(chat, /isBehavioralStarIntent/);
  assert.match(chat, /LIVE_RELEVANCE_THRESHOLD\s*=\s*0\.45/);
  assert.match(chat, /buildLowRelevanceArchitectFramework/);
  assert.match(chat, /lowRelevanceDirective/);
  assert.match(chat, /looksLikeHardcodedStub/);
  assert.match(chat, /sessionPrep/);
  assert.match(chat, /behavioralStarMode/);
  assert.match(chat, /clarificationRequired/);
  assert.match(chat, /route: "CLARIFY"/);
  assert.doesNotMatch(chat, /text:\s*buildLowRelevanceArchitectFramework/);
});

check("interview.js sends structured sessionPrep", () => {
  const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
  assert.match(interview, /sessionPrep:\s*\{/);
  assert.match(interview, /seniority:\s*sessionPrep\.seniority/);
});

check("interviewPrompt accepts lowRelevanceDirective and hardens STAR", () => {
  const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");
  assert.match(prompt, /lowRelevanceDirective/);
  assert.match(prompt, /INTERNAL RETRIEVAL NOTE/);
  assert.match(prompt, /aligned with security best practices/);
  assert.match(prompt, /anonymized phrasing/);
  assert.match(prompt, /EMPLOYER \/ CLIENT BAN/);
});

check("fiori-security.md has no ABAP Fiori path stub", () => {
  const md = fs.readFileSync(path.join(__dirname, "../knowledge/fiori/fiori-security.md"), "utf8");
  assert.doesNotMatch(md, /If the server is on premise,\s*I would follow the ABAP Fiori path/);
  assert.match(md, /\*\*Decision:\*\*/);
  assert.match(md, /\/IWFND\/ERROR_LOG/);
  assert.match(md, /SU53/);
});

console.log(`layer78Assert: PASS (${n} checks)`);
