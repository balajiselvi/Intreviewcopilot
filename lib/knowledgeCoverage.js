/**
 * Phase 2.1 — Knowledge coverage assessment + question-to-answer relevance gate.
 * Extends existing retrieval/context assembly; does not create a parallel RAG pipeline.
 */

const COVERAGE = Object.freeze({
  RELEVANT_SUFFICIENT: "RELEVANT_SUFFICIENT",
  RELEVANT_PARTIAL: "RELEVANT_PARTIAL",
  NO_RELEVANT_KNOWLEDGE: "NO_RELEVANT_KNOWLEDGE",
  IRRELEVANT_RETRIEVAL: "IRRELEVANT_RETRIEVAL",
  CONFLICTING_KNOWLEDGE: "CONFLICTING_KNOWLEDGE"
});

const CONCEPT_RULES = Object.freeze([
  {
    id: "greenfield",
    label: "Greenfield",
    patterns: [/\bgreenfield\b/i, /\bnew implementation\b/i],
    answerPatterns: [/\bgreenfield\b/i, /\bnew implementation\b/i]
  },
  {
    id: "brownfield",
    label: "Brownfield",
    patterns: [/\bbrownfield\b/i, /\bsystem conversion\b/i],
    answerPatterns: [/\bbrownfield\b/i, /\bsystem conversion\b/i]
  },
  {
    id: "selective-data-transition",
    label: "Selective Data Transition",
    patterns: [/\bselective data transition\b/i, /\bSDT\b/, /\bbluefield\b/i, /\blean selective\b/i],
    answerPatterns: [/\bselective data transition\b/i, /\bSDT\b/, /\bbluefield\b/i, /\blean selective\b/i]
  },
  {
    id: "ias",
    label: "IAS",
    patterns: [/\bIAS\b/, /\bidentity authentication\b/i],
    answerPatterns: [/\bIAS\b/, /\bidentity authentication\b/i, /\bauthenticat/i]
  },
  {
    id: "ips",
    label: "IPS",
    patterns: [/\bIPS\b/, /\bidentity provisioning\b/i],
    answerPatterns: [/\bIPS\b/, /\bidentity provisioning\b/i, /\bSCIM\b/, /\bprovision/i]
  },
  {
    id: "ara-risk",
    label: "Risk",
    patterns: [/\brisk\b/i],
    answerPatterns: [/\brisk\b/i, /\bSoD\b/i, /\bcritical (?:action|permission)\b/i],
    requireAllWith: ["ara-function", "ara-action", "ara-permission"]
  },
  {
    id: "ara-function",
    label: "Function",
    patterns: [/\bfunction\b/i],
    answerPatterns: [/\bfunction\b/i],
    requireAllWith: ["ara-risk", "ara-action", "ara-permission"]
  },
  {
    id: "ara-action",
    label: "Action",
    patterns: [/\baction\b/i],
    answerPatterns: [/\baction\b/i, /\btransaction\b/i, /\bOData\b/i, /\bFiori\b/i, /\bWeb Dynpro\b/i],
    requireAllWith: ["ara-risk", "ara-function", "ara-permission"]
  },
  {
    id: "ara-permission",
    label: "Permission",
    patterns: [/\bpermission\b/i],
    answerPatterns: [/\bpermission\b/i, /\bauthorization object\b/i],
    requireAllWith: ["ara-risk", "ara-function", "ara-action"]
  },
  {
    id: "critical-access-risk",
    label: "Critical Access Risk",
    patterns: [/\bcritical access risks?\b/i],
    answerPatterns: [/\bcritical access\b/i, /\bcritical action\b/i, /\bcritical permission\b/i]
  },
  {
    id: "critical-action",
    label: "Critical Action",
    patterns: [/\bcritical actions?\b/i],
    // Plural or singular label — "Critical Actions are…" must not false-fail coverage.
    answerPatterns: [/\bcritical actions?\b/i],
    essentialPatterns: [/\b(?:ARA|Access Risk Analysis|ruleset|rule set)\b/i, /\b(?:transaction|executable|Web Dynpro|Fiori|service|single|on its own)\b/i],
    minEssentialHits: 1
  },
  {
    id: "critical-permission",
    label: "Critical Permission",
    patterns: [/\bcritical permissions?\b/i],
    answerPatterns: [/\bcritical permission\b/i],
    essentialPatterns: [/\b(?:authorization object|auth(?:orization)?\s*object|field|value)\b/i, /\b(?:ARA|ruleset|rule set)\b/i],
    minEssentialHits: 1
  },
  {
    id: "mitigation-lifecycle",
    label: "Mitigation Lifecycle",
    patterns: [/\bmitigation lifecycle\b/i, /\bmitigating controls?\b.{0,40}\blifecycle\b/i],
    answerPatterns: [/\bmitigat/i],
    essentialPatterns: [/\bowner\b/i, /\bmonitor\b/i, /\b(?:expir|renew|review|evidence)\b/i],
    minEssentialHits: 2
  },
  {
    id: "grc-ruleset",
    label: "Ruleset",
    patterns: [/\brule\s*sets?\b/i],
    answerPatterns: [/\brule\s*sets?\b/i, /\bruleset\b/i, /\bfunction\b/i, /\brisk\b/i]
  },
  {
    id: "firefighter-logs",
    label: "Firefighter Logs",
    patterns: [/\bfirefighter\b.{0,48}\blogs?\b|\blogs?\b.{0,48}\bfirefighter\b/i],
    answerPatterns: [/\bfirefighter\b/i, /\blogs?\b/i, /\bsync/i, /\bcontroller\b/i, /\bsession\b/i]
  }
]);

