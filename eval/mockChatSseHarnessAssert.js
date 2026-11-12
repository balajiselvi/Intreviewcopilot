/**
 * Deterministic mock-provider / SSE emission harness for V2.2.
 * Exercises the same finalization + write contract production chat.js uses.
 * No paid provider calls. Captures res.write / chunk payloads.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  finalizeSpokenAnswerForDisplay,
  evaluateSpokenAnswerIntegrity,
  buildDirectTechnicalFallback
} = require("../lib/answerIntegrityGate.js");
const { buildLocalKnowledgeFallback } = require("../lib/liveReliability.js");
const { sanitizeSpokenAnswer } = require("../lib/generationGuard.js");

const ROOT = path.join(__dirname, "..");
const chatSrc = fs.readFileSync(path.join(ROOT, "pages/api/chat.js"), "utf8");

function createCaptureRes() {
  const writes = [];
  const events = [];
  const chunks = [];
  return {
    writable: true,
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(body) { writes.push({ type: "json", body }); return this; },
    end() { writes.push({ type: "end" }); },
    write(payload) {
      const text = String(payload || "");
      writes.push({ type: "write", text });
      if (text.startsWith("event:")) {
        const name = text.match(/^event:\s*(\S+)/)?.[1];
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        let data = null;
        try { data = JSON.parse((dataLine || "").replace(/^data:\s*/, "")); } catch { data = dataLine; }
        events.push({ name, data });
      } else if (text.startsWith("data:")) {
        const raw = text.replace(/^data:\s*/, "").replace(/\n\n$/, "").trim();
        if (raw === "[DONE]") {
          events.push({ name: "done", data: null });
        } else {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.text) chunks.push(parsed.text);
          } catch {
            /* ignore */
          }
        }
      }
      return true;
    },
    writes,
    events,
    chunks,
    substantiveText() { return chunks.join(""); }
  };
}

/**
 * Mirrors production GENERATION buffered path:
 * buffer provider text → finalizeSpokenAnswerForDisplay → emit only accepted text.
 */
function emitBufferedGeneration(res, { question, providerText, recoveryAnswer = "" }) {
  // Provider tokens buffered — never written while generating.
  const buffered = String(providerText || "");
  const finalized = finalizeSpokenAnswerForDisplay({
    question,
    answer: buffered,
    recoveryAnswer: recoveryAnswer || buildDirectTechnicalFallback(question)
  });
  // Admission event (non-substantive).
  res.write(`event: admission\ndata: ${JSON.stringify({ decision: "ANSWER", route: "GENERATION" })}\n\n`);
  res.write(`event: answer_final\ndata: ${JSON.stringify({
    text: finalized.answer,
    answerKind: finalized.answerKind,
    recovered: Boolean(finalized.recovered),
    bufferedPreDisplay: true
  })}\n\n`);
  res.write(`data: ${JSON.stringify({ text: finalized.answer })}\n\n`);
  res.write("data: [DONE]\n\n");
  return finalized;
}

function emitLocalKnowledge(res, { question, knowledgeText, emitEarly = false }) {
  const built = buildLocalKnowledgeFallback(question, { prefetchedText: knowledgeText });
  if (emitEarly) {
    // Forbidden production path — used only as a negative control in this harness.
    res.write(`data: ${JSON.stringify({ text: built.answer })}\n\n`);
  }
  const finalized = finalizeSpokenAnswerForDisplay({ question, answer: built.answer });
  res.write(`event: answer_final\ndata: ${JSON.stringify({ text: finalized.answer, bufferedPreDisplay: true })}\n\n`);
  res.write(`data: ${JSON.stringify({ text: finalized.answer })}\n\n`);
  return finalized;
}

const Q_CA = "What are Critical Actions?";
const Q_ML = "Explain the Mitigation Lifecycle.";
const BAD_S4 = "Six stages. At Dover that was 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs.";
const BAD_CHECKLIST = "Run baseline risk analysis and triage results into remediation, mitigation, or acceptance. Treating mitigation as equivalent to remediation rather than a fallback.";
const BAD_PREPARED = "## Q22: Explain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring.\nValidate expiry, owner accountability.";

