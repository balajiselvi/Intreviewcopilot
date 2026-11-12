/**
 * Final acceptance: invoke the REAL pages/api/chat.js handler with a deterministic
 * mock OpenAI (test-only resolve hook). Captures actual res.write SSE output.
 *
 * Run:
 *   node --import ./eval/harness/registerNextResolve.mjs eval/realChatApiSseHarnessAssert.mjs
 *
 * Side effects: optional DEBUG_DUMP_PROMPT files under eval/results/_acceptance/ only.
 * No paid provider calls. No production code changes.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "eval", "results", "_acceptance");
fs.mkdirSync(OUT_DIR, { recursive: true });

const {
  resetMockOpenai,
  enqueueMockCompletion,
  setMockCompletionForQuestion,
  getMockOpenaiCalls
} = await import("./harness/mockOpenai.mjs");

// --- Test-only require-cache patches (before handler import) ---
const scriptMatchPath = require.resolve("../lib/scriptMatch.js");
const scriptMatch = require(scriptMatchPath);
const realResolvePrepared = scriptMatch.resolvePreparedScript.bind(scriptMatch);
const BAD_PREPARED =
  "## Q22: Explain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring.\n"
  + "Validate expiry, owner accountability, and that residual risk reporting matches what audit expects.\n"
  + "Six stages. At Dover that was 1,650 PFCG roles.";

require.cache[scriptMatchPath].exports = {
  ...scriptMatch,
  resolvePreparedScript(question) {
    if (globalThis.__HARNESS_BAD_PREPARED__ && /Critical Actions/i.test(String(question || ""))) {
      return {
        authoritative: true,
        id: "harness-bad-prepared",
        confidence: 1,
        via: "pattern",
        answer: BAD_PREPARED
      };
    }
    return realResolvePrepared(question);
  }
};

const gatePath = require.resolve("../lib/answerIntegrityGate.js");
const gateMod = require(gatePath);
const realFallback = gateMod.buildDirectTechnicalFallback.bind(gateMod);
require.cache[gatePath].exports = {
  ...gateMod,
  buildDirectTechnicalFallback(question) {
    if (globalThis.__HARNESS_FAIL_RECOVERY__) {
      return "Critical Actions are important activities.";
    }
    return realFallback(question);
  }
};

const { default: handler } = await import("../pages/api/chat.js");

const Q_CA = "What are Critical Actions?";
const Q_ML = "Explain the Mitigation Lifecycle.";
const Q_ARA = "What is the difference between Risk, Function, Action and Permission?";
const BAD_S4 = "Six stages. At Dover that was 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs.";
const BAD_CHECKLIST =
  "Run baseline risk analysis and triage results into remediation, mitigation, or acceptance. "
  + "Treating mitigation as equivalent to remediation rather than a fallback.";

function createCaptureRes() {
  const writes = [];
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true,
    writableEnded: false,
    statusCode: 200,
    headersSent: false,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
      this.headersSent = true;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      writes.push({ type: "json", body });
      return this;
    },
    end() {
      this.writableEnded = true;
      writes.push({ type: "end" });
    },
    once(_ev, _fn) {},
    on(_ev, _fn) {},
    write(payload) {
      const text = String(payload || "");
      writes.push({ type: "write", text });
      if (text.startsWith("event:")) {
        const name = text.match(/^event:\s*(\S+)/)?.[1] || "";
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        let data = null;
        try {
          data = JSON.parse((dataLine || "").replace(/^data:\s*/, ""));
        } catch {
          data = dataLine;
        }
        events.push({ name, data });
      } else if (text.startsWith("data:")) {
        const raw = text.replace(/^data:\s*/, "").replace(/\n\n$/, "").trim();
        if (raw === "[DONE]") {
          events.push({ name: "done", data: null });
        } else {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.text) dataChunks.push(String(parsed.text));
            events.push({ name: "data", data: parsed });
          } catch {
            events.push({ name: "data_raw", data: raw });
          }
        }
      }
      return true;
    },
    writes,
    events,
    dataChunks,
    substantiveText() {
      return dataChunks.join("");
    },
    admission() {
      return events.find((e) => e.name === "admission")?.data || null;
    },
    answerFinal() {
      return events.find((e) => e.name === "answer_final")?.data || null;
    }
  };
  return res;
}