const DATA_ASSESSMENT_NOISE = /\b(?:extract sample data|missing master data|data quality|data cleansing|data profiling|sample data from source)\b/i;

function chunkBlob(chunk = {}) {
  return [
    chunk.heading || chunk.section || "",
    chunk.sourceFile || chunk.fileName || "",
    chunk.sourceFolder || "",
    String(chunk.content || chunk.text || "").slice(0, 1200)
  ].join("\n");
}

/**
 * Extract required concepts for multi-part / comparison questions.
 * Extensible via CONCEPT_RULES — not limited to SAP migration.
 */
function extractRequiredConcepts(question = "") {
  const q = String(question || "");
  const matched = [];
  for (const rule of CONCEPT_RULES) {
    if (rule.patterns.some((re) => re.test(q))) {
      matched.push(rule);
    }
  }

  // ARA hierarchy quartet — only when all four are named together.
  const araIds = ["ara-risk", "ara-function", "ara-action", "ara-permission"];
  const araHits = matched.filter((r) => araIds.includes(r.id));
  if (araHits.length === 4) {
    return araHits.map((rule) => ({
      id: rule.id,
      label: rule.label,
      answerPatterns: rule.answerPatterns
    }));
  }

  // Drop partial ARA token hits so ordinary "risk" questions do not require all four.
  const filtered = matched.filter((r) => !araIds.includes(r.id));

  // Firefighter log troubleshooting requires log/sync substance when FF + logs are asked.
  if (/\bfirefighter\b/i.test(q) && /\blogs?\b/i.test(q)) {
    const ff = CONCEPT_RULES.find((r) => r.id === "firefighter-logs");
    if (ff && !filtered.some((r) => r.id === ff.id)) filtered.push(ff);
  }

  const required = filtered.map((rule) => ({
    id: rule.id,
    label: rule.label,
    answerPatterns: rule.answerPatterns,
    essentialPatterns: rule.essentialPatterns || [],
    minEssentialHits: rule.minEssentialHits || 0
  }));

  if (/\b(?:explain|compare|difference|versus|\bvs\b)\b/i.test(q) && required.length >= 2) {
    return required;
  }
  return required;
}

