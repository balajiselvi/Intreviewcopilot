/**
 * Top-100 SAP Security / GRC Senior Consultant prepared-answer bank.
 *
 * Prefer exact/normalized/alias hits. Accept a high-confidence near match only when
 * product/capability markers and task families agree. Never match on shared keywords
 * alone (ARA ≠ ARM ≠ MSMP; AC ≠ PC; PFCG ≠ IAG Role Design; Public ≠ Private).
 *
 * Answers are returned verbatim from data/answer-bank JSON. This module does not
 * rewrite authored answer text.
 */

const path = require("path");

// JSON require keeps this module usable from both the API route and the client
// interview admission path (pages/interview.js imports turnDecision). Do not use fs.
const BANK_DATA = require("../data/answer-bank/SAP_Security_GRC_Senior_Consultant_Top_100_QA.json");
const SUPPLEMENT_DATA = require("../data/answer-bank/SAP_Security_GRC_Connector_Supplement.json");
const SCENARIO_DATA = require("../data/answer-bank/SAP_Security_GRC_Scenario_Challenges_Supplement.json");
const BANK_JSON = path.join(
  __dirname,
  "..",
  "data",
  "answer-bank",
  "SAP_Security_GRC_Senior_Consultant_Top_100_QA.json"
);
const SUPPLEMENT_JSON = path.join(
  __dirname,
  "..",
  "data",
  "answer-bank",
  "SAP_Security_GRC_Connector_Supplement.json"
);
const SCENARIO_JSON = path.join(
  __dirname,
  "..",
  "data",
  "answer-bank",
  "SAP_Security_GRC_Scenario_Challenges_Supplement.json"
);
const BANK_SOURCES = Object.freeze([
  { id: "top100", data: BANK_DATA, path: BANK_JSON },
  { id: "connector-supplement", data: SUPPLEMENT_DATA, path: SUPPLEMENT_JSON },
  { id: "scenario-supplement", data: SCENARIO_DATA, path: SCENARIO_JSON }
]);

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "how",
  "do", "you", "what", "when", "where", "why", "is", "are", "be", "by", "from",
  "your", "me", "walk", "through", "explain", "describe", "tell", "about",
  "would", "can", "could", "should", "does", "did", "an", "as", "at", "it",
  "this", "that", "into", "over", "under", "vs", "versus"
]);

const CAPABILITY_MARKERS = Object.freeze([
  ["IAG_ACCESS_ANALYSIS", /\b(?:iag\s+)?access analysis\b|\biag\b.{0,40}\brisk analysis\b/i],
  ["IAG_ACCESS_REQUEST", /\biag\b.{0,40}\baccess request\b|\biag\b.{0,40}\brequest type\b/i],
  ["IAG_ROLE_DESIGN", /\biag\b.{0,40}\brole design(?:er)?\b|\brole designer\b/i],
  ["IAG_CERTIFICATION", /\biag\b.{0,40}\bcertification\b|\bcertification review\b/i],
  ["IAG_PAM", /\biag\b.{0,40}\b(?:pam|privileged access)\b|\bprivileged access management\b/i],
  ["IAG", /\b(?:sap cloud )?identity access governance\b|\biag\b/i],
  ["ARA", /\b\bara\b|\baccess risk analysis\b/i],
  ["ARM", /\b\barm\b|\baccess request management\b/i],
  ["MSMP", /\bmsmp\b/i],
  ["BRF", /\bbrf\+?\b|\bbrfplus\b/i],
  ["EAM", /\b\beam\b|\bfirefighter\b|\bemergency access\b/i],
  ["BRM", /\b\bbrm\b|\bbusiness role management\b/i],
  ["PROCESS_CONTROL", /\bprocess control\b|\bmanual control test\b|\bcontrol objectives?\b/i],
  ["PFCG", /\bpfcg\b/i],
  ["PUBLIC_EDITION", /\bpublic\s+(?:cloud\s+)?edition\b|\bs\/?4(?:hana)?\s+cloud(?!\s+private)/i],
  ["PRIVATE_EDITION", /\bprivate\s+(?:cloud\s+)?edition\b|\bon[-\s]?premise\b/i],
  ["FIORI", /\bfiori\b/i],
  ["SU24", /\bsu24\b/i],
  ["SU25", /\bsu25\b/i],
  ["CONNECTOR", /\bconnectors?\b/i],
  ["IDM", /\b(?:sap )?idm\b|\bidentity management\b/i]
]);

