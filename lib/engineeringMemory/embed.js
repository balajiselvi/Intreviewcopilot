const { generateEmbedding } = require("../../services/embeddingService");

// Canonical text renderings for embedding -- per design doc section 8.1 (records: situation +
// problem + decision) and section 3.1 (principles: the statement itself).

function judgmentRecordCanonicalText(record) {
  return [record.situation, record.problem, record.decision].filter(Boolean).join(" ").trim();
}

function principleCanonicalText(principle) {
  return principle.statement;
}

// Returns a NEW array with embeddings populated for any item missing one. Does not persist --
// callers decide whether/when to save the updated items back to the store. Lazy indexing
// (embed-on-first-search rather than a separate build step) is a deliberate V1 simplification
// per section 0.5 (optimize for learnability, not completeness) -- a dedicated batch-embedding
// script can be added later if record volume makes lazy embedding too slow at search time.
async function ensureEmbedded(items, canonicalTextFn) {
  const results = [];
  for (const item of items) {
    if (Array.isArray(item.embedding) && item.embedding.length > 0) {
      results.push(item);
      continue;
    }
    const text = canonicalTextFn(item);
    if (!text) {
      results.push(item);
      continue;
    }
    const embedding = await generateEmbedding(text);
    results.push({ ...item, embedding });
  }
  return results;
}

module.exports = {
  judgmentRecordCanonicalText,
  principleCanonicalText,
  ensureEmbedded
};