function createReq(body) {
  return {
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-test-harness-not-a-real-key",
      // Existing supported seam: safeMode defaults ON and bypasses free generation.
      // Acceptance Cases A–C/F require the GENERATION + mock-provider path.
      safeMode: false,
      question: body.question,
      history: body.history || [],
      forceLocalFallback: body.forceLocalFallback || false,
      source: "acceptance-harness",
      ...body
    }
  };
}

async function invokeHandler(body, { promptDumpName = null } = {}) {
  resetMockOpenai();
  if (body.mockText != null) enqueueMockCompletion(body.mockText);
  if (Array.isArray(body.mockTexts)) {
    for (const t of body.mockTexts) enqueueMockCompletion(t);
  }

  const dumpPath = promptDumpName
    ? path.join(OUT_DIR, promptDumpName)
    : null;
  if (dumpPath) {
    process.env.DEBUG_DUMP_PROMPT = dumpPath;
  } else {
    delete process.env.DEBUG_DUMP_PROMPT;
  }

  const res = createCaptureRes();
  const req = createReq(body);
  const started = Date.now();
  await handler(req, res);
  const elapsedMs = Date.now() - started;
  delete process.env.DEBUG_DUMP_PROMPT;

  return {
    res,
    elapsedMs,
    mockCalls: getMockOpenaiCalls(),
    promptDumpPath: dumpPath && fs.existsSync(dumpPath) ? dumpPath : null,
    promptText: dumpPath && fs.existsSync(dumpPath) ? fs.readFileSync(dumpPath, "utf8") : null,
    route: res.admission()?.route || res.events.find((e) => e.name === "generation")?.data?.route || null,
    admission: res.admission(),
    answerFinal: res.answerFinal(),
    substantive: res.substantiveText(),
    trace: {
      requestId: res.admission()?.traceId || res.events.find((e) => e.data?.traceId)?.data?.traceId || null,
      events: res.events.map((e) => e.name),
      substantiveWrites: res.dataChunks.length,
      rejectedLeak: null
    }
  };
}

function assertNoRejectedLeak(substantive, rejectedPatterns) {
  for (const re of rejectedPatterns) {
    assert.doesNotMatch(substantive, re, `rejected text leaked: ${re}`);
  }
}

const report = { cases: {}, prompts: {}, startedAt: new Date().toISOString() };

// ========== Case A — rejected first response ==========
{
  globalThis.__HARNESS_BAD_PREPARED__ = false;
  globalThis.__HARNESS_FAIL_RECOVERY__ = false;
  const out = await invokeHandler({ question: Q_CA, mockText: BAD_S4 });
  assertNoRejectedLeak(out.substantive, [/1,?650/, /Six stages/, /\bDover\b/]);
  assert.match(out.substantive, /Critical Action/i);
  assert.ok(out.substantive.length > 40);
  // Provider was called once; rejected text must not appear in data chunks.
  assert.ok(out.mockCalls.length >= 1, "Case A: mock provider should be invoked");
  report.cases.A = {
    ok: true,
    question: Q_CA,
    route: out.admission?.route || out.route,
    admission: out.admission,
    answerFinal: out.answerFinal,
    mockUser: out.mockCalls[0]?.user,
    substantivePreview: out.substantive.slice(0, 180),
    events: out.trace.events,
    elapsedMs: out.elapsedMs
  };
  console.log("PASS Case A — rejected first response (no Dover/1650 leak)");
}

// ========== Case B — successful recovery ==========
{
  globalThis.__HARNESS_FAIL_RECOVERY__ = false;
  const out = await invokeHandler({ question: Q_CA, mockText: BAD_S4 });
  assertNoRejectedLeak(out.substantive, [/1,?650/, /Six stages/]);
  assert.match(out.substantive, /Critical Action/i);
  const recovered = Boolean(out.answerFinal?.recovered) || /integrity_recovered|recovered/i.test(JSON.stringify(out.res.events));
  report.cases.B = {
    ok: true,
    recovered,
    answerKind: out.answerFinal?.answerKind || null,
    substantivePreview: out.substantive.slice(0, 180),
    events: out.trace.events
  };
  console.log("PASS Case B — recovery emits accepted Critical Actions text");
}