const CAPABILITY_CONFLICTS = Object.freeze([
  ["ARA", "ARM"],
  ["ARA", "MSMP"],
  ["ARM", "ARA"],
  ["MSMP", "ARA"],
  ["PROCESS_CONTROL", "ARA"],
  ["PROCESS_CONTROL", "ARM"],
  ["PROCESS_CONTROL", "MSMP"],
  ["IAG", "MSMP"],
  ["IAG", "BRF"],
  ["IAG_ACCESS_ANALYSIS", "IAG_ROLE_DESIGN"],
  ["IAG_ACCESS_ANALYSIS", "IAG_ACCESS_REQUEST"],
  ["IAG_ACCESS_ANALYSIS", "IAG_CERTIFICATION"],
  ["IAG_ACCESS_ANALYSIS", "IAG_PAM"],
  ["IAG_ROLE_DESIGN", "IAG_ACCESS_ANALYSIS"],
  ["IAG_ROLE_DESIGN", "IAG_ACCESS_REQUEST"],
  ["IAG_ROLE_DESIGN", "PFCG"],
  ["IAG_ACCESS_REQUEST", "MSMP"],
  ["PUBLIC_EDITION", "PRIVATE_EDITION"],
  ["PRIVATE_EDITION", "PUBLIC_EDITION"],
  ["PFCG", "IAG_ROLE_DESIGN"]
]);

const TASK_FAMILY = Object.freeze({
  assessment: "assess",
  architecture: "design",
  diagnosis: "diagnose",
  design: "design",
  evidence: "validate",
  prioritization: "prioritize",
  communication: "communicate",
  "decision-making": "decide",
  "program design": "design",
  implementation: "implement",
  concept: "concept",
  governance: "govern",
  testing: "validate",
  comparison: "compare",
  migration: "migrate",
  "change assessment": "assess",
  validation: "validate",
  operations: "operate",
  "change impact": "assess",
  "control design": "design",
  "control testing": "validate",
  remediation: "remediate",
  measurement: "validate",
  troubleshooting: "diagnose",
  "incident response": "diagnose",
  planning: "plan",
  management: "manage",
  coordination: "manage",
  transition: "migrate",
  estimation: "plan",
  "stakeholder management": "communicate",
  "people management": "manage",
  proposal: "communicate",
  "continuous improvement": "govern",
  "truthful response": "interview",
  "experience framework": "interview",
  escalation: "manage",
  evidence: "validate",
  scenario: "scenario",
  incident: "scenario",
  behavioral: "scenario",
  leadership: "scenario"
});

