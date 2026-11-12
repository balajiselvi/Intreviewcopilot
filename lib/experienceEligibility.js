/**
 * Runtime ownership boundary for candidate experience injection.
 * Decides whether programme/CV metrics may enter the prompt for THIS question.
 * Career facts remain in eval/lib/careerTimeline.js (shimmed for tests); eligibility is enforced here.
 */

const PERSONAL_EXPERIENCE_ASK =
  /\b(?:have you|did you|your experience|tell me about(?:\s+your|\s+a\s+time)?|walk me through(?:\s+your|\s+a\s+time)?|your role|your responsibilities|worked with|worked on|in your project|on your project|at\s+(?:dover|eminnov|fabtech|enerlife)|your\s+(?:s\/?4|grc|implementation|programme|program|engagement))\b/i;

const EXPLICIT_IMPLEMENTATION_ASK =
  /\b(?:how (?:did|have) you|explain how you|describe how you|how you (?:implemented|configured|designed|resolved|approached)|your approach to|how you would approach)\b/i;

const CONCEPTUAL_OPENER =
  /^\s*(?:what\s+are|what\s+is|what's|whats|what\s+(?:exactly|actually|precisely)\s+is|what\s+does|define|explain|describe)\b/i;

const CONCEPTUAL_EXCLUSIONS =
  /\b(?:how you|your experience|your project|your approach|in production|you implemented|you configured|you designed|you resolved|tell me about|walk me through a time)\b/i;

const PROJECT_METRIC_LEAK =
  /\b(?:1[,.]?650|350\s+business\s+roles?|220\s+Fiori\s+catalogs?|2[,.]?400\+?\s+(?:SoD\s+)?conflicts?|8[,.]?700\+?\s+users?|Dover(?:\s+Corporation)?)\b/i;

/**
 * Conceptual / definitional technical asks that must not receive programme metrics.
 * Distinguishes "Explain X" from "Explain how you implemented X".
 */
function isConceptualTechnicalQuestion(question = "") {
  const q = String(question || "").trim();
  if (!q) return false;
  if (PERSONAL_EXPERIENCE_ASK.test(q) || EXPLICIT_IMPLEMENTATION_ASK.test(q)) return false;
  if (CONCEPTUAL_EXCLUSIONS.test(q)) return false;
  if (!CONCEPTUAL_OPENER.test(q)) return false;
  // Difference / components / lifecycle of a concept remain conceptual.
  if (/\b(?:difference|versus|\bvs\b|compare|components?|lifecycle|mean(?:s|ing)?)\b/i.test(q)) {
    return !PERSONAL_EXPERIENCE_ASK.test(q);
  }
  // Short or mid-length concept asks (not multi-clause design briefs).
  const words = q.split(/\s+/).filter(Boolean).length;
  return words <= 16;
}

function allowsCandidateExperienceInjection(question = "") {
  const q = String(question || "").trim();
  if (!q) return false;
  if (isConceptualTechnicalQuestion(q)) return false;
  if (PERSONAL_EXPERIENCE_ASK.test(q) || EXPLICIT_IMPLEMENTATION_ASK.test(q)) return true;
  // Configuration / troubleshooting / architecture with personal framing already covered.
  // Default: withhold programme metrics unless the ask clearly wants experience.
  return false;
}

function answerContainsDisallowedProjectMetrics(question = "", answer = "") {
  if (allowsCandidateExperienceInjection(question)) return false;
  return PROJECT_METRIC_LEAK.test(String(answer || ""));
}

module.exports = {
  isConceptualTechnicalQuestion,
  allowsCandidateExperienceInjection,
  answerContainsDisallowedProjectMetrics,
  PROJECT_METRIC_LEAK,
  PERSONAL_EXPERIENCE_ASK
};
