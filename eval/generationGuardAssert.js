const assert = require("assert");
const { classifyGenerationFailure, publicLlmError } = require("../lib/generationGuard");

assert.strictEqual(classifyGenerationFailure({ name: "AbortError" }).retryable, true);
assert.strictEqual(classifyGenerationFailure({ name: "AbortError" }).code, "timeout");
assert.strictEqual(classifyGenerationFailure({ httpStatus: 503 }).autoRetry, true);
assert.strictEqual(classifyGenerationFailure({ message: "insufficient_quota" }).autoRetry, false);
assert.strictEqual(classifyGenerationFailure({ message: "exceeded your current quota" }).retryable, false);
assert.doesNotMatch(classifyGenerationFailure({ message: "ECONNRESET socket" }).userMessage, /ECONNRESET|stack|at Object/);
assert.doesNotMatch(publicLlmError({ status: 500, message: "Internal at foo.js:12" }).userMessage, /foo\.js/);
assert.equal(publicLlmError({ name: "APIConnectionError", message: "Connection error." }).code, "transient");
assert.equal(publicLlmError({ name: "APIConnectionTimeoutError", message: "Request timed out" }).code, "timeout");
assert.strictEqual(classifyGenerationFailure({ message: "Failed to fetch" }).code, "transient");
assert.strictEqual(classifyGenerationFailure({ message: "empty generation" }).code, "empty");
assert.match(classifyGenerationFailure({ message: "empty generation" }).userMessage, /Retry/);
assert.strictEqual(classifyGenerationFailure({ httpStatus: 500, message: "Assignment to constant variable." }).code, "internal");
assert.match(classifyGenerationFailure({ httpStatus: 500, message: "Assignment to constant variable." }).userMessage, /internal error/i);