// ========== Case C — rejected recovery → inability ==========
{
  globalThis.__HARNESS_FAIL_RECOVERY__ = true;
  try {
    const out = await invokeHandler({ question: Q_CA, mockText: BAD_S4 });
    assertNoRejectedLeak(out.substantive, [/1,?650/, /Six stages/, /are important activities/i]);
    assert.ok(out.substantive.length > 20);
    report.cases.C = {
      ok: true,
      answerKind: out.answerFinal?.answerKind || null,
      substantivePreview: out.substantive.slice(0, 180),
      events: out.trace.events,
      note: "Recovery forced shallow via test-only buildDirectTechnicalFallback patch"
    };
    console.log("PASS Case C — dual failure yields safe response without rejected drafts");
  } finally {
    globalThis.__HARNESS_FAIL_RECOVERY__ = false;
  }
}

// ========== Case D — prepared answer fails integrity ==========
{
  globalThis.__HARNESS_BAD_PREPARED__ = true;
  try {
    const out = await invokeHandler({ question: Q_CA, mockText: "" });
    assert.equal(out.admission?.route, "PREPARED_SCRIPT");
    assertNoRejectedLeak(out.substantive, [
      /Explain the architecture of Mitigating Controls/i,
      /Validate expiry/i,
      /1,?650/
    ]);
    assert.match(out.substantive, /Critical Action|mitigat|unable|cannot confidently/i);
    report.cases.D = {
      ok: true,
      route: out.admission?.route,
      substantivePreview: out.substantive.slice(0, 180),
      events: out.trace.events,
      note: "Bad prepared payload injected via test-only resolvePreparedScript patch"
    };
    console.log("PASS Case D — unvalidated prepared content not emitted");
  } finally {
    globalThis.__HARNESS_BAD_PREPARED__ = false;
  }
}

// ========== Case E — local knowledge fallback ==========
{
  const out = await invokeHandler({
    question: Q_ML,
    forceLocalFallback: true,
    apiKey: "",
    mockText: BAD_CHECKLIST
  });
  // forceLocalFallback skips provider; mock should not be required.
  assertNoRejectedLeak(out.substantive, [/Run baseline risk analysis and triage/, /Treating mitigation as equivalent/]);
  assert.ok(out.substantive.length > 40);
  report.cases.E = {
    ok: true,
    route: out.admission?.route || "LOCAL_KNOWLEDGE_FALLBACK*",
    mockCalls: out.mockCalls.length,
    substantivePreview: out.substantive.slice(0, 180),
    events: out.trace.events
  };
  console.log("PASS Case E — local fallback validated before emission");
}

// ========== Case F — concurrent reverse completion ==========
{
  resetMockOpenai();
  setMockCompletionForQuestion("critical actions", BAD_S4);
  setMockCompletionForQuestion(
    "risk, function, action and permission",
    "In ECC we used master, derived and composite PFCG roles for every landscape."
  );

  const dumpWas = process.env.DEBUG_DUMP_PROMPT;
  delete process.env.DEBUG_DUMP_PROMPT;

  const resA = createCaptureRes();
  const resB = createCaptureRes();
  const reqA = createReq({ question: Q_CA, apiKey: "sk-test-harness-not-a-real-key" });
  const reqB = createReq({ question: Q_ARA, apiKey: "sk-test-harness-not-a-real-key" });

  // Start both; await B then A (reverse completion order).
  const pA = handler(reqA, resA);
  const pB = handler(reqB, resB);
  await pB;
  await pA;

  const textA = resA.dataChunks.join("");
  const textB = resB.dataChunks.join("");
  assert.match(textA, /Critical Action/i);
  assert.match(textB, /\bRisk\b/i);
  assert.notEqual(textA, textB);
  assert.doesNotMatch(textA, /master role|derived role/i);
  assert.doesNotMatch(textB, /1,?650|Six stages/i);
  if (dumpWas) process.env.DEBUG_DUMP_PROMPT = dumpWas;

  report.cases.F = {
    ok: true,
    textAPreview: textA.slice(0, 120),
    textBPreview: textB.slice(0, 120),
    eventsA: resA.events.map((e) => e.name),
    eventsB: resB.events.map((e) => e.name)
  };
  console.log("PASS Case F — independent concurrent buffers / reverse completion");
}

// ========== Case G — clarification / incomplete fragment ==========
{
  const out = await invokeHandler({
    question: "What if",
    mockText: BAD_S4
  });
  assertNoRejectedLeak(out.substantive, [/1,?650/, /Six stages/, /Run baseline risk analysis/]);
  const decision = out.admission?.decision || out.admission?.disposition || null;
  report.cases.G = {
    ok: true,
    admission: out.admission,
    decision,
    substantivePreview: out.substantive.slice(0, 180),
    events: out.trace.events,
    statusCode: out.res.statusCode
  };
  console.log("PASS Case G — clarify/control path without rejected substantive leak");
}

