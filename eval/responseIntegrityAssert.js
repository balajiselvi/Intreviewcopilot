/**
 * V2.2 Production Response Integrity — offline regression for historical failures.
 * Deterministic. No paid LLM calls. Exercises topic routing, integrity gate, meta ban,
 * profile-metric isolation, bank-heading strip, admission, and buffered pre-display contract.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  explicitProductTopic,
  isExplicitTopicChange,
  shouldInheritPriorContext,
  QUESTION_INTENTS
} = require("../lib/interviewContext.js");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope.js");
const {
  evaluateSpokenAnswerIntegrity,
  validateAndRecoverSpokenAnswer,
  finalizeSpokenAnswerForDisplay,
  buildDirectTechnicalFallback,
  isMetaProcedureResponse,
  detectQuestionContractFamily
} = require("../lib/answerIntegrityGate.js");
const {
  buildPrincipleLevelFallback,
  sanitizeSpokenAnswer,
  stripBankQuestionLabels
} = require("../lib/generationGuard.js");
const { evaluateAnswerConceptCoverage } = require("../lib/knowledgeCoverage.js");
const { scopeCareerEvidence } = require("./lib/careerTimeline.js");
const { recallExpectedAnswer } = require("./lib/expectedAnswers.js");
const { allowsCandidateExperienceInjection, isConceptualTechnicalQuestion } = require("../lib/experienceEligibility.js");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { analyzeInterviewQuestion } = require("../lib/interviewAnalyzer.js");

const ROOT = path.join(__dirname, "..");

const Q_ARA = "What is the difference between Risk, Function, Action and Permission?";
const Q_RULESET = "Explain the Rule Set Components?";
const Q_FF_LOGS = "What if Firefighter Logs are Not Generated?";
const Q_CRITICAL = "What are Critical Access Risks?";
const Q_CRITICAL_ACTIONS = "What are Critical Actions?";
const Q_MITIGATION_LIFECYCLE = "Explain the Mitigation Lifecycle.";
const Q_EXPERIENCE = "Tell me about your S/4HANA role transformation project.";

// --- Root-cause routing: GRC folders + families ---
{
  for (const q of [Q_ARA, Q_RULESET, Q_FF_LOGS, Q_CRITICAL, Q_CRITICAL_ACTIONS, Q_MITIGATION_LIFECYCLE]) {
    assert.equal(explicitProductTopic(q), "GRC", `topic for: ${q}`);
    assert.ok(productKnowledgeFolders(q).includes("grc"), `folders for: ${q}`);
  }
  assert.equal(detectQuestionContractFamily(Q_ARA), "ara-hierarchy");
  assert.equal(detectQuestionContractFamily(Q_RULESET), "grc-ruleset");
  assert.equal(detectQuestionContractFamily(Q_FF_LOGS), "eam-ff-logs");
  assert.equal(detectQuestionContractFamily(Q_CRITICAL), "critical-access-risks");
  assert.equal(detectQuestionContractFamily(Q_CRITICAL_ACTIONS), "critical-actions");
  assert.equal(detectQuestionContractFamily(Q_MITIGATION_LIFECYCLE), "mitigation-lifecycle");
}

// --- Classification: Critical Actions is definitional / conceptual ---
{
  assert.equal(isConceptualTechnicalQuestion(Q_CRITICAL_ACTIONS), true);
  assert.equal(isConceptualTechnicalQuestion(Q_MITIGATION_LIFECYCLE), true);
  assert.equal(allowsCandidateExperienceInjection(Q_CRITICAL_ACTIONS), false);
  assert.equal(allowsCandidateExperienceInjection(Q_MITIGATION_LIFECYCLE), false);
  assert.equal(allowsCandidateExperienceInjection(Q_EXPERIENCE), true);
  const analyzed = analyzeInterviewQuestion(Q_CRITICAL_ACTIONS);
  assert.ok(
    analyzed.category === "Definition" || /grc/i.test(String(analyzed.domain || "")),
    `Critical Actions classification: ${analyzed.category}/${analyzed.domain}`
  );
}

// --- Career scope: no full CV on conceptual asks ---
{
  const ca = scopeCareerEvidence(Q_CRITICAL_ACTIONS, "");
  assert.equal(ca.mode, "technical");
  assert.doesNotMatch(ca.text || "", /1,?650|Dover/);
  const ml = scopeCareerEvidence(Q_MITIGATION_LIFECYCLE, "");
  assert.equal(ml.mode, "technical");
  assert.doesNotMatch(ml.text || "", /1,?650|Dover Corporation/);
  const exp = scopeCareerEvidence(Q_EXPERIENCE, "");
  assert.ok(["programme", "domain", "full", "profile"].includes(exp.mode));
}

// --- Prepared-script isolation: ecc-to-s4 must not match Critical Actions ---
{
  assert.equal(recallExpectedAnswer(Q_CRITICAL_ACTIONS), null);
  assert.ok(recallExpectedAnswer("How would you approach an ECC to S/4 security transformation?")?.id === "ecc-to-s4"
    || recallExpectedAnswer("S/4HANA security transformation")?.id === "ecc-to-s4");
}

// --- Context isolation ---
{
  assert.equal(isExplicitTopicChange("Explain Greenfield versus Brownfield for S/4HANA.", "GRC"), true);
  assert.equal(
    shouldInheritPriorContext(
      "Explain Greenfield versus Brownfield for S/4HANA.",
      QUESTION_INTENTS.DIRECT_QUESTION,
      true,
      true,
      { questionTopic: "GRC" }
    ),
    false
  );
}

// --- Negative: ECC/S4 role-design cannot pass ARA hierarchy ---
{
  const eccAnswer = [
    "In ECC we used master, derived and composite PFCG roles.",
    "In S/4HANA Public Edition we move to business roles and catalogs."
  ].join(" ");
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_ARA, answer: eccAnswer });
  assert.equal(gate.ok, false);
  const recovered = validateAndRecoverSpokenAnswer({ question: Q_ARA, answer: eccAnswer });
  assert.equal(recovered.ok, true);
  assert.match(recovered.answer, /Risk/i);
  assert.doesNotMatch(recovered.answer, /master role|derived role|Public Edition business roles/i);
}

// --- Negative: Cloud IAG cannot contaminate on-prem ruleset ---
{
  const iagAnswer = "In SAP Cloud IAG the Business Function Group drives Access Analysis rules.";
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_RULESET, answer: iagAnswer });
  assert.equal(gate.ok, false);
  const recovered = validateAndRecoverSpokenAnswer({ question: Q_RULESET, answer: iagAnswer });
  assert.equal(recovered.ok, true);
  assert.doesNotMatch(recovered.answer, /\bCloud IAG\b|\bBusiness Function Group\b/i);
}

// --- Negative: meta procedure cannot pass FF logs or Critical Access ---
{
  const meta = "I outline the governing architecture and security model for the named platform first.";
  assert.equal(isMetaProcedureResponse(meta), true);
  for (const q of [Q_FF_LOGS, Q_CRITICAL]) {
    const recovered = validateAndRecoverSpokenAnswer({ question: q, answer: meta });
    assert.equal(recovered.ok, true, q);
    assert.doesNotMatch(recovered.answer, /I outline the governing architecture/i);
  }
}

// --- Negative: Critical Actions must reject S/4 six-stage / Dover metrics ---
{
  const sixStage = "Six stages. Assess current roles, users, SoD, critical access, and the process. At Dover that was 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs, and more than 2,400 conflicts cleared before cutover.";
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_CRITICAL_ACTIONS, answer: sixStage });
  assert.equal(gate.ok, false);
  assert.ok(gate.reasons.some((r) => /wrong-product|disallowed-project-metrics|conceptual-s4|critical-actions/i.test(r)));
  const recovered = finalizeSpokenAnswerForDisplay({ question: Q_CRITICAL_ACTIONS, answer: sixStage });
  assert.match(recovered.answer, /Critical Action/i);
  assert.doesNotMatch(recovered.answer, /1,?650|Six stages|Dover/);
}

// --- Negative: Mitigation Lifecycle must reject Q22 heading / Validate leak ---
{
  const leak = "Define control, owner, monitor, evidence, and expiry; assign at user, role, or request level as policy allows. Explain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring. Validate expiry, owner accountability, and that residual risk reporting matches what audit expects.";
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_MITIGATION_LIFECYCLE, answer: leak });
  assert.equal(gate.ok, false);
  const recovered = finalizeSpokenAnswerForDisplay({ question: Q_MITIGATION_LIFECYCLE, answer: leak });
  assert.doesNotMatch(recovered.answer, /Explain the architecture of Mitigating Controls/i);
  assert.match(recovered.answer, /mitigat/i);
}

// --- Bank label strip: Q22 heading and Validate removed from body ---
{
  const raw = [
    "## Q22: Explain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring.",
    "",
    "A mitigating control is a governed exception when the business cannot remove a conflict.",
    "",
    "Define control, owner, monitor, evidence, and expiry; assign at user, role, or request level as policy allows.",
    "",
    "Validate expiry, owner accountability, and that residual risk reporting matches what audit expects."
  ].join("\n");
  const stripped = stripBankQuestionLabels(raw);
  assert.doesNotMatch(stripped, /Explain the architecture of Mitigating Controls/i);
  assert.doesNotMatch(stripped, /^Validate expiry/m);
  assert.match(stripped, /mitigating control is a governed exception/i);
}

// --- Principle fallback source eliminated ---
{
  assert.doesNotMatch(buildPrincipleLevelFallback(Q_ARA), /I outline the governing architecture/i);
  assert.match(buildPrincipleLevelFallback(Q_ARA), /Risk/i);
}

// --- Positive concept coverage for ARA quartet ---
{
  const good = buildDirectTechnicalFallback(Q_ARA);
  const concepts = evaluateAnswerConceptCoverage({ question: Q_ARA, answer: good });
  assert.equal(concepts.ok, true, JSON.stringify(concepts));
}

// --- Firefighter admission: What if … Not Generated must ANSWER ---
{
  const turn = decideInterviewTurn({ question: Q_FF_LOGS, history: [], interviewMode: true });
  assert.equal(turn.decision, "ANSWER", `FF logs admission: ${turn.decision}/${turn.reason}`);
  assert.notEqual(turn.route, "NONE");
}

// --- Buffered pre-display + universal finalize contract present in chat.js ---
{
  const chat = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");
  assert.match(chat, /bufferBeforeDisplay/);
  assert.match(chat, /validateAndRecoverSpokenAnswer|finalizeSpokenAnswerForDisplay/);
  assert.match(chat, /finalizeSpokenAnswerForDisplay/);
  assert.match(chat, /bufferedPreDisplay:\s*true/);
  assert.match(chat, /streamOptions\.res = \{ writable: false \}/);
  assert.match(chat, /empty-product-folder-no-unscoped-search/);
  assert.match(chat, /emit:\s*false/);
  assert.match(chat, /timelineFinal = finalizeSpokenAnswerForDisplay/);
  // Ladder must not write before integrity.
  assert.doesNotMatch(
    chat,
    /generationRoute = ladder\.route[\s\S]{0,120}writeSSEAnswer\(res, recordedAnswer\)/
  );
}

// --- P0: repeated risk-analysis checklist fragment must not pass mitigation family ---
{
  const repeated = "Run baseline risk analysis and triage results into remediation, mitigation, or acceptance. Treating mitigation as equivalent to remediation rather than a fallback.";
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_MITIGATION_LIFECYCLE, answer: repeated });
  assert.equal(gate.ok, false);
  const recovered = finalizeSpokenAnswerForDisplay({ question: Q_MITIGATION_LIFECYCLE, answer: repeated });
  assert.doesNotMatch(recovered.answer, /Run baseline risk analysis and triage/);
  assert.doesNotMatch(recovered.answer, /Treating mitigation as equivalent/);
}

// --- P1: prior-turn Dover must not bleed into Critical Actions prompt scope ---
{
  const afterDover = scopeCareerEvidence(Q_CRITICAL_ACTIONS, "Tell me about the Dover S/4 transformation");
  assert.equal(afterDover.mode, "technical");
  assert.doesNotMatch(afterDover.text || "", /Dover|1,?650/);
}

// --- P4: shallow / wrong-concept Critical Actions must reject ---
{
  assert.equal(
    evaluateSpokenAnswerIntegrity({
      question: Q_CRITICAL_ACTIONS,
      answer: "Critical Actions are important activities in GRC."
    }).ok,
    false
  );
  assert.equal(
    evaluateSpokenAnswerIntegrity({
      question: Q_CRITICAL_ACTIONS,
      answer: "A Critical Action is when the firefighter controller misses the SLA for log review."
    }).ok,
    false
  );
  const good = buildDirectTechnicalFallback(Q_CRITICAL_ACTIONS);
  assert.equal(evaluateSpokenAnswerIntegrity({ question: Q_CRITICAL_ACTIONS, answer: good }).ok, true);
}

console.log("responseIntegrityAssert: PASS");
