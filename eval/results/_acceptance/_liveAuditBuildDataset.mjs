/**
 * Build historical LIVE replay dataset from selected sessions.
 * Does not call providers.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIR = path.join(ROOT, "data", "interview-sessions");
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "results", "_acceptance", "V23_HISTORICAL_SESSION_INVENTORY.json"), "utf8"));
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "V23_HISTORICAL_REPLAY_DATASET.json");

const SELECTED = INV.selectedSessions || [];

function isEligibleQa(q) {
  const question = String(q.questionRaw || q.question || "").trim();
  if (question.length < 8) return false;
  if (q.status === "aborted" || q.status === "empty" || q.status === "partial") return false;
  if (q.disposition === "IGNORE" || q.route === "NONE") return false;
  if (/^\[IGNORE/i.test(String(q.answerShown || ""))) return false;
  // Keep completed spoken answers and also failed generations that still had a question
  if (q.status && !["completed", "error", "failed"].includes(q.status) && String(q.answerShown || "").length < 20) {
    return false;
  }
  return true;
}

const sessions = [];
let totalEligible = 0;
let totalCompletedSpoken = 0;

for (const sel of SELECTED) {
  const file = path.join(DIR, `${sel.sessionId}.json`);
  if (!fs.existsSync(file)) continue;
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  const qa = Array.isArray(s.qa) ? s.qa : [];
  const eligible = [];
  qa.forEach((q, idx) => {
    if (!isEligibleQa(q)) return;
    const question = String(q.questionRaw || q.question || "").trim();
    eligible.push({
      sessionId: s.sessionId,
      provenance: sel.provenance,
      qaId: q.id || `idx_${idx}`,
      sequence: eligible.length + 1,
      originalIndex: idx,
      timestamp: q.timestamp || q.completedAt || null,
      question,
      questionResolved: q.questionResolved || question,
      historicalAnswer: String(q.answerShown || ""),
      historicalRoute: q.route || null,
      historicalSource: q.source || null,
      historicalModel: q.model || s.model || null,
      historicalLatencyMs: q.latencyMs ?? null,
      historicalTokens: q?.usage?.total_tokens ?? null,
      historicalAnswerKind: q.answerKind || null,
      historicalRecovered: Boolean(q.recovered),
      retrieval: Array.isArray(q.retrieval) ? q.retrieval : [],
      sourceFiles: q.sourceFiles || [],
      // Prior context = earlier eligible questions only (no answers — avoid contaminating comparison)
      priorQuestions: eligible.map((e) => e.question)
    });
  });
  totalEligible += eligible.length;
  totalCompletedSpoken += eligible.filter((e) => e.historicalAnswer.length > 40).length;
  sessions.push({
    sessionId: s.sessionId,
    provenance: sel.provenance,
    reason: sel.reason,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    model: s.model,
    qaTotal: qa.length,
    eligibleCount: eligible.length,
    questions: eligible
  });
}

// gpt-4o-mini approximate pricing (USD per 1M tokens) — estimate only
const PRICE_IN = 0.15;
const PRICE_OUT = 0.60;
const EST_PROMPT_TOKENS = 4500; // typical grounded interview prompt
const EST_COMPLETION_TOKENS = 450;
const estIn = totalEligible * EST_PROMPT_TOKENS;
const estOut = totalEligible * EST_COMPLETION_TOKENS;
const estCost = (estIn / 1e6) * PRICE_IN + (estOut / 1e6) * PRICE_OUT;

const knownDefectNeedles = [
  /how do you use PFCG/i,
  /configure PFCG/i,
  /export all the T-?codes used by a user/i,
  /ST03N/i,
  /not confirmed in supporting knowledge/i,
  /operational path end to end/i
];

const defectHits = [];
for (const sess of sessions) {
  for (const q of sess.questions) {
    const blob = `${q.question}\n${q.historicalAnswer}`;
    const hits = knownDefectNeedles.filter((re) => re.test(blob)).map((re) => String(re));
    if (hits.length) defectHits.push({ sessionId: sess.sessionId, sequence: q.sequence, question: q.question.slice(0, 120), hits, answerHasMalformed: /not confirmed in supporting knowledge/i.test(q.historicalAnswer), answerHasOperationalPath: /operational path end to end/i.test(q.historicalAnswer) });
  }
}

const dataset = {
  at: new Date().toISOString(),
  selectionRule: "Up to 5 most recent VERIFIED_LIVE / CANDIDATE_LIVE_WEAK_PROVENANCE sessions with completed Q&A",
  sessions,
  totals: {
    sessionsSelected: sessions.length,
    eligibleQuestions: totalEligible,
    completedSpokenAnswers: totalCompletedSpoken,
    unverifiedSessionsInSelection: sessions.filter((s) => /UNVERIFIED|WEAK/i.test(s.provenance)).length
  },
  costEstimate: {
    model: "gpt-4o-mini",
    assumptions: { promptTokensPerQ: EST_PROMPT_TOKENS, completionTokensPerQ: EST_COMPLETION_TOKENS, priceInPerM: PRICE_IN, priceOutPerM: PRICE_OUT },
    estimatedInputTokens: estIn,
    estimatedOutputTokens: estOut,
    estimatedUsd: Number(estCost.toFixed(4)),
    note: "Estimate only. Actual usage recorded per LIVE call. No spending-cap config found beyond MAX_SESSION_TOKENS."
  },
  knownDefectHitsInHistoricalAnswers: defectHits,
  representsActualInterviewUsage: sessions.some((s) => s.provenance === "VERIFIED_LIVE" && s.questions.some((q) => q.historicalSource === "microphone"))
};

fs.writeFileSync(OUT, JSON.stringify(dataset, null, 2));
console.log(JSON.stringify({
  out: path.relative(ROOT, OUT),
  totals: dataset.totals,
  costEstimate: dataset.costEstimate,
  defectHitCount: defectHits.length,
  defectSample: defectHits.slice(0, 12)
}, null, 2));
