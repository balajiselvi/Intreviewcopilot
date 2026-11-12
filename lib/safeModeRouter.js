/**
 * Interview-day safe mode routing.
 * Order: prepared pack (APPROVED) > verified workflow > retrieved procedure
 * > conceptual knowledge (definition/comparison) > principle-level.
 * Free generation must not invent new SAP identifiers when safe mode is ON.
 */
const { matchPreparedAnswer, DEFAULT_PROFILE_SLUG } = require("./preparedAnswerPack.js");
const { selectVerifiedWorkflow } = require("./verifiedWorkflow.js");
const { shouldPreferRetrievedProcedure } = require("./procedureRetention.js");
const {
  isConceptualQuestion,
  isEamCentralDecentralTask,
  extractConceptualSpokenFromKnowledge
} = require("./generationGuard.js");

function isSafeModeEnabled(body = {}, env = process.env) {
  if (body && Object.prototype.hasOwnProperty.call(body, "safeMode")) {
    return body.safeMode !== false && body.safeMode !== "false" && body.safeMode !== 0;
  }
  if (env.INTERVIEW_SAFE_MODE === "0" || env.INTERVIEW_SAFE_MODE === "false") return false;
  return true; // default ON for live sessions
}

function shapeSpokenSafe(answer = "", headline = "") {
  // Preserve T-code / path underscores and hyphens (GRFNMW_CONFIGURE, /UI2/FLPCM_CUST).
  // Only strip markdown emphasis / heading markers and blockquote leaders.
  let text = String(answer || "")
    .replace(/[*`#]+/g, " ")
    .replace(/^>\s?/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!/[.!?]$/.test(text) && text) text = `${text}.`;
  const head = String(headline || "").replace(/[*`#]+/g, " ").replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
  if (head && !text.toLowerCase().startsWith(head.toLowerCase().slice(0, Math.min(24, head.length)))) {
    const headSentence = /[.!?]$/.test(head) ? head : `${head}.`;
    text = `${headSentence} ${text}`.trim();
  }
  return text;
}

/**
 * Resolve safe-mode answer without free generation of new SAP facts.
 */
function resolveSafeModeAnswer({
  question,
  profileSlug = DEFAULT_PROFILE_SLUG,
  knowledgeText = "",
  answerScope = "",
  seniority = ""
} = {}) {
  const prepared = matchPreparedAnswer(question, { profileSlug });
  if (prepared.hit && prepared.answer) {
    return {
      served: true,
      route: "PREPARED_PACK",
      reason: "approved-pack-match",
      answer: shapeSpokenSafe(prepared.answer, prepared.headline),
      meta: { score: prepared.score, entryId: prepared.entry?.id }
    };
  }

  try {
    const verified = selectVerifiedWorkflow(question);
    if (verified?.answer) {
      return {
        served: true,
        route: "VERIFIED_WORKFLOW",
        reason: "verified-workflow",
        answer: shapeSpokenSafe(verified.answer),
        meta: { scriptId: verified.id || null }
      };
    }
  } catch {
    // non-fatal
  }

  try {
    const prefer = shouldPreferRetrievedProcedure({
      question,
      knowledgeText,
      answerScope,
      seniority
    });
    if (prefer.prefer && prefer.spoken) {
      return {
        served: true,
        route: "RETRIEVED_PROCEDURE",
        reason: prefer.reason || "coherent-source-procedure",
        answer: shapeSpokenSafe(prefer.spoken),
        meta: { wrapMode: prefer.wrapMode, stepCount: prefer.stepCount }
      };
    }
  } catch {
    // non-fatal
  }

  // Central vs decentral EAM / Firefighter deploy asks: prefer live spoken generation over
  // concatenating interview-bank snippets. Offline/dev without a provider still gets a
  // Q109-preferring conceptual extract as the recovery path.
  if (isEamCentralDecentralTask(question)) {
    const conceptual = extractConceptualSpokenFromKnowledge(question, knowledgeText);
    const groundedCentral = /central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam|failover/i.test(
      String(conceptual || "")
    );
    if (groundedCentral) {
      return {
        served: false,
        continueToGeneration: true,
        route: "GENERATION",
        reason: "eam-central-decentral-continue-generation",
        answer: "",
        meta: {
          preparedReason: prepared.reason || null,
          conceptualGrounding: "q109-or-equivalent",
          offlineSpokenFallback: shapeSpokenSafe(conceptual)
        }
      };
    }
    if (conceptual) {
      return {
        served: true,
        route: "CONCEPTUAL_KNOWLEDGE",
        reason: "eam-central-decentral-from-supporting-knowledge",
        answer: shapeSpokenSafe(conceptual),
        meta: { conceptual: true, eamCentralDecentral: true }
      };
    }
    return {
      served: false,
      continueToGeneration: true,
      route: "GENERATION",
      reason: "eam-central-decentral-continue-generation",
      answer: "",
      meta: { preparedReason: prepared.reason || null }
    };
  }

  // Conceptual / definition / comparison: answer from retrieved knowledge when present.
  // Missing T-codes must not force the identifier-missing meta template.
  if (isConceptualQuestion(question)) {
    const conceptual = extractConceptualSpokenFromKnowledge(question, knowledgeText);
    if (conceptual) {
      return {
        served: true,
        route: "CONCEPTUAL_KNOWLEDGE",
        reason: "conceptual-from-supporting-knowledge",
        answer: shapeSpokenSafe(conceptual),
        meta: { conceptual: true }
      };
    }
  }

  // Thin RAG / no grounded safe route: do NOT serve a meta-refusal.
  // Signal the caller to continue into hybrid LLM generation.
  return {
    served: false,
    continueToGeneration: true,
    route: "GENERATION",
    reason: isConceptualQuestion(question)
      ? "conceptual-continue-generation"
      : "safe-mode-continue-generation",
    answer: "",
    meta: { preparedReason: prepared.reason || null }
  };
}

module.exports = {
  isSafeModeEnabled,
  resolveSafeModeAnswer,
  shapeSpokenSafe,
  isConceptualQuestion
};
