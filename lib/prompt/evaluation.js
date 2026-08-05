import appConfig from "../../config/appConfig";

function countHits(text, list = []) {
  return list.reduce((count, phrase) => (text.includes(phrase) ? count + 1 : count), 0);
}

// Catches common first-person ownership phrasing that a fixed phrase list misses
// (e.g. "I implemented X", "at my last client", "our team built..."). Combined with
// the config-driven hallucinationPhrases list below — the list catches exact known
// phrases, this regex catches the grammatical pattern.
const OWNERSHIP_PATTERN = /\bi\s+(implemented|configured|built|led|designed|deployed|migrated|architected|delivered|managed|owned|rolled out|set up|handled|maintained|supported)\b|\bmy\s+(last|previous|prior|current)?\s?(client|project|team|deployment|engagement|implementation)\b|\bour\s+(client|customer|team)\b/;

function sentenceStats(answer) {
  const sentences = answer.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length === 0) return { count: 0, avgWords: 0 };
  const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0);
  return { count: sentences.length, avgWords: totalWords / sentences.length };
}

// Pure string/regex heuristics — no LLM call, sub-millisecond. Runs strictly after the
// answer has already streamed to the user (see pages/api/chat.js). Never gates or
// regenerates the answer — informational only, surfaced via the trailing `event: analysis`
// SSE frame. Does NOT compute followUpReadiness (lib/prompt/followupAnalyzer.js owns that;
// lib/prompt/index.js merges it into the category-score map before scoring).
export function evaluateAnswer({ question = "", answer = "", analysis = {}, sapComponents = [], candidateResume = "" }) {
  const cfg = appConfig.evaluation || {};
  const thresholds = cfg.thresholds || {};
  const scale = cfg.scale ?? 10;
  const text = (answer || "").toLowerCase();
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const findings = [];

  const categoryScores = {
    technicalAccuracy: scale,
    experienceConsistency: scale,
    spokenDelivery: scale,
    naturalConversation: scale,
    ownership: scale,
    completeness: scale,
    conciseness: scale
  };

  // --- Technical Accuracy: SAP component + keyword depth ---
  const componentHits = sapComponents.filter(c => text.includes(String(c).toLowerCase())).length;
  if (sapComponents.length > 0 && componentHits < Math.min(thresholds.minSapComponentHits ?? 2, sapComponents.length)) {
    categoryScores.technicalAccuracy -= 2;
    findings.push("Expected SAP components are underrepresented.");
  }
  const keywordHits = countHits(text, cfg.technicalKeywords || []);
  if (keywordHits < (thresholds.minTechnicalKeywordHits ?? 2)) {
    categoryScores.technicalAccuracy -= 2;
    findings.push("Technical depth is weak — few concrete SAP objects or T-codes mentioned.");
  }

  // --- Experience Consistency + Ownership: ownership language cross-checked against candidateResume.
  // Heuristic approximation, not semantic verification: if candidateResume is empty, any ownership
  // phrase is a likely fabrication; if present, it's only flagged when none of the mentioned SAP
  // components appear in the resume text. Known limitation — documented in lib/prompt/README.md.
  const hasHallucinationPhrase = (cfg.hallucinationPhrases || []).some(phrase => text.includes(phrase));
  const hasOwnershipPattern = OWNERSHIP_PATTERN.test(text);
  if (hasHallucinationPhrase || hasOwnershipPattern) {
    const resumeText = (candidateResume || "").toLowerCase();
    const supportedByResume = resumeText && sapComponents.some(c => resumeText.includes(String(c).toLowerCase()));
    if (!candidateResume) {
      categoryScores.experienceConsistency -= thresholds.hallucinationPenaltyNoResume ?? 4;
      categoryScores.ownership -= thresholds.hallucinationPenaltyNoResume ?? 4;
      findings.push("Ownership language used with no candidate background on file — possible fabricated experience.");
    } else if (!supportedByResume) {
      categoryScores.experienceConsistency -= thresholds.hallucinationPenaltyUnsupported ?? 2;
      categoryScores.ownership -= thresholds.hallucinationPenaltyUnsupported ?? 2;
      findings.push("Ownership language doesn't clearly map to anything in the candidate's background.");
    }
  }

  // --- Spoken Delivery: sentence length + markdown leakage (prompt forbids markdown) ---
  const { avgWords } = sentenceStats(answer);
  if (avgWords > (thresholds.maxAvgSentenceWords ?? 22)) {
    categoryScores.spokenDelivery -= 2;
    findings.push("Sentences run long for spoken delivery.");
  }
  if (/^\s*[-*#]|\n\s*\d+\./.test(answer)) {
    categoryScores.spokenDelivery -= 2;
    findings.push("Answer contains markdown or list formatting — not spoken-friendly.");
  }

  // --- Natural Conversation: generic/textbook phrases + filler words ---
  const genericHits = countHits(text, cfg.genericPhrases || []);
  if (genericHits > 0) {
    categoryScores.naturalConversation -= genericHits * (thresholds.genericPhrasePenalty ?? 1);
    findings.push(`Contains ${genericHits} generic or textbook phrase(s).`);
  }
  const fillerHits = countHits(text, cfg.fillerPhrases || []);
  if (fillerHits > 0) {
    categoryScores.naturalConversation -= fillerHits * (thresholds.fillerPhrasePenalty ?? 0.5);
    findings.push(`Contains ${fillerHits} filler word(s).`);
  }

  // --- Completeness: business framing present ---
  if (!text.includes("business") && !text.includes("objective") && !text.includes("requirement")) {
    categoryScores.completeness -= 2;
    findings.push("Business framing is missing.");
  }

  // --- Conciseness: word count band ---
  if (words < (thresholds.wordCountMin ?? 70)) {
    categoryScores.conciseness -= 2;
    findings.push("Answer is too short for a live interview.");
  }
  if (words > (thresholds.wordCountMax ?? 180)) {
    categoryScores.conciseness -= 2;
    findings.push("Answer is too long for a live interview.");
  }

  Object.keys(categoryScores).forEach(key => {
    categoryScores[key] = Math.max(0, Math.min(scale, categoryScores[key]));
  });

  return { categoryScores, findings };
}