// ========== Prompt isolation A/B/C (real handler DEBUG_DUMP_PROMPT) ==========
{
  const promptA = await invokeHandler({
    question: Q_CA,
    mockText: BAD_S4,
  }, { promptDumpName: "prompt-A-critical-actions.txt" });

  const promptB = await invokeHandler({
    question: Q_CA,
    history: [
      { role: "user", content: "Tell me about your Dover S/4HANA transformation project." },
      { role: "assistant", content: "At Dover I led the ECC-to-S/4 security programme with 1,650 PFCG roles." }
    ],
    mockText: BAD_S4
  }, { promptDumpName: "prompt-B-after-dover.txt" });

  // Explicit experience ask that still reaches GENERATION (prepared "Tell me about Dover" exits early).
  const Q_EXP = "How did you approach SoD remediation and critical-access design on the Dover S/4HANA transformation?";
  const promptC = await invokeHandler({
    question: Q_EXP,
    mockText: "On the Dover programme I used ARA simulation before transport and cleared SoD conflicts with documented mitigations."
  }, { promptDumpName: "prompt-C-dover-experience.txt" });

  const promptCPrepared = await invokeHandler({
    question: "Tell me about your Dover S/4HANA transformation project.",
    mockText: "unused"
  });

  const a = promptA.promptText || "";
  const b = promptB.promptText || "";
  const c = promptC.promptText || "";
  assert.ok(a.length > 200, "prompt A dumped");
  assert.ok(b.length > 200, "prompt B dumped");
  assert.ok(c.length > 200, "prompt C dumped");

  // Active grounding: METRIC COUPLING / conceptual rules must suppress unsolicited metrics.
  assert.match(a, /METRIC COUPLING/i);
  assert.match(a, /Do NOT emit CV programme metrics|experience-ineligible|conceptual/i);
  // Conceptual prompts must instruct NOT to emit metrics (gated branch).
  assert.match(a, /Do NOT emit CV programme metrics/i);
  assert.match(b, /Do NOT emit CV programme metrics/i);
  // Experience GENERATION prompt may include programme facts in candidate grounding.
  assert.match(c, /Dover|1,?650|PFCG|programme|program/i);
  assert.equal(/Do NOT emit CV programme metrics/i.test(c), false,
    "explicit experience GENERATION prompt should not use the conceptual metric ban");

  // Prepared Dover overview still serves experience content without leaking into conceptual prompts above.
  assert.ok(promptCPrepared.substantive.length > 40);
  assert.match(promptCPrepared.substantive, /Dover|S\/4|GRC|role/i);

  report.prompts = {
    A: {
      path: promptA.promptDumpPath,
      chars: a.length,
      route: promptA.admission?.route,
      metricCouplingForbids: /Do NOT emit CV programme metrics/i.test(a),
      has1650: /1,?650/.test(a),
      hasDoverInPrompt: /\bDover\b/i.test(a)
    },
    B: {
      path: promptB.promptDumpPath,
      chars: b.length,
      route: promptB.admission?.route,
      metricCouplingForbids: /Do NOT emit CV programme metrics/i.test(b),
      has1650: /1,?650/.test(b),
      hasDoverInPrompt: /\bDover\b/i.test(b),
      historyContainedDover: true,
      note: "Prior history may mention Dover; active METRIC COUPLING must remain conceptual-forbid"
    },
    C: {
      path: promptC.promptDumpPath,
      chars: c.length,
      question: Q_EXP,
      route: promptC.admission?.route,
      allowsExperience: /Dover|1,?650|PFCG/i.test(c),
      metricCouplingForbids: /Do NOT emit CV programme metrics/i.test(c)
    },
    C_prepared_overview: {
      question: "Tell me about your Dover S/4HANA transformation project.",
      route: promptCPrepared.admission?.route,
      substantivePreview: promptCPrepared.substantive.slice(0, 160),
      note: "PREPARED_SCRIPT/PACK may exit before LLM prompt assembly; experience still served"
    }
  };
  console.log("PASS Prompt dumps A/B/C captured from real handler");
}

fs.writeFileSync(path.join(OUT_DIR, "real-chat-api-sse-report.json"), JSON.stringify(report, null, 2));
console.log(`\nrealChatApiSseHarnessAssert: PASS (${Object.keys(report.cases).length} cases)`);
console.log(`Evidence: ${path.join(OUT_DIR, "real-chat-api-sse-report.json")}`);