const QUESTION_TASK_CUES = Object.freeze([
  // Behavioural/STAR prompts must win over technical "how do you configure" cues.
  ["scenario", /\b(?:tell me about a (?:time|situation|case|challeng\w*|difficult|real|production|critical)|describe a (?:time|situation|case)|walk me through a (?:real|production|critical|difficult)|difficult|challeng\w*|how did you (?:handle|resolve|lead|escalate)|lesson learned|disagreement with|stakeholder|tight deadline|go[\s-\/]?no[\s-\/]?go)\b/i],
  ["diagnose", /\b(?:troubleshoot|diagnos\w*|stuck|fails?|failed|missing|no approver|sudden drop|cannot|can't|incomplete)\b/i],
  ["implement", /\b(?:configure|configuration|set up|setup|implement|end-to-end|main steps)\b/i],
  ["compare", /\b(?:difference|differ|versus|vs\.?|compared|compare|separat\w+)\b/i],
  ["concept", /\b(?:what is|define|definition|explain what)\b/i],
  ["design", /\b(?:design|architect(?:ure)?|model|approach)\b/i],
  ["validate", /\b(?:test|validate|validation|verify|evidence)\b/i],
  ["remediate", /\b(?:remediat|fix|correct|resolve)\w*\b/i],
  ["migrate", /\b(?:migrat\w*|cutover|greenfield|brownfield)\b/i],
  ["operate", /\b(?:monitor|monitoring|operations?)\b/i],
  ["govern", /\b(?:govern(?:ance)?|recertif\w*|policy)\b/i],
  ["assess", /\b(?:assess(?:ment)?|review)\b/i]
]);

let cachedBank = null;

function freezeEntry(entry, packId = "top100") {
  return Object.freeze({
    id: String(entry.id || ""),
    question: String(entry.question || ""),
    domain: String(entry.domain || ""),
    task: String(entry.task || ""),
    aliases: Array.isArray(entry.aliases) ? entry.aliases.map((a) => String(a)) : [],
    answer: String(entry.answer || ""),
    must_include: Array.isArray(entry.must_include) ? entry.must_include : [],
    must_not: Array.isArray(entry.must_not) ? entry.must_not : [],
    answer_type: String(entry.answer_type || ""),
    candidate_specific: Boolean(entry.candidate_specific),
    verification_status: String(entry.verification_status || ""),
    source_refs: Array.isArray(entry.source_refs) ? entry.source_refs : [],
    experience_label: String(entry.experience_label || ""),
    pack_id: packId,
    _normQuestion: normalizeText(entry.question),
    _normAliases: (Array.isArray(entry.aliases) ? entry.aliases : []).map(normalizeText).filter(Boolean),
    _capabilities: detectCapabilities(`${entry.question} ${entry.domain} ${(entry.aliases || []).join(" ")}`),
    _taskFamily: TASK_FAMILY[String(entry.task || "").toLowerCase()] || "general",
    _tokens: tokenize(`${entry.question} ${(entry.aliases || []).join(" ")} ${entry.domain}`)
  });
}

function loadBank() {
  if (cachedBank) return cachedBank;
  const questions = [];
  const packs = [];
  for (const source of BANK_SOURCES) {
    const raw = source.data || {};
    const list = Array.isArray(raw.questions) ? raw.questions : [];
    packs.push({
      id: source.id,
      path: source.path,
      title: raw.title || "",
      version: raw.version || "",
      count: list.length
    });
    for (const entry of list) questions.push(freezeEntry(entry, source.id));
  }
  cachedBank = {
    meta: {
      title: "Interview answer bank (Top-100 + supplements)",
      version: `${BANK_DATA.version || "1.0"}+supplements`,
      total_questions: questions.length,
      path: BANK_JSON,
      packs
    },
    questions
  };
  return cachedBank;
}

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\w\s+/'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\?+$/, "")
    .trim();
}

function tokenize(value = "") {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function detectCapabilities(text = "") {
  const found = [];
  for (const [id, pattern] of CAPABILITY_MARKERS) {
    if (pattern.test(text)) found.push(id);
  }
  // Prefer specific IAG service markers over bare IAG when both fire.
  const specificIag = found.filter((id) => id.startsWith("IAG_"));
  if (specificIag.length) {
    return [...new Set(found.filter((id) => id !== "IAG" || specificIag.length === 0))];
  }
  return [...new Set(found)];
}

function inferQuestionTaskFamily(question = "") {
  for (const [family, pattern] of QUESTION_TASK_CUES) {
    if (pattern.test(question)) return family;
  }
  return "general";
}

function capabilitiesConflict(questionCaps = [], entryCaps = []) {
  if (!questionCaps.length || !entryCaps.length) return false;
  for (const [left, right] of CAPABILITY_CONFLICTS) {
    if (questionCaps.includes(left) && entryCaps.includes(right) && !questionCaps.includes(right)) {
      return true;
    }
    if (questionCaps.includes(right) && entryCaps.includes(left) && !questionCaps.includes(left)) {
      return true;
    }
  }
  // Question names a specific capability the entry does not share.
  const specificQuestion = questionCaps.filter((cap) => !["IAG"].includes(cap));
  if (specificQuestion.length) {
    const sharedSpecific = specificQuestion.filter((cap) => entryCaps.includes(cap));
    if (!sharedSpecific.length) {
      // Allow broad SAP Security entries when the question only names PFCG/SU24
      // and the entry is also a classic authorization item.
      const classicAuth = ["PFCG", "SU24", "SU25", "FIORI", "PRIVATE_EDITION", "PUBLIC_EDITION"];
      const qClassic = specificQuestion.every((cap) => classicAuth.includes(cap));
      const eClassic = entryCaps.some((cap) => classicAuth.includes(cap)) || !entryCaps.length;
      if (!(qClassic && eClassic)) return true;
    }
  }
  return false;
}

function taskCompatible(questionFamily, entryFamily, { exact = false } = {}) {
  if (exact) return true;
  if (!questionFamily || questionFamily === "general") return true;
  if (!entryFamily || entryFamily === "general") return true;
  if (questionFamily === entryFamily) return true;
  // Soft adjacency: validate can accept testing-oriented governance answers.
  if (questionFamily === "validate" && ["validate", "govern"].includes(entryFamily)) return true;
  if (questionFamily === "implement" && entryFamily === "design") return false;
  if (questionFamily === "diagnose" && ["implement", "design", "compare", "concept", "operate"].includes(entryFamily)) return false;
  if (questionFamily === "compare" && entryFamily !== "compare") return false;
  if (questionFamily === "concept" && ["operate", "implement", "diagnose", "migrate", "scenario"].includes(entryFamily)) return false;
  if (questionFamily === "operate" && ["concept", "implement", "compare", "scenario"].includes(entryFamily)) return false;
  if (questionFamily === "implement" && ["concept", "operate", "scenario"].includes(entryFamily)) return false;
  if (questionFamily === "scenario" && ["concept", "compare"].includes(entryFamily)) return false;
  if (questionFamily !== "scenario" && entryFamily === "scenario") return false;
  return false;
}

function jaccard(aTokens = [], bTokens = []) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const token of a) if (b.has(token)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function pack(entry, via, confidence, reason = "") {
  return {
    id: entry.id,
    answer: entry.answer,
    question: entry.question,
    domain: entry.domain,
    task: entry.task,
    candidate_specific: entry.candidate_specific,
    experience_label: entry.experience_label || "",
    pack_id: entry.pack_id || "",
    verification_status: entry.verification_status || "",
    authoritative: true,
    via,
    confidence,
    reason,
    source: "answer-bank"
  };
}

function validateBankIntegrity(bank = loadBank()) {
  const ids = new Set();
  const questions = new Set();
  const errors = [];
  let top100 = 0;
  let supplement = 0;
  let connector = 0;
  let scenario = 0;
  for (const entry of bank.questions) {
    const okId = /^SAPSC-\d{3}$/.test(entry.id) || /^SAPSUP-\d{3}$/.test(entry.id) || /^SAPSCN-\d{3}$/.test(entry.id);
    if (!okId) errors.push(`bad id ${entry.id}`);
    if (/^SAPSC-\d{3}$/.test(entry.id)) top100 += 1;
    if (/^SAPSUP-\d{3}$/.test(entry.id)) {
      connector += 1;
      supplement += 1;
    }
    if (/^SAPSCN-\d{3}$/.test(entry.id)) {
      scenario += 1;
      supplement += 1;
    }
    if (ids.has(entry.id)) errors.push(`duplicate id ${entry.id}`);
    ids.add(entry.id);
    const q = normalizeText(entry.question);
    if (!q) errors.push(`empty question ${entry.id}`);
    if (questions.has(q)) errors.push(`duplicate question ${entry.id}`);
    questions.add(q);
    if (!entry.answer || !entry.answer.trim()) errors.push(`empty answer ${entry.id}`);
    if (!entry.domain) errors.push(`missing domain ${entry.id}`);
    if (!entry.task) errors.push(`missing task ${entry.id}`);
  }
  if (top100 !== 100) errors.push(`expected 100 SAPSC records, got ${top100}`);
  if (connector < 10) errors.push(`expected at least 10 SAPSUP records, got ${connector}`);
  if (scenario < 20) errors.push(`expected at least 20 SAPSCN records, got ${scenario}`);
  for (let i = 1; i <= 100; i += 1) {
    const id = `SAPSC-${String(i).padStart(3, "0")}`;
    if (!ids.has(id)) errors.push(`missing id ${id}`);
  }
  return {
    ok: errors.length === 0,
    count: bank.questions.length,
    top100,
    supplement,
    connector,
    scenario,
    uniqueIds: ids.size,
    uniqueQuestions: questions.size,
    errors
  };
}

/**
 * Match a live question to the Top-100 bank.
 * @param {string} question
 * @param {{ priorQuestion?: string, priorBankId?: string }} [options]
 */
function matchAnswerBank(question = "", options = {}) {
  const text = String(question || "").trim();
  if (!text) return null;
  const bank = loadBank();
  const norm = normalizeText(text);
  const qCaps = detectCapabilities(text);
  const qTask = inferQuestionTaskFamily(text);
  const qTokens = tokenize(text);

  // Exact canonical or approved alias match.
  for (const entry of bank.questions) {
    if (entry._normQuestion === norm || entry._normAliases.includes(norm)) {
      if (capabilitiesConflict(qCaps, entry._capabilities) && entry._normQuestion !== norm) {
        continue;
      }
      return pack(entry, "exact", 1, "canonical-or-alias");
    }
  }

  // Normalized punctuation-only variants of the canonical question (already covered by normalize),
  // plus alias containment when the alias is a substantial approved wording and product/task agree.
  for (const entry of bank.questions) {
    for (const alias of entry._normAliases) {
      if (!alias || alias.length < 12) continue;
      if (norm === alias || norm.includes(alias) || alias.includes(norm)) {
        if (capabilitiesConflict(qCaps, entry._capabilities)) continue;
        if (!taskCompatible(qTask, entry._taskFamily)) continue;
        return pack(entry, "alias", 0.94, "approved-variant");
      }
    }
  }

  // Follow-up with a changed task must not reuse a stale bank hit via weak overlap.
  if (options.priorBankId && qTask === "diagnose") {
    const prior = bank.questions.find((entry) => entry.id === options.priorBankId);
    if (prior && prior._taskFamily !== "diagnose") {
      // Continue scoring; do not short-circuit to prior.
    }
  }

  // High-confidence semantic candidates: score only a filtered subset.
  const candidates = [];
  for (const entry of bank.questions) {
    if (capabilitiesConflict(qCaps, entry._capabilities)) continue;
    if (!taskCompatible(qTask, entry._taskFamily)) continue;
    const score = jaccard(qTokens, entry._tokens);
    if (score < 0.55) continue;
    candidates.push({ entry, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  if (!best) return null;
  if (best.score < 0.72) return null;
  if (second && (best.score - second.score) < 0.1) return null;
  // Reject near-miss different-task even if token overlap is high.
  if (!taskCompatible(qTask, best.entry._taskFamily)) return null;
  return pack(best.entry, "semantic", Number(best.score.toFixed(3)), "high-confidence-compatible");
}

function getAnswerBankMeta() {
  const bank = loadBank();
  return { ...bank.meta, integrity: validateBankIntegrity(bank) };
}

function resetAnswerBankCacheForTests() {
  cachedBank = null;
}

module.exports = {
  BANK_JSON,
  SUPPLEMENT_JSON,
  SCENARIO_JSON,
  BANK_SOURCES,
  loadBank,
  matchAnswerBank,
  validateBankIntegrity,
  getAnswerBankMeta,
  normalizeText,
  detectCapabilities,
  inferQuestionTaskFamily,
  resetAnswerBankCacheForTests
};