const fs = require("fs");
const path = require("path");
const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(chat, /let question = typeof requestedQuestion/);
assert.match(chat, /question: requestedQuestion/);
assert.match(interview, /speechSessionGuard/);
assert.match(interview, /safeCloseAudioConfig/);
assert.match(interview, /invokeSpeechCallback/);
assert.match(interview, /stopInFlightRef/);
assert.match(interview, /attachLiveSessionErrorShield/);
assert.match(interview, /Retry/);
assert.match(interview, /classifyGenerationFailure/);
assert.match(interview, /if \(isProcessingRef\.current\) return/);
assert.match(interview, /armGenerationTimeout/);
assert.match(interview, /current_streaming/);
assert.match(interview, /consumeChatStream/);
const { createSseParser } = require("../lib/chatStream");
const sseEvents = [];
const sseParser = createSseParser((event) => sseEvents.push(event));
const sseSample = 'data: {"text":"Hello"}\r\n\r\nevent: generation\r\ndata: {"finish_reason":"stop"}\r\n\r\ndata: [DONE]\r\n\r\n';
const crSplit = sseSample.indexOf("\r\n") + 1;
sseParser.push(sseSample.slice(0, crSplit), false);
sseParser.push(sseSample.slice(crSplit), true);
assert.ok(sseEvents.some((event) => event.name === "message" && event.data.includes("Hello")), "CRLF stream must yield the text event");
assert.ok(sseEvents.some((event) => event.name === "generation"), "CRLF stream must yield the generation event");
assert.match(interview, /streamedResponse\.trim\(\)/);
assert.match(chat, /Promise\.race/);
assert.match(chat, /removeEventListener\("abort"/);
assert.match(chat, /isTransientLlmError/);
assert.match(chat, /publicLlmError/);
assert.match(chat, /createOpenAiChatStream/);
assert.doesNotMatch(interview, /AI request failed: \$\{error\.message/);

// Meta-evaluation / rubric framing must be stripped before UI delivery.
{
  const {
    sanitizeSpokenAnswer,
    stripMetaEvaluationFraming
  } = require("../lib/generationGuard.js");
  const average = sanitizeSpokenAnswer(
    "An average answer describes Firefighter at a high level. When I configure emergency access I create the firefighter ID on the target and sync it into GRC."
  );
  assert.doesNotMatch(average, /An average answer/i);
  assert.match(average, /When I configure emergency access/i);

  const ten = sanitizeSpokenAnswer(
    "A 10/10 answer explains MSMP end to end. I open GRFNMW_CONFIGURE and walk Process Global Settings through Generate Version."
  );
  assert.doesNotMatch(ten, /10\s*\/\s*10\s+answer/i);
  assert.match(ten, /GRFNMW_CONFIGURE/i);

  const senior = stripMetaEvaluationFraming(
    "In a senior architect answer, one would cite IAS versus IPS. When I design federation I keep IAS on authentication and IPS on provisioning."
  );
  assert.doesNotMatch(senior, /In a senior architect answer/i);
  assert.match(senior, /When I design federation/i);

  const preamble = sanitizeSpokenAnswer(
    "Sure, I can explain that. Great question. I pull up /UI2/FLPCM_CUST to maintain the catalog."
  );
  assert.doesNotMatch(preamble, /Sure|Great question|I can explain that/i);
  assert.match(preamble, /\/UI2\/FLPCM_CUST/i);

  const scorePoints = sanitizeSpokenAnswer(
    "To score full points, list every T-code. My standard approach starts in NWBC for Access Request."
  );
  assert.doesNotMatch(scorePoints, /To score full points/i);
  assert.match(scorePoints, /My standard approach/i);

  // Answer Integrity Contract — planning / system-leak openers must never reach the UI.
  const {
    buildPrincipleLevelFallback,
    isMetaRefusalText
  } = require("../lib/generationGuard.js");
  const treatAs = sanitizeSpokenAnswer(
    "I treat this as a conceptual platform question and answer it directly. Risk is an SoD condition in ARA."
  );
  assert.doesNotMatch(treatAs, /I treat this as a conceptual/i);
  assert.match(treatAs, /Risk is an SoD condition/i);

  const framework = sanitizeSpokenAnswer(
    "I will answer using the following framework. In GRFNMW_CONFIGURE I walk the MSMP path."
  );
  assert.doesNotMatch(framework, /I will answer using the following framework/i);
  assert.match(framework, /GRFNMW_CONFIGURE/i);

  const expectedHeading = sanitizeSpokenAnswer(
    "Expected answer: Firefighter ID ownership sits with the controller. I validate FF log review cadence."
  );
  assert.doesNotMatch(expectedHeading, /Expected answer\s*:/i);
  assert.match(expectedHeading, /Firefighter ID ownership/i);

  const principleConfigure = buildPrincipleLevelFallback("How to configure BRF+?");
  assert.doesNotMatch(principleConfigure, /To approach this configuration/i);
  assert.doesNotMatch(principleConfigure, /I treat this as/i);
  assert.doesNotMatch(principleConfigure, /I outline the governing architecture/i);
  assert.match(principleConfigure, /reliable technical|verify|confirm the product/i);
  assert.strictEqual(isMetaRefusalText(principleConfigure), false);

  const principleConcept = buildPrincipleLevelFallback("What are the 5 pillars of BTP?");
  assert.doesNotMatch(principleConcept, /I treat this as a conceptual/i);
  assert.doesNotMatch(principleConcept, /I outline the governing architecture/i);
  assert.strictEqual(isMetaRefusalText(principleConcept), false);
  assert.strictEqual(
    isMetaRefusalText("I treat this as a conceptual platform question and answer it directly."),
    true
  );

  const araFallback = buildPrincipleLevelFallback(
    "What is the difference between Risk, Function, Action and Permission?"
  );
  assert.match(araFallback, /Risk/i);
  assert.match(araFallback, /Function/i);
  assert.match(araFallback, /Action/i);
  assert.match(araFallback, /Permission/i);
  assert.doesNotMatch(araFallback, /master role|derived role|I outline the governing/i);

  // Usage-history asks must not keep AGR_USERS / AGR_1251 as execution evidence.
  const {
    isTransactionUsageHistoryAsk,
    sanitizeUsageVsAssignmentPlanes,
    stripUngroundedSapEntities,
    isDestructiveEntityStripResult,
    findUngroundedTransactionClaims
  } = require("../lib/generationGuard.js");
  const usageQ = "How do you export all the T-codes used by a user?";
  assert.strictEqual(isTransactionUsageHistoryAsk(usageQ), true);
  const usageSan = sanitizeUsageVsAssignmentPlanes(
    usageQ,
    "I start in ST03N for workload by a user and period. Additionally I check AGR_USERS and AGR_1251 for the T-codes that user executed."
  );
  assert.strictEqual(usageSan.changed, true);
  assert.match(usageSan.text, /ST03N/i);
  assert.doesNotMatch(usageSan.text, /AGR_USERS|AGR_1251/i);
  const usageClarify = sanitizeUsageVsAssignmentPlanes(
    usageQ,
    "I use ST03N for workload. AGR_USERS is assignment data and is not execution history."
  );
  assert.strictEqual(usageClarify.removed, 0);
  assert.match(usageClarify.text, /AGR_USERS/i);

  // Cross-domain integrity: source-backed procedure must not hollow AGR tables when
  // grounding includes the procedure provenance (prefer-strip fix).
  const pfcgProc = "Use transaction PFCG to create the single role. Review table AGR_USERS for the user assignment and table AGR_1251 for authorization values, and do not treat AGR_USERS as a transaction. Use transaction SU53 only to read the last failed authorization check.";
  const thinGround = "Maintain the menu tab and generate the profile after SU24 review.";
  const hollowed = stripUngroundedSapEntities(pfcgProc, thinGround);
  assert.match(hollowed, /Review table for/i);
  assert.strictEqual(isDestructiveEntityStripResult(pfcgProc, hollowed), true);
  const preserved = stripUngroundedSapEntities(pfcgProc, [thinGround, pfcgProc].join("\n"));
  assert.match(preserved, /AGR_USERS/);
  assert.match(preserved, /AGR_1251/);
  assert.strictEqual(isDestructiveEntityStripResult(pfcgProc, preserved), false);

  // Unsupported invented code still rejected against thin knowledge.
  const invented = "Open transaction ZX99NINE to finish the role.";
  const strippedInvented = stripUngroundedSapEntities(invented, thinGround);
  assert.doesNotMatch(strippedInvented, /ZX99NINE/);

  // WELL_KNOWN admin T-codes are not false-ungrounded solely due to thin retrieval.
  assert.deepStrictEqual(
    findUngroundedTransactionClaims("I assign in transaction SU01 and validate with transaction SU53.", thinGround),
    []
  );
}

console.log("generationGuardAssert: PASS");
