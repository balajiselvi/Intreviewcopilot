const { generateEmbedding } = require("../../services/embeddingService");
const {
  calculateCosineSimilarity,
  normalizeText,
  computeKeywordOverlap,
  computeDomainBoost,
  computeArtifactBoost,
  computeIntentBoost
} = require("../../services/vectorSearch");
const { loadJudgmentRecords, loadEngineeringPrinciples } = require("./store");
const { judgmentRecordCanonicalText, principleCanonicalText, ensureEmbedded } = require("./embed");

// docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 5. Reasoning-first, not similarity-first:
// pages/api/chat.js already computes `analysis` (category/domain/secondaryCategories) via
// analyzeInterviewQuestion() BEFORE any retrieval call today -- this module consumes that
// existing analysis rather than re-deriving it, and rather than embedding the raw question
// alone. NOT wired into pages/api/chat.js in this step -- callable and testable standalone.

// Section 5.2 -- deterministic lookup, same idiom as getDomainDepthGuidance() in
// lib/prompt/interviewPrompt.js. Keys match CATEGORY_TEMPLATES categories in interviewPrompt.js.
const MEMORY_NEEDED_BY_CATEGORY = Object.freeze({
  Architecture: { principles: true, records: true },
  "Role Design": { principles: true, records: true },
  Security: { principles: true, records: true },
  Authorization: { principles: true, records: true },
  Migration: { principles: true, records: true },
  Troubleshooting: { principles: false, records: true },
  "Production Support": { principles: false, records: true },
  Behavioral: { principles: true, records: true },
  Leadership: { principles: true, records: true },
  Audit: { principles: true, records: true },
  Workflow: { principles: false, records: true }
});
const DEFAULT_MEMORY_NEEDED = Object.freeze({ principles: true, records: true });

function determineMemoryNeeded(category) {
  return MEMORY_NEEDED_BY_CATEGORY[category] || DEFAULT_MEMORY_NEEDED;
}

// Section 5.3 -- synthesize the retrieval query from the problem frame (category + domain +
// secondary categories), not the raw question text alone, so differently-worded questions
// about the same underlying judgment retrieve the same records.
function synthesizeMemoryQuery(question, analysis = {}) {
  const extraTerms = [analysis.category, analysis.domain, ...(analysis.secondaryCategories || [])]
    .filter(Boolean)
    .join(" ");
  return extraTerms ? `${question} ${extraTerms}` : question;
}

function scoreCandidate({ queryEmbedding, queryNorm, domain, intent, item, canonicalTextFn, recallPenalty }) {
  const text = canonicalTextFn(item);
  const contentNorm = normalizeText(text);
  const semanticScore = Array.isArray(item.embedding) && item.embedding.length > 0
    ? calculateCosineSimilarity(queryEmbedding, item.embedding)
    : 0;
  const keywordScore = computeKeywordOverlap(queryNorm, contentNorm);
  const domainBoost = computeDomainBoost(domain, contentNorm);
  const artifactBoost = computeArtifactBoost(text);
  const intentBoost = computeIntentBoost(intent, contentNorm);

  let finalScore = Math.min(
    1.0,
    semanticScore * 0.55 + keywordScore * 0.20 + domainBoost + artifactBoost + intentBoost
  );

  if (recallPenalty) finalScore *= recallPenalty;
  return finalScore;
}

// Section 5.4 -- recall_confidence penalty: low-confidence records are still retrievable (a
// hedged real memory beats a fabricated confident one) but scored down, not excluded.
const RECALL_CONFIDENCE_PENALTY = Object.freeze({ high: 1.0, medium: 0.85, low: 0.65 });