function conceptHitsInText(text, concept) {
  const blob = String(text || "");
  const primary = (concept.answerPatterns || concept.patterns || []).some((re) => re.test(blob));
  if (!primary) return false;
  const essentials = concept.essentialPatterns || [];
  if (!essentials.length) return true;
  const minHits = Math.max(1, Number(concept.minEssentialHits) || 1);
  const hits = essentials.filter((re) => re.test(blob)).length;
  return hits >= minHits;
}

function scoreChunkAgainstQuestion(question, chunk, requiredConcepts = []) {
  const q = String(question || "").toLowerCase();
  const blob = chunkBlob(chunk).toLowerCase();
  let score = 0;
  // Include 3-letter product stems (BRM, ARA, IPS, …) — length>=4 alone under-scored PFCG/BRM docs.
  const qTokens = q.split(/[^a-z0-9/+-]+/i).filter((t) => t.length >= 3);
  let tokenHits = 0;
  for (const token of qTokens.slice(0, 24)) {
    if (blob.includes(token)) tokenHits += 1;
  }
  score += Math.min(0.45, tokenHits * 0.04);

  let conceptsCovered = 0;
  for (const concept of requiredConcepts) {
    if (conceptHitsInText(blob, concept)) {
      conceptsCovered += 1;
      score += 0.22;
    }
  }

  // Provenance: source-file stem matching a question token is strong relevance
  // (pfcg.md for "PFCG", brm.md for "BRM") — prevents false IRRELEVANT_RETRIEVAL.
  const sourceFile = String(chunk?.sourceFile || chunk?.fileName || "").toLowerCase();
  const stem = sourceFile.replace(/^.*\//, "").replace(/\.md$/i, "");
  if (stem.length >= 3 && qTokens.some((tok) => stem === tok || stem.startsWith(`${tok}-`) || stem.endsWith(`-${tok}`))) {
    score += 0.35;
  }

  // Noise: data-assessment prose on a transition-path comparison is anti-relevant.
  if (requiredConcepts.some((c) => ["greenfield", "brownfield", "selective-data-transition"].includes(c.id))) {
    if (DATA_ASSESSMENT_NOISE.test(blob) && conceptsCovered === 0) score -= 0.5;
    if (/\b(?:greenfield|brownfield|selective data|bluefield|system conversion|new implementation)\b/i.test(blob)) {
      score += 0.2;
    }
  }

  const semantic = Number(chunk.score ?? chunk.semanticScore ?? chunk.confidenceScore ?? 0);
  if (Number.isFinite(semantic) && semantic > 0) score += Math.min(0.25, semantic * 0.25);

  return { score, conceptsCovered };
}

function detectConflictingClaims(chunks = [], requiredConcepts = []) {
  if (!Array.isArray(chunks) || chunks.length < 2) return false;
  // Lightweight conflict signal: opposite claims about the same required concept.
  const blobs = chunks.map((c) => chunkBlob(c));
  for (const concept of requiredConcepts) {
    const supporting = blobs.filter((b) => conceptHitsInText(b, concept));
    if (supporting.length < 2) continue;
    const positives = supporting.filter((b) => /\b(?:is|means|refers to|defined as)\b/i.test(b));
    const negations = supporting.filter((b) => /\b(?:is not|never|do not (?:use|treat)|unlike)\b/i.test(b));
    // Only flag when sources both assert and deny the same labeled path identity.
    if (positives.length && negations.length && /bluefield|selective|greenfield|brownfield/i.test(concept.id)) {
      const claimsGreenIsNew = supporting.some((b) => /greenfield.{0,40}new implementation/i.test(b));
      const claimsGreenIsConversion = supporting.some((b) => /greenfield.{0,40}(?:conversion|brownfield)/i.test(b));
      if (claimsGreenIsNew && claimsGreenIsConversion) return true;
    }
  }
  return false;
}

/**
 * Assess retrieval coverage for the actual question — not chunk count alone.
 */
function assessKnowledgeCoverage({
  question = "",
  chunks = [],
  analysis = {},
  minRelevantScore = 0.28
} = {}) {
  const requiredConcepts = extractRequiredConcepts(question);
  const list = Array.isArray(chunks) ? chunks : [];

  if (!list.length) {
    return {
      status: COVERAGE.NO_RELEVANT_KNOWLEDGE,
      requiredConcepts,
      coveredConceptIds: [],
      missingConceptIds: requiredConcepts.map((c) => c.id),
      relevantChunks: [],
      discardedChunks: [],
      conflict: false,
      allowGeneralKnowledge: true,
      useRetrievedAsGrounding: false
    };
  }

  const scored = list.map((chunk, index) => {
    const { score, conceptsCovered } = scoreChunkAgainstQuestion(question, chunk, requiredConcepts);
    return { chunk, index, score, conceptsCovered };
  });

  const relevant = scored.filter((row) => row.score >= minRelevantScore);
  const discarded = scored.filter((row) => row.score < minRelevantScore).map((row) => row.chunk);

  const coveredIds = new Set();
  for (const row of relevant) {
    for (const concept of requiredConcepts) {
      if (conceptHitsInText(chunkBlob(row.chunk), concept)) coveredIds.add(concept.id);
    }
  }
  const missingConceptIds = requiredConcepts.map((c) => c.id).filter((id) => !coveredIds.has(id));
  const conflict = detectConflictingClaims(relevant.map((r) => r.chunk), requiredConcepts);

  let status = COVERAGE.RELEVANT_SUFFICIENT;
  if (!relevant.length) {
    status = COVERAGE.IRRELEVANT_RETRIEVAL;
  } else if (requiredConcepts.length >= 2 && missingConceptIds.length === requiredConcepts.length) {
    // Retrieved something "related" but covers none of the named subjects.
    status = COVERAGE.IRRELEVANT_RETRIEVAL;
  } else if (requiredConcepts.length >= 2 && missingConceptIds.length > 0) {
    status = COVERAGE.RELEVANT_PARTIAL;
  } else if (requiredConcepts.length === 0 && relevant.length && relevant.every((r) => r.score < 0.35)) {
    status = COVERAGE.RELEVANT_PARTIAL;
  } else if (conflict) {
    status = COVERAGE.CONFLICTING_KNOWLEDGE;
  }

  // Empty-ish domain with weak hits → treat as no useful knowledge for grounding.
  if (status === COVERAGE.IRRELEVANT_RETRIEVAL && !relevant.length) {
    // keep IRRELEVANT
  }

  return {
    status,
    requiredConcepts,
    coveredConceptIds: [...coveredIds],
    missingConceptIds,
    relevantChunks: relevant.sort((a, b) => b.score - a.score).map((r) => r.chunk),
    discardedChunks: discarded,
    conflict,
    allowGeneralKnowledge: status !== COVERAGE.RELEVANT_SUFFICIENT || Boolean(analysis?.allowGeneralKnowledge),
    useRetrievedAsGrounding: [
      COVERAGE.RELEVANT_SUFFICIENT,
      COVERAGE.RELEVANT_PARTIAL,
      COVERAGE.CONFLICTING_KNOWLEDGE
    ].includes(status)
  };
}

/**
 * Build silent prompt directive for the coverage case. Never stream to UI.
 */
function buildCoverageDirective(coverage = {}, { domain = "", question = "" } = {}) {
  const status = coverage.status || COVERAGE.NO_RELEVANT_KNOWLEDGE;
  const missing = (coverage.missingConceptIds || []).join(", ");
  const topic = domain && domain !== "General" ? domain : "the asked technical domain";
  const focus = String(question || "").slice(0, 220);

  if (status === COVERAGE.RELEVANT_SUFFICIENT) {
    return [
      "KNOWLEDGE COVERAGE: RELEVANT_SUFFICIENT (silent).",
      "Ground the spoken answer in SUPPORTING KNOWLEDGE. Organise and explain — do not paste paragraphs.",
      "Add reasoning that does not contradict the sources. Do not invent release-specific T-codes or paths absent from evidence."
    ].join("\n");
  }

  if (status === COVERAGE.RELEVANT_PARTIAL) {
    return [
      "KNOWLEDGE COVERAGE: RELEVANT_PARTIAL (silent).",
      "Use relevant SUPPORTING KNOWLEDGE for the covered parts.",
      missing ? `Missing concepts to explain from established general technical knowledge: ${missing}.` : "Supplement gaps with established general technical knowledge.",
      "Clearly speak as methodology for gaps. Do not invent implementation-specific T-codes, APIs, tables, or release claims.",
      `Question focus: ${focus}`
    ].join("\n");
  }

  if (status === COVERAGE.CONFLICTING_KNOWLEDGE) {
    return [
      "KNOWLEDGE COVERAGE: CONFLICTING_KNOWLEDGE (silent).",
      "Sources disagree. Prefer the more reliable / release-aware statement when identifiable; otherwise qualify the unresolved detail.",
      "Do not invent a resolution. Do not pick a side solely because of retrieval rank."
    ].join("\n");
  }

  if (status === COVERAGE.IRRELEVANT_RETRIEVAL) {
    return [
      "KNOWLEDGE COVERAGE: IRRELEVANT_RETRIEVAL (silent).",
      "Retrieved chunks do NOT answer this question — they must be ignored as grounding.",
      `Answer from established general technical knowledge for ${topic}.`,
      "For multi-part comparison asks, define EACH named subject, contrast them, and give use-case / decision criteria.",
      "Do not invent SAP T-codes, APIs, tables, or release-specific paths. Qualify version-dependent claims.",
      "Never mention retrieval failure. Never use data-assessment / sample-extract prose unless the question asks for data migration steps.",
      `Question focus: ${focus}`
    ].join("\n");
  }

  // NO_RELEVANT_KNOWLEDGE
  return [
    "KNOWLEDGE COVERAGE: NO_RELEVANT_KNOWLEDGE (silent).",
    `Answer the user's exact question from established general technical knowledge for ${topic}.`,
    "Do not refuse merely because the knowledge base is empty. Do not return placeholders.",
    "Do not invent SAP T-codes, APIs, tables, authorization objects, or release-specific configuration paths.",
    "Qualify environment/version-dependent claims. Never claim personal candidate project delivery.",
    "For comparison questions: define each subject → differences → advantages/limits → use cases → decision criteria.",
    `Question focus: ${focus}`
  ].join("\n");
}

/**
 * Question-to-answer relevance gate — essential concepts must appear in the spoken answer.
 */
function evaluateAnswerConceptCoverage({ question = "", answer = "" } = {}) {
  const requiredConcepts = extractRequiredConcepts(question);
  const text = String(answer || "");
  if (!requiredConcepts.length) {
    return {
      ok: true,
      requiredConcepts: [],
      missingConceptIds: [],
      reason: "no-required-concepts"
    };
  }

  const missing = requiredConcepts.filter((c) => !conceptHitsInText(text, c));
  const isMigrationTrio = requiredConcepts.every((c) =>
    ["greenfield", "brownfield", "selective-data-transition"].includes(c.id)
  ) && requiredConcepts.length >= 3;

  // Reject known wrong pattern: data assessment instead of path definitions.
  if (isMigrationTrio && DATA_ASSESSMENT_NOISE.test(text) && missing.length >= 2) {
    return {
      ok: false,
      requiredConcepts,
      missingConceptIds: missing.map((c) => c.id),
      reason: "data-assessment-instead-of-transition-paths"
    };
  }

  if (missing.length) {
    return {
      ok: false,
      requiredConcepts,
      missingConceptIds: missing.map((c) => c.id),
      reason: "missing-essential-concepts"
    };
  }

  // Comparison asks should show contrast language when 2+ concepts required.
  if (requiredConcepts.length >= 2 && !/\b(?:whereas|while|unlike|differ|versus|vs\.?|by contrast|compared|rather than|instead)\b/i.test(text)) {
    // Soft fail only when no contrast cue — still require concepts present.
    return {
      ok: true,
      requiredConcepts,
      missingConceptIds: [],
      reason: "concepts-present-weak-contrast",
      softWarning: "weak-contrast"
    };
  }

  return {
    ok: true,
    requiredConcepts,
    missingConceptIds: [],
    reason: "concepts-covered"
  };
}

/**
 * Reject answers that invent release-specific SAP identifiers without knowledge support.
 * Uses a conservative pattern set — qualification phrases pass.
 */
function evaluateUnsupportedTechnicalDetail({ answer = "", knowledgeText = "" } = {}) {
  const spoken = String(answer || "");
  const knowledge = String(knowledgeText || "");
  if (!spoken.trim()) {
    return { ok: true, claims: [], reason: "empty" };
  }

  const tcodeLike = spoken.match(/\b(?:[A-Z]{2,5}\d{1,3}N?|\/[A-Z0-9_]+\/[A-Z0-9_]+)\b/g) || [];
  const claims = [];
  for (const token of [...new Set(tcodeLike)].slice(0, 20)) {
    if (/^(?:AND|THE|FOR|SAP|SOX|S4|ECC|GRC|IAG|IAS|IPS|BTP|SSO|MFA|JWT|URL)$/i.test(token)) continue;
    const inKnowledge = knowledge.toLowerCase().includes(token.toLowerCase());
    const qualified = new RegExp(
      `(?:depending on|version|release|confirm|verify|if available|where (?:supported|applicable)).{0,40}${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.{0,40}(?:depending on|version|release|confirm|verify)`,
      "i"
    ).test(spoken);
    if (!inKnowledge && !qualified) {
      claims.push(token);
    }
  }

  return {
    ok: claims.length === 0,
    claims,
    reason: claims.length ? "unverified-technical-identifiers" : "ok"
  };
}

/**
 * Comparison answer blueprint (silent prompt fragment).
 */
function buildComparisonAnswerBlueprint(question = "") {
  const concepts = extractRequiredConcepts(question);
  if (concepts.length < 2) return "";
  const names = concepts.map((c) => c.label).join(", ");
  return [
    "COMPARISON ANSWER BLUEPRINT (silent — speak as continuous first-person prose, never print these labels):",
    `1) Direct introduction naming ${names}.`,
    "2) Define each subject in turn.",
    "3) Main architectural or functional differences.",
    "4) Advantages and limitations of each.",
    "5) Suitable use cases.",
    "6) Decision criteria / practical recommendation where relevant.",
    "Do not substitute a data-extraction or master-data checklist for this comparison."
  ].join("\n");
}

/**
 * Deterministic spoken fallback for Greenfield / Brownfield / Selective Data Transition
 * when generation drifts into data-assessment prose. Methodology voice only — no fabricated
 * T-codes or personal delivery claims.
 */
function buildTransitionPathComparisonFallback(question = "") {
  void question;
  return [
    "When I explain S/4HANA transition paths, I separate three approaches rather than treating them as one migration checklist.",
    "Greenfield is a new implementation: you design the target process and data model cleanly and migrate only what the new design needs, accepting more redesign effort for a cleaner core.",
    "Brownfield is a system conversion: you move the existing ECC system toward S/4HANA, preserving much of the historical footprint and minimizing functional redesign, at the cost of carrying forward technical debt.",
    "Selective Data Transition — often discussed alongside Bluefield-style programmes — keeps selected configuration and history, consolidates or slices company codes and time periods, and redesigns only the scopes that must change; it is neither a pure new build nor a one-to-one conversion.",
    "I choose among them by process redesign appetite, data-history retention needs, risk tolerance, landscape consolidation goals, and cutover complexity — and I never substitute a sample-data extract or master-data cleansing plan for that path decision."
  ].join(" ");
}

module.exports = {
  COVERAGE,
  CONCEPT_RULES,
  extractRequiredConcepts,
  assessKnowledgeCoverage,
  buildCoverageDirective,
  evaluateAnswerConceptCoverage,
  evaluateUnsupportedTechnicalDetail,
  buildComparisonAnswerBlueprint,
  buildTransitionPathComparisonFallback,
  scoreChunkAgainstQuestion
};
