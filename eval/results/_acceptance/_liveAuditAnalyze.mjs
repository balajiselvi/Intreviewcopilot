/**
 * Analyze V23_LIVE_REPLAY_RESULTS.jsonl and emit evaluation artifacts.
 * Independent technical scoring (no second LLM as sole authority).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance");
const rows = fs.readFileSync(path.join(OUT, "V23_LIVE_REPLAY_RESULTS.jsonl"), "utf8")
  .trim().split(/\n/).filter(Boolean).map((l) => JSON.parse(l));

const PRINCIPLE = /I would confirm the product and deployment plane|I would define the control at the correct identity or authorization plane/i;
const MALFORMED = /not confirmed in supporting knowledge/i;
const OP_PATH = /operational path end to end|plane-appropriate positive check/i;

function scoreAnswer(row) {
  const q = String(row.question || "");
  const a = String(row.finalDisplayedAnswer || "");
  const scores = { technical: 2, completeness: 2, relevance: 2, evidence: 2, usability: 2 };
  const notes = [];
  let classification = "CORRECT_BUT_INCOMPLETE";

  if (row.liveFailed || row.classification === "LIVE_EXECUTION_FAILED") {
    return {
      scores: { technical: 0, completeness: 0, relevance: 0, evidence: 0, usability: 0 },
      classification: "LIVE_EXECUTION_FAILED",
      notes: [row.failureReason || "live failed"]
    };
  }

  if (row.shortCircuitRoute === "PREPARED_SCRIPT" || row.shortCircuitRoute === "ANSWER_BANK") {
    notes.push(`production-short-circuit:${row.shortCircuitRoute}`);
  }

  if (!a || a.length < 40) {
    return { scores: { technical: 0, completeness: 0, relevance: 0, evidence: 0, usability: 0 }, classification: "IRRELEVANT", notes: ["empty-or-tiny"] };
  }

  if (PRINCIPLE.test(a) && a.length < 280) {
    scores.technical = 1;
    scores.completeness = 0;
    scores.relevance = 1;
    scores.usability = 1;
    notes.push("generic-principle-fallback");
    classification = "CORRECT_BUT_INCOMPLETE";
  }

  if (MALFORMED.test(a)) {
    scores.usability = Math.min(scores.usability, 1);
    notes.push("malformed-supporting-knowledge-phrase");
  }
  if (OP_PATH.test(a)) {
    scores.usability = Math.min(scores.usability, 1);
    notes.push("internal-operational-path-commentary");
  }

  // Question-specific checks
  if (/PFCG/i.test(q)) {
    const hasRole = /role|PFCG|Profile Generator/i.test(a);
    const hasMenu = /menu/i.test(a);
    const hasAuth = /authorization|SU24/i.test(a);
    const hasGen = /generat/i.test(a);
    const hasAssign = /assign|SU01|user comparison|PFUD/i.test(a);
    const coverage = [hasRole, hasMenu, hasAuth, hasGen, hasAssign].filter(Boolean).length;
    if (!hasRole) { scores.relevance = 0; scores.technical = 0; classification = "IRRELEVANT"; notes.push("pfcg-missing"); }
    else if (coverage <= 2 || PRINCIPLE.test(a)) {
      scores.completeness = 1; scores.technical = 2; classification = "CORRECT_BUT_INCOMPLETE"; notes.push("pfcg-incomplete-lifecycle");
    } else if (coverage >= 4) {
      scores.technical = 3; scores.completeness = 3; scores.relevance = 4; classification = "CORRECT_AND_COMPLETE";
    } else {
      scores.completeness = 2; classification = "CORRECT_BUT_INCOMPLETE";
    }
  }

  if (/T-?codes used by a user|export all the T-?codes|transactions used by a user|collect what are the transactions/i.test(q)) {
    const claimsAgrAsExec = /\bAGR_(?:USERS|1251)\b/i.test(a) && /(?:executed|actually (?:ran|used)|transaction history|workload|used by the user)/i.test(a);
    const hasSt03 = /\bST03N?\b|\bSTAD\b/i.test(a);
    const distinguishes = /assigned|authorization data|not (?:the )?same as (?:actual )?execution|workload/i.test(a);
    if (claimsAgrAsExec && !hasSt03) {
      scores.technical = 0; classification = "TECHNICALLY_INCORRECT"; notes.push("agr-tables-as-execution-history");
    } else if (hasSt03 && distinguishes) {
      scores.technical = 4; scores.completeness = 3; classification = "CORRECT_AND_COMPLETE"; notes.push("st03n-plane-correct");
    } else if (hasSt03) {
      scores.technical = 3; classification = "CORRECT_BUT_INCOMPLETE"; notes.push("st03n-mentioned-weak-distinction");
    } else if (/\bAGR_/i.test(a) && !hasSt03) {
      scores.technical = 1; classification = "PARTIALLY_INCORRECT"; notes.push("missing-workload-tools");
    }
  }

  if (/5 pillars of BTP/i.test(q)) {
    if (/PrincipalPropagation|Cloud Connector/i.test(a) && !/pillars?|application|integration|data|automation|AI/i.test(a)) {
      scores.relevance = 0; scores.technical = 1; classification = "IRRELEVANT"; notes.push("btp-pillars-wrong-content");
    }
  }

  if (/MSMP/i.test(q) && PRINCIPLE.test(a)) {
    scores.completeness = 0; notes.push("msmp-principle-only"); classification = "CORRECT_BUT_INCOMPLETE";
  }

  if (/BRM/i.test(q) && PRINCIPLE.test(a)) {
    notes.push("brm-principle-only"); classification = "CORRECT_BUT_INCOMPLETE"; scores.completeness = 0;
  }

  if (/OAuth 2\.0 authorization code/i.test(q)) {
    const hasCode = /authorization code/i.test(a);
    const hasToken = /access token|token exchange|token endpoint/i.test(a);
    const hasRedirect = /redirect/i.test(a);
    const sapBleed = /\bPFCG\b|\bMSMP\b|\bIAG\b/i.test(a) && !/SAP/i.test(q);
    if (sapBleed) { scores.relevance = 1; notes.push("oauth-sap-bleed"); classification = "PARTIALLY_INCORRECT"; }
    else if (hasCode && hasToken && hasRedirect) {
      scores.technical = 3; scores.completeness = 3; scores.relevance = 4; classification = "CORRECT_AND_COMPLETE"; notes.push("oauth-open-world-ok");
    } else if (hasCode || hasToken) {
      scores.technical = 2; classification = "CORRECT_BUT_INCOMPLETE";
    } else {
      scores.technical = 1; classification = "PARTIALLY_INCORRECT"; notes.push("oauth-missing-flow");
    }
  }

  if (/SU24 and SU25/i.test(q)) {
    if (/SU24/i.test(a) && /SU25/i.test(a) && /proposal|upgrade|USOB/i.test(a)) {
      scores.technical = 3; scores.completeness = 3; classification = "CORRECT_AND_COMPLETE";
    } else if (PRINCIPLE.test(a)) {
      scores.completeness = 0; classification = "CORRECT_BUT_INCOMPLETE"; notes.push("su24-su25-principle");
    }
  }

  if (a.startsWith("- `") || /^#{1,3}\s/m.test(a) || /SOURCE:/i.test(a)) {
    scores.usability = Math.min(scores.usability, 1);
    notes.push("non-spoken-format");
  }

  // Critical error override
  if (notes.includes("agr-tables-as-execution-history") || notes.includes("btp-pillars-wrong-content")) {
    // already set
  }

  return { scores, classification, notes };
}

const evaluated = rows.map((row) => {
  const ev = scoreAnswer(row);
  return { ...row, evaluation: ev, classification: ev.classification };
});

const byClass = evaluated.reduce((a, r) => { a[r.classification] = (a[r.classification] || 0) + 1; return a; }, {});
const principleCount = evaluated.filter((r) => PRINCIPLE.test(r.finalDisplayedAnswer || "")).length;
const malformedCount = evaluated.filter((r) => r.malformedPhrase).length;
const opPathCount = evaluated.filter((r) => r.operationalPathPhrase).length;
const shortCircuit = evaluated.filter((r) => r.shortCircuitRoute);
const defectRows = evaluated.filter((r) => r.suite === "defect");
const benchRows = evaluated.filter((r) => r.suite === "benchmark");
const histRows = evaluated.filter((r) => r.suite === "historical");

const critical = evaluated.filter((r) =>
  ["TECHNICALLY_INCORRECT", "IRRELEVANT", "LIVE_EXECUTION_FAILED"].includes(r.classification)
  || (r.evaluation?.notes || []).some((n) => /agr-tables|pfcg-incomplete|principle|prepared|malformed|btp-pillars/i.test(n))
);

fs.writeFileSync(path.join(OUT, "V23_LIVE_EVALUATION_SUMMARY.json"), JSON.stringify({
  at: new Date().toISOString(),
  totals: {
    rows: evaluated.length,
    historical: histRows.length,
    defect: defectRows.length,
    benchmark: benchRows.length,
    byClass,
    principleFallbackLike: principleCount,
    malformedPhrase: malformedCount,
    operationalPathPhrase: opPathCount,
    shortCircuits: shortCircuit.map((r) => ({ runId: r.runId, route: r.shortCircuitRoute, question: r.question.slice(0, 100) }))
  },
  defectProbes: defectRows.map((r) => ({
    runId: r.runId,
    question: r.question,
    route: r.admission?.route,
    liveInv: r.liveTransportInvocations,
    classification: r.classification,
    scores: r.evaluation.scores,
    notes: r.evaluation.notes,
    answer: r.finalDisplayedAnswer
  })),
  benchmarks: benchRows.map((r) => ({
    runId: r.runId,
    question: r.question,
    route: r.admission?.route,
    shortCircuit: r.shortCircuitRoute,
    liveInv: r.liveTransportInvocations,
    classification: r.classification,
    scores: r.evaluation.scores,
    notes: r.evaluation.notes,
    answerPreview: String(r.finalDisplayedAnswer || "").slice(0, 400)
  })),
  criticalSample: critical.slice(0, 40).map((r) => ({
    runId: r.runId,
    suite: r.suite,
    question: r.question.slice(0, 120),
    classification: r.classification,
    notes: r.evaluation.notes,
    answerPreview: String(r.finalDisplayedAnswer || "").slice(0, 220)
  }))
}, null, 2));

// Rewrite jsonl with evaluation classifications
fs.writeFileSync(
  path.join(OUT, "V23_LIVE_REPLAY_RESULTS.jsonl"),
  evaluated.map((r) => JSON.stringify(r)).join("\n") + "\n"
);

console.log(JSON.stringify({
  byClass,
  principleCount,
  malformedCount,
  opPathCount,
  shortCircuits: shortCircuit.length,
  defect: defectRows.map((d) => ({ id: d.runId, class: d.classification, notes: d.evaluation.notes })),
  bench: benchRows.map((d) => ({ id: d.runId, class: d.classification, route: d.admission?.route, notes: d.evaluation.notes }))
}, null, 2));