async function searchEngineeringMemory({ question, analysis = {}, topK = 3 }) {
  const memoryNeeded = determineMemoryNeeded(analysis.category);
  if (!memoryNeeded.principles && !memoryNeeded.records) {
    return { principles: [], records: [] };
  }

  // Cost/latency short-circuit for the live interview path: skip loading the embedding model
  // and generating a query embedding entirely when there's nothing to compare it against yet.
  // The store starts empty and stays empty until real Judgment Records exist, so this keeps
  // Engineering Memory a genuine zero-cost no-op until there's real data, rather than adding
  // embedding-model-load latency to every live request for no benefit.
  const existingRecords = memoryNeeded.records ? loadJudgmentRecords() : [];
  const existingPrinciples = memoryNeeded.principles ? loadEngineeringPrinciples() : [];
  if (existingRecords.length === 0 && existingPrinciples.length === 0) {
    return { principles: [], records: [] };
  }

  const query = synthesizeMemoryQuery(question, analysis);
  const queryEmbedding = await generateEmbedding(query);
  const queryNorm = normalizeText(query);
  const domain = analysis.domain || "";
  const intent = analysis.category || "";

  let records = [];
  if (memoryNeeded.records) {
    const allRecords = await ensureEmbedded(existingRecords, judgmentRecordCanonicalText);
    const scored = allRecords.map(record => ({
      item: record,
      score: scoreCandidate({
        queryEmbedding,
        queryNorm,
        domain,
        intent,
        item: record,
        canonicalTextFn: judgmentRecordCanonicalText,
        recallPenalty: RECALL_CONFIDENCE_PENALTY[record.provenance?.recall_confidence] ?? 1.0
      })
    }));
    records = scored.sort((a, b) => b.score - a.score).slice(0, topK).map(s => s.item);
  }

  let principles = [];
  if (memoryNeeded.principles) {
    const allPrinciples = (await ensureEmbedded(existingPrinciples, principleCanonicalText))
      .filter(p => p.status === "confirmed" || p.status === "modified"); // section 3.2: never proposed
    const scored = allPrinciples.map(principle => ({
      item: principle,
      score: scoreCandidate({
        queryEmbedding,
        queryNorm,
        domain,
        intent,
        item: principle,
        canonicalTextFn: principleCanonicalText,
        recallPenalty: 1.0
      })
    }));
    principles = scored.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.floor(topK / 2))).map(s => s.item);
  }

  return { principles, records };
}

// Section 5.5 -- prompt rendering. Low recall_confidence records get an explicit hedging
// instruction rather than being silently dropped or silently asserted, reusing the same
// conditional-tense idea already validated in lib/prompt/interviewPrompt.js's DEEPEN MODE
// fabrication guard.
function renderEngineeringJudgmentSection({ principles = [], records = [] }) {
  if (principles.length === 0 && records.length === 0) return "";

  const parts = [];

  for (const p of principles) {
    const derivedCount = p.derived_from?.length || 0;
    parts.push(`RELEVANT ENGINEERING PRINCIPLE:\n"${p.statement}" -- established across ${derivedCount} prior situation${derivedCount === 1 ? "" : "s"}.`);
  }

  for (const r of records) {
    const lines = [
      "RELEVANT ENGINEERING JUDGMENT:",
      `Situation: ${r.situation}`
    ];
    if (r.problem) lines.push(`Problem: ${r.problem}`);
    if (r.constraint) lines.push(`Constraint: ${r.constraint}`);
    if (r.decision) lines.push(`Decision: ${r.decision}`);
    if (r.alternative_rejected) {
      lines.push(`Rejected: ${r.alternative_rejected.approach} -- ${r.alternative_rejected.reason_rejected}`);
    }
    if (r.outcome) lines.push(`Outcome: ${r.outcome}`);
    if (r.lesson_learned) lines.push(`Lesson: ${r.lesson_learned}`);

    if (r.provenance?.recall_confidence === "low") {
      lines.push("(The candidate was uncertain about the exact details of this one -- speak from it in general/methodology terms, not as a precisely recalled incident.)");
    }
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n");
}

module.exports = {
  MEMORY_NEEDED_BY_CATEGORY,
  determineMemoryNeeded,
  synthesizeMemoryQuery,
  searchEngineeringMemory,
  renderEngineeringJudgmentSection
};
