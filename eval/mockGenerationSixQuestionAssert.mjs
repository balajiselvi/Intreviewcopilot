/**
 * Six-question mock-GENERATION sequence against a live Next server
 * started with LLM_PROVIDER_MODE=mock and INTERVIEW_SAFE_MODE=0.
 *
 *   node eval/mockGenerationSixQuestionAssert.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:3103
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "mock-generation-six-questions.json");
const BASE = process.argv[2] || process.env.MOCK_BASE_URL || "http://127.0.0.1:3103";

const QUESTIONS = [
  {
    id: "critical-actions",
    q: "What are Critical Actions?",
    expect: /Critical Action/i,
    forbid: [/1,?650/, /Six stages/, /\bDover\b/]
  },
  {
    id: "mitigation-lifecycle",
    q: "Explain the Mitigation Lifecycle.",
    expect: /mitigat/i,
    forbid: [/1,?650/, /checklist of six/i]
  },
  {
    id: "ruleset-components",
    q: "What are the GRC Rule Set Components?",
    expect: /rule\s*set|function|risk|permission|action/i,
    forbid: [/1,?650/]
  },
  {
    id: "ff-logs",
    q: "What if Firefighter Logs are Not Generated?",
    expect: /Firefighter|EAM|log|sync|controller/i,
    forbid: [/1,?650/, /Six stages/]
  },
  {
    id: "what-if-defer",
    q: "What if",
    expectDefer: true
  },
  {
    id: "s4-experience",
    q: "Tell me about your S/4HANA transformation experience.",
    expect: /S\/?4|role|Fiori|Dover|would/i,
    // ST03N may appear as methodology; forbid invented % reduction as personal fact
    forbid: [/reduced roles by \d+%/i, /I ran ST03N for \d+ (?:days|weeks)/i]
  }
];

function parseSse(text) {
  const events = [];
  const chunks = [];
  for (const block of String(text || "").split("\n\n")) {
    const lines = block.split("\n");
    let name = "message";
    let dataRaw = "";
    for (const line of lines) {
      if (line.startsWith("event:")) name = line.slice(6).trim();
      if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
    }
    if (!dataRaw || dataRaw === "[DONE]") continue;
    let data = dataRaw;
    try { data = JSON.parse(dataRaw); } catch { /* keep */ }
    events.push({ name, data });
    if (data?.text) chunks.push(String(data.text));
  }
  return { events, substantive: chunks.join("") };
}

async function ask(question) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      model: "gpt-4o-mini",
      apiKey: "sk-browser-mock-unused",
      safeMode: false,
      history: [],
      source: "mock-six-question"
    })
  });
  const raw = await res.text();
  const parsed = parseSse(raw);
  const admission = parsed.events.find((e) => e.name === "admission")?.data || null;
  const generation = parsed.events.find((e) => e.name === "generation")?.data || null;
  return {
    status: res.status,
    admission,
    generation,
    substantive: parsed.substantive,
    events: parsed.events.map((e) => e.name)
  };
}

const report = {
  at: new Date().toISOString(),
  base: BASE,
  pass: true,
  cases: []
};

// Health
try {
  const health = await fetch(`${BASE}/interview`);
  report.healthStatus = health.status;
} catch (err) {
  report.healthError = String(err?.message || err);
  report.pass = false;
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.error("FAIL server unreachable", report.healthError);
  process.exit(1);
}

for (const spec of QUESTIONS) {
  const out = await ask(spec.q);
  let ok = out.status === 200;
  let note = "";
  if (spec.expectDefer) {
    const deferred = /DEFER|WAIT|incomplete|clarify|need (?:a )?full(?:er)? question/i.test(
      `${out.substantive} ${JSON.stringify(out.admission)}`
    ) || out.admission?.decision === "DEFER" || out.admission?.route === "DEFER";
    ok = deferred && !/Critical Action|Firefighter Logs are Not/i.test(out.substantive);
    note = deferred ? "deferred" : "unexpected answer";
  } else {
    if (spec.expect && !spec.expect.test(out.substantive)) {
      ok = false;
      note = "expect miss";
    }
    for (const re of spec.forbid || []) {
      if (re.test(out.substantive)) {
        ok = false;
        note = `forbid hit ${re}`;
      }
    }
  }
  const row = {
    id: spec.id,
    ok,
    note,
    status: out.status,
    route: out.admission?.route || out.generation?.route || null,
    providerMode: out.generation?.providerMode || out.admission?.providerMode || null,
    model: out.generation?.model || null,
    preview: String(out.substantive || "").slice(0, 220),
    events: out.events
  };
  report.cases.push(row);
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} ${spec.id} route=${row.route} model=${row.model}`);
}

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`mockGenerationSixQuestion: ${report.pass ? "PASS" : "FAIL"} → ${OUT}`);
assert.equal(report.pass, true);
