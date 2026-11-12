/**
 * Master Prompt — Sr. Principal Architect structural / persona acceptance (MOCK only).
 *
 *   node --import ./eval/harness/registerNextResolve.mjs eval/masterPromptArchitectAssert.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "eval", "results", "_acceptance", "master-prompt-architect.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } = await import("./harness/mockOpenai.mjs");
const { getProviderStats, resetProviderStats } = require("../lib/providerMode.js");
const {
  buildSeniorArchitectResponseProfile,
  isSeniorArchitectTechnicalDomain
} = require("../lib/prompt/interviewPrompt.js");
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
      source: "master-prompt-architect"
    }
  }, res);
  return {
    substantive: res.substantive(),
    admission: res.events.find((e) => e.name === "admission")?.data || null,
    stats: getProviderStats(),
    openaiCalls: getMockOpenaiCalls().length
  };
}

const noHeadings = (t) => !/\b(?:Decision|Mechanism|Governance|Validation)\s*:/i.test(t);
const noInability = (t) => !/I do not have a reliable technical answer/i.test(t);
const noLive = (out) => out.stats.liveTransportInvocations === 0 && out.openaiCalls === 0;

const report = { at: new Date().toISOString(), pass: true, cases: [] };

function push(id, ok, detail = {}) {
  report.cases.push({ id, ok, ...detail });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} ${id}`);
}

{
  const profile = buildSeniorArchitectResponseProfile({
    analysis: { category: "Authorization", domain: "SAP Security" },
    question: "Explain how do you use PFCG?",
    reasoningMode: "configure"
  });
  push("profile-sap-active", /STRUCTURAL BEATS/i.test(profile) && /ARTIFACT DISCIPLINE/i.test(profile) && /Master Prompt/i.test(profile), {
    preview: profile.slice(0, 180)
  });
}

{
  const okDomain = isSeniorArchitectTechnicalDomain(
    { category: "General", domain: "General" },
    "What is the difference between authentication and authorization in IAM?"
  );
  const profile = buildSeniorArchitectResponseProfile({
    analysis: { category: "General", domain: "General" },
    question: "What is the difference between authentication and authorization in IAM?"
  });
  push("profile-open-world-iam", okDomain && /OPEN-WORLD|ARTIFACT DISCIPLINE/i.test(profile) && !/SU25 Steps 2a/i.test(profile), {
    preview: profile.slice(0, 180)
  });
}

{
  const out = await ask("Why do organizations implement BRM?");
  const t = out.substantive;
  const ok = noLive(out) && noInability(t) && noHeadings(t)
    && /business[- ]role/i.test(t)
    && /(?:PFCG|technical role|ARM|mapping)/i.test(t)
    && /(?:govern|SoD|audit|retire|prove)/i.test(t)
    && t.length > 120;
  push("brm-architect-structure", ok, { route: out.admission?.route, preview: t.slice(0, 280) });
}

{
  const out = await ask("Explain how do you use PFCG?");
  const t = out.substantive;
  const soup = (t.match(/\b(?:USOBT_C|USOBX_C|SU25|AGR_DEFINE|PFCG_TIME_DEPENDENCY)\b/g) || []).length;
  const ok = noLive(out) && noInability(t) && noHeadings(t)
    && /\bPFCG\b/i.test(t)
    && /(?:Menu tab|menu tab|Authorizations tab|authorization profile|Generate)/i.test(t)
    && /(?:AGR_USERS|AGR_1251|user buffer|SU01|user comparison)/i.test(t)
    && /(?:SU53|validat|prove|business (?:action|transaction))/i.test(t)
    && soup < 3
    && t.length > 120;
  push("pfcg-architect-structure", ok, {
    route: out.admission?.route,
    soup,
    preview: t.slice(0, 280)
  });
}

{
  const out = await ask("What are Critical Actions?");
  const t = out.substantive;
  const ok = noLive(out) && noInability(t) && noHeadings(t)
    && /Critical Action/i.test(t)
    && /(?:SoD|segregation|Critical Permission|ruleset|ARA)/i.test(t)
    && !/\bPFCG\b.*\bSU25\b/i.test(t);
  push("critical-actions-depth", ok, { route: out.admission?.route, preview: t.slice(0, 220) });
}

{
  const out = await ask("What is the difference between authentication and authorization in IAM?");
  const t = out.substantive;
  const ok = noLive(out) && noInability(t) && t.length > 40
    && !/\b(?:SU24|SU25|GRFNMW_CONFIGURE|USOBT_C)\b/i.test(t);
  push("iam-no-sap-gui-dump", ok, { route: out.admission?.route, preview: t.slice(0, 220) });
}

{
  const out = await ask("What is ZZX99_FAKE in Quantum Ledger Controllers?");
  const t = out.substantive;
  const ok = noLive(out)
    && /would not invent|not have verified product documentation/i.test(t)
    && !/\bGRFNMW_CONFIGURE\b/.test(t);
  push("open-world-no-fabrication", ok, { route: out.admission?.route, preview: t.slice(0, 220) });
}

delete process.env.LLM_PROVIDER_MODE;
delete process.env.INTERVIEW_SAFE_MODE;
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`masterPromptArchitect: ${report.pass ? "PASS" : "FAIL"} → ${OUT}`);
assert.equal(report.pass, true);
