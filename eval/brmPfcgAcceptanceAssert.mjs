/**
 * Final acceptance: BRM why + PFCG usage without exact Q&A matches / new families.
 * MOCK only — no paid live.
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/brmPfcgAcceptanceAssert.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "brm-pfcg-acceptance.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } = await import("./harness/mockOpenai.mjs");
const { getProviderStats, resetProviderStats } = require("../lib/providerMode.js");
const { default: handler } = await import("../pages/api/chat.js");

process.env.LLM_PROVIDER_MODE = "mock";
process.env.INTERVIEW_SAFE_MODE = "0";

function createCaptureRes() {
  const events = [];
  const dataChunks = [];
  const res = {
    writable: true,
    writableEnded: false,
    statusCode: 200,
    headersSent: false,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; this.headersSent = true; },
    status(code) { this.statusCode = code; return this; },
    json(body) { events.push({ name: "json", data: body }); return this; },
    end() { this.writableEnded = true; },
    once() {},
    on() {},
    write(payload) {
      const text = String(payload || "");
      if (text.startsWith("event:")) {
        const name = text.match(/^event:\s*(\S+)/)?.[1] || "";
        const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
        let data = null;
        try { data = JSON.parse((dataLine || "").replace(/^data:\s*/, "")); } catch { data = dataLine; }
        events.push({ name, data });
      } else if (text.startsWith("data:")) {
        const raw = text.replace(/^data:\s*/, "").replace(/\n\n$/, "").trim();
        if (raw !== "[DONE]") {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.text) dataChunks.push(String(parsed.text));
            events.push({ name: "data", data: parsed });
          } catch { /* ignore */ }
        }
      }
      return true;
    },
    events,
    dataChunks,
    substantive() { return dataChunks.join(""); }
  };
  return res;
}

async function ask(question) {
  resetProviderStats("mock");
  resetMockOpenai();
  enqueueMockCompletion("LIVE_BAIT");
  const res = createCaptureRes();
  await handler({
    method: "POST",
    body: {
      model: "gpt-4o-mini",
      apiKey: "sk-unused",
      safeMode: false,
      question,
      history: [],
      source: "brm-pfcg-acceptance"
    }
  }, res);
  return {
    substantive: res.substantive(),
    admission: res.events.find((e) => e.name === "admission")?.data || null,
    answerFinal: res.events.find((e) => e.name === "answer_final")?.data || null,
    stats: getProviderStats(),
    openaiCalls: getMockOpenaiCalls().length,
    events: res.events.map((e) => e.name)
  };
}

const report = { at: new Date().toISOString(), pass: true, cases: [] };

{
  const out = await ask("Why do organizations implement BRM?");
  const ok = out.stats.liveTransportInvocations === 0
    && out.openaiCalls === 0
    && /Business Role|business-role|business role/i.test(out.substantive)
    && /(?:technical role|PFCG|ARM|mapping)/i.test(out.substantive)
    && !/I do not have a reliable technical answer/i.test(out.substantive)
    && !/LIVE_BAIT|1,?650|Six stages/i.test(out.substantive)
    && !/\bBRF\+/i.test(out.substantive);
  report.cases.push({
    id: "brm-why",
    ok,
    route: out.admission?.route,
    preview: out.substantive.slice(0, 320)
  });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} brm-why route=${out.admission?.route}`);
}

{
  const out = await ask("Explain how do you use PFCG?");
  const soup = (out.substantive.match(/\b(?:USOBT_C|USOBX_C|SU25|AGR_DEFINE|PFCG_TIME_DEPENDENCY)\b/g) || []).length;
  const focused = /\bPFCG\b/i.test(out.substantive)
    && /(?:Menu tab|menu tab|authorization|Generate|profile)/i.test(out.substantive)
    && !/LIVE_BAIT/i.test(out.substantive)
    && !/I do not have a reliable technical answer/i.test(out.substantive)
    // Specialty SU24/derived soup without being asked must not dominate
    && !(soup >= 3 && !/Menu tab|Generate the authorization profile/i.test(out.substantive));
  const ok = out.stats.liveTransportInvocations === 0 && out.openaiCalls === 0 && focused
    && out.substantive.length > 80;
  report.cases.push({
    id: "pfcg-usage",
    ok,
    route: out.admission?.route,
    soup,
    preview: out.substantive.slice(0, 320)
  });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} pfcg-usage route=${out.admission?.route} soup=${soup}`);
}

// Multi-domain smoke (universal architecture — no SAP-only refusal)
const universalCases = [
  {
    id: "cross-domain-iam-concepts",
    q: "What is the difference between authentication and authorization in IAM?",
    ok: (out) => out.substantive.length > 40
      && !/I do not have a reliable technical answer/i.test(out.substantive)
  },
  {
    id: "zero-kb-outside-inventory",
    q: "What is ZZX99_FAKE in Quantum Ledger Controllers?",
    ok: (out) => out.stats.mockInvocations >= 1
      && /would not invent|not have verified product documentation/i.test(out.substantive)
      && !/LIVE_BAIT/i.test(out.substantive)
  },
  {
    id: "experience-s4-methodology",
    q: "Tell me about your S/4HANA transformation experience.",
    ok: (out) => /S\/?4|role|Fiori|Dover|would/i.test(out.substantive)
      && !/Maintain two checklists where needed/i.test(out.substantive)
      && !/reduced roles by \d+%/i.test(out.substantive)
  },
  {
    id: "no-exact-bank-pfcg-paraphrase",
    q: "How do you typically work in PFCG day to day?",
    ok: (out) => /\bPFCG\b/i.test(out.substantive)
      && /(?:menu|authorization|profile|generate|role)/i.test(out.substantive)
      && !/I do not have a reliable technical answer/i.test(out.substantive)
  }
];

for (const spec of universalCases) {
  const out = await ask(spec.q);
  const ok = out.stats.liveTransportInvocations === 0 && spec.ok(out);
  report.cases.push({
    id: spec.id,
    ok,
    route: out.admission?.route,
    preview: out.substantive.slice(0, 220)
  });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} ${spec.id} route=${out.admission?.route}`);
}

delete process.env.LLM_PROVIDER_MODE;
delete process.env.INTERVIEW_SAFE_MODE;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`brmPfcgAcceptance: ${report.pass ? "PASS" : "FAIL"} → ${OUT}`);
assert.equal(report.pass, true);
