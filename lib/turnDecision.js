const { admitQuestion, priorAnchor, DECISIONS } = require("./questionAdmission.js");
const { resolvePreparedScript } = require("./scriptMatch.js");
const { scopeCareerEvidence } = require("../eval/lib/careerTimeline.js");

function decideInterviewTurn({ question = "", history = [], priorQuestion = "" } = {}) {
  const prior = priorQuestion || priorAnchor(history);
  const admission = admitQuestion(question, { priorQuestion: prior });
  if (admission.decision !== DECISIONS.ANSWER) {
    return {
      decision: admission.decision,
      route: "NONE",
      reason: admission.reason,
      scriptId: null,
      confidence: 0,
      evidenceMode: null,
      programmeId: null,
      scriptAnswer: "",
      features: admission.features
    };
  }
  let script = null;
  try {
    script = resolvePreparedScript(question);
  } catch (error) {
    script = null;
  }
  let evidence = { mode: "full", programmeId: null, text: "" };
  try {
    evidence = scopeCareerEvidence(question, prior);
  } catch (error) {
    evidence = { mode: "full", programmeId: null, text: "" };
  }
  if (script?.authoritative) {
    return {
      decision: DECISIONS.ANSWER,
      route: "PREPARED_SCRIPT",
      reason: admission.reason,
      scriptId: script.id,
      confidence: script.confidence,
      via: script.via,
      evidenceMode: evidence.mode,
      programmeId: evidence.programmeId,
      scriptAnswer: script.answer,
      features: admission.features
    };
  }
  return {
    decision: DECISIONS.ANSWER,
    route: "GENERATION",
    reason: admission.reason,
    scriptId: null,
    confidence: 0,
    evidenceMode: evidence.mode,
    programmeId: evidence.programmeId,
    scriptAnswer: "",
    evidenceText: evidence.text,
    features: admission.features
  };
}

module.exports = { decideInterviewTurn };