// --- Source contract: production chat must buffer local fallback and finalize ---
{
  assert.match(chatSrc, /emit:\s*false/);
  assert.match(chatSrc, /finalizeSpokenAnswerForDisplay/);
  assert.match(chatSrc, /streamLocalKnowledgeFallback\(res[\s\S]{0,500}emit:\s*false/);
  assert.match(chatSrc, /timelineFinal = finalizeSpokenAnswerForDisplay/);
}

// A — Rejected first answer: zero substantive chunks of the rejected text
{
  const res = createCaptureRes();
  const finalized = emitBufferedGeneration(res, { question: Q_CA, providerText: BAD_S4 });
  assert.equal(finalized.recovered || finalized.rejected, true);
  assert.doesNotMatch(res.substantiveText(), /1,?650|Six stages|Dover/);
  assert.match(res.substantiveText(), /Critical Action/i);
}

// B — Successful recovery
{
  const res = createCaptureRes();
  const good = buildDirectTechnicalFallback(Q_CA);
  const finalized = emitBufferedGeneration(res, {
    question: Q_CA,
    providerText: BAD_S4,
    recoveryAnswer: good
  });
  assert.equal(finalized.ok, true);
  assert.match(res.substantiveText(), /Critical Action/i);
  assert.doesNotMatch(res.substantiveText(), /1,?650/);
}

// C — Rejected recovery → inability (neither rejected draft appears)
{
  const res = createCaptureRes();
  const finalized = emitBufferedGeneration(res, {
    question: Q_CA,
    providerText: BAD_S4,
    recoveryAnswer: "Critical Actions are important activities."
  });
  // Shallow recovery fails; inability or a valid technical fallback from gate.
  assert.doesNotMatch(res.substantiveText(), /1,?650|Six stages/);
  assert.doesNotMatch(res.substantiveText(), /are important activities/i);
  assert.ok(res.substantiveText().length > 40);
  void finalized;
}

// D — Prepared / bank text rejected by integrity — only validated emit
{
  const res = createCaptureRes();
  const finalized = finalizeSpokenAnswerForDisplay({ question: Q_ML, answer: BAD_PREPARED });
  res.write(`data: ${JSON.stringify({ text: finalized.answer })}\n\n`);
  assert.doesNotMatch(res.substantiveText(), /Explain the architecture of Mitigating Controls/i);
  assert.doesNotMatch(res.substantiveText(), /Validate expiry/i);
}

// E — Local knowledge fallback validated before emission
{
  const res = createCaptureRes();
  emitLocalKnowledge(res, { question: Q_ML, knowledgeText: BAD_CHECKLIST, emitEarly: false });
  assert.doesNotMatch(res.substantiveText(), /Run baseline risk analysis and triage/);
  assert.doesNotMatch(res.substantiveText(), /Treating mitigation as equivalent/);
}

// F — Independent request buffers
{
  const resA = createCaptureRes();
  const resB = createCaptureRes();
  emitBufferedGeneration(resA, { question: Q_CA, providerText: BAD_S4 });
  emitBufferedGeneration(resB, {
    question: "What is the difference between Risk, Function, Action and Permission?",
    providerText: "In ECC we used master, derived and composite PFCG roles."
  });
  assert.match(resA.substantiveText(), /Critical Action/i);
  assert.match(resB.substantiveText(), /\bRisk\b/i);
  assert.match(resB.substantiveText(), /\bFunction\b/i);
  assert.doesNotMatch(resA.substantiveText(), /master role|derived role/i);
  assert.doesNotMatch(resB.substantiveText(), /master role|derived role|Public Edition/i);
  // Distinct buffers — ARA recovery is not the Critical Actions-only definition.
  assert.notEqual(resA.substantiveText(), resB.substantiveText());
}

// G — Clarification control path: sanitize only, no rejected technical draft
{
  const res = createCaptureRes();
  const clarify = sanitizeSpokenAnswer("Could you finish that question about GRC with the specific product context?");
  res.write(`event: admission\ndata: ${JSON.stringify({ decision: "ANSWER", route: "CLARIFY" })}\n\n`);
  res.write(`data: ${JSON.stringify({ text: clarify })}\n\n`);
  assert.match(res.substantiveText(), /finish that question/i);
  assert.doesNotMatch(res.substantiveText(), /1,?650|Run baseline/);
}

// H — Late response isolation (independent captures; UI uses request identity)
{
  const first = createCaptureRes();
  const second = createCaptureRes();
  // Newer request finishes first.
  emitBufferedGeneration(second, {
    question: Q_CA,
    providerText: buildDirectTechnicalFallback(Q_CA)
  });
  // Late older request completes with wrong text — must not be mixed into second capture.
  emitBufferedGeneration(first, { question: Q_ML, providerText: BAD_CHECKLIST });
  assert.match(second.substantiveText(), /Critical Action/i);
  assert.doesNotMatch(second.substantiveText(), /Run baseline risk analysis/);
  assert.doesNotMatch(first.substantiveText(), /Run baseline risk analysis/);
}

// Gate still rejects the historical repeated fragment
{
  const gate = evaluateSpokenAnswerIntegrity({ question: Q_ML, answer: BAD_CHECKLIST });
  assert.equal(gate.ok, false);
  assert.ok(gate.reasons.some((r) => /checklist|mitigation/i.test(r)));
}

console.log("mockChatSseHarnessAssert: PASS");
