/**
 * Semantic prepared-script selection.
 * Exact pattern recall remains the fallback. Overview, motivation, comparison,
 * and named-engagement questions are selected by frame, not by extra phrase lists.
 */
const { EXPECTED_ANSWERS, recallExpectedAnswer } = require("../eval/lib/expectedAnswers.js");
const { namedProgrammeIds } = require("../eval/lib/careerTimeline.js");

const EXPERIENCE_SCRIPT = {
  dover: "complex-grc",
  eminnov: "eminov-hypercare"
};

const COMPARE_SCRIPTS = [
  { id: "security-vs-grc", terms: ["security", "grc", "govern", "enforce"] },
  { id: "sod-vs-least", terms: ["sod", "segregation", "least", "privilege"] },
  { id: "s4-vs-ecc", terms: ["s4", "s/4", "ecc", "hana", "fiori"] },
  { id: "grc-vs-detection", terms: ["detection", "siem", "threat", "monitor"] },
  { id: "authn-authz", terms: ["authentication", "authorization", "authenticate", "authorize"] },
  { id: "iam-iga-pam", terms: ["iam", "iga", "pam"] },
  { id: "risk-vs-control", terms: ["risk", "control"] }
];

function scriptById(id) {
  return EXPECTED_ANSWERS.find((entry) => entry.id === id) || null;
}

function pack(entry, via, confidence, frame) {
  if (!entry) return null;
  return {
    id: entry.id,
    answer: entry.answer,
    authoritative: true,
    via,
    confidence,
    frame
  };
}

function isOverviewRequest(question = "") {
  const text = String(question || "").toLowerCase();
  if (!text.trim()) return false;
  if (namedProgrammeIds(text).length) return false;
  if (/\bwhy\b/.test(text) && /\b(pre[-\s]?sales|hire|this role)\b/.test(text)) return false;
  if (/\b(situation|a time when|story|example of)\b/.test(text)) return false;
  const narrow = /\b(implementation|project|engagement|cutover|hypercare|hands-on|keyboard)\b/.test(text);
  if (/\b(profile|yourself|introduction|career)\b/.test(text)) return true;
  if (/\byour background\b/.test(text) && !narrow) return true;
  if (/\boverview of\b/.test(text) && !narrow) return true;
  if (/\bpre[-\s]?sales\b/.test(text) && /\b(experience|background|exposure|profile)\b/.test(text) && !narrow) return true;
  if (/\b(sap security|security)\s+experience\b/.test(text) && !narrow) return true;
  return false;
}

function asksAboutEngagement(question = "") {
  return /\b(experience|project|programme|program|role|worked|background|hypercare|cutover|team|users|how long|what did)\b/i.test(question);
}

function isMotivation(question = "") {
  const text = String(question || "").toLowerCase();
  if (!/\b(why|draws|fit|hire)\b/.test(text)) return null;
  if (/\bpre[-\s]?sales\b/.test(text)) return "why-presales";
  if (/\b(hire|fit)\b/.test(text)) return "why-hire";
  return null;
}

function isCompare(question = "") {
  return /\b(difference|differ|versus|vs\.?|compared|compare|relat(?:e|es|ed)|separat\w+)\b/i.test(question);
}

function compareMatch(question = "") {
  const text = String(question || "").toLowerCase();
  const scored = COMPARE_SCRIPTS.map((script) => {
    const hits = script.terms.filter((term) => text.includes(term));
    return { id: script.id, hits: hits.length };
  }).sort((left, right) => right.hits - left.hits);
  const best = scored[0];
  const second = scored[1];
  if (!best || best.hits < 2) return null;
  if (second && second.hits >= best.hits) return null;
  return pack(scriptById(best.id), "semantic", 0.8, "compare");
}

function guardProgramme(result, question) {
  if (!result) return null;
  const named = namedProgrammeIds(question);
  if (!named.length) return result;
  const mentioned = namedProgrammeIds(result.answer);
  if (mentioned.some((id) => !named.includes(id))) return null;
  return result;
}

function resolvePreparedScript(question = "") {
  const text = String(question || "");
  if (!text.trim()) return null;
  if (isOverviewRequest(text)) return guardProgramme(pack(scriptById("about-yourself"), "semantic", 0.9, "overview"), text);
  const named = namedProgrammeIds(text);
  if (named.length === 1 && asksAboutEngagement(text) && EXPERIENCE_SCRIPT[named[0]]) {
    return guardProgramme(pack(scriptById(EXPERIENCE_SCRIPT[named[0]]), "semantic", 0.86, "experience"), text);
  }
  const motivation = isMotivation(text);
  if (motivation) return guardProgramme(pack(scriptById(motivation), "semantic", 0.84, "motivation"), text);
  if (isCompare(text)) {
    const compared = compareMatch(text);
    if (compared) return guardProgramme(compared, text);
  }
  const exact = recallExpectedAnswer(text);
  if (exact?.answer) return guardProgramme(pack(exact, "pattern", 1, "pattern"), text);
  return null;
}

module.exports = {
  isOverviewRequest,
  resolvePreparedScript
};
