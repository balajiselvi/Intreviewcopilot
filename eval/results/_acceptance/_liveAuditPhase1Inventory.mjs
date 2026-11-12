/**
 * Phase 1 inventory — classify interview sessions for LIVE provenance.
 * No secrets printed. No generation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIR = path.join(ROOT, "data", "interview-sessions");
const OUT_JSON = path.join(ROOT, "eval", "results", "_acceptance", "V23_HISTORICAL_SESSION_INVENTORY.json");
const OUT_MD = path.join(ROOT, "eval", "results", "_acceptance", "V23_HISTORICAL_SESSION_INVENTORY.md");

function loadEnvFiles() {
  const found = [];
  for (const f of [".env", ".env.local", ".env.development", ".env.production"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    const keys = {};
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const m = line.match(/^(OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|OPENROUTER_API_KEY|GROQ_API_KEY|LLM_PROVIDER_MODE|INTERVIEW_PROVIDER_MODE|OPENAI_MODEL)\s*=\s*(.*)$/i);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      const present = Boolean(v) && v !== "null" && !/^your[-_]/i.test(v) && !/^sk-xxx/i.test(v);
      keys[m[1]] = { present, len: present ? v.length : 0, prefix: present ? `${v.slice(0, 6)}…` : "" };
    }
    found.push({ file: f, keys });
  }
  return found;
}

function classifySession(s, file) {
  const id = String(s.sessionId || "");
  const src = String(s.source || "");
  const qa = Array.isArray(s.qa) ? s.qa : [];
  const models = [...new Set([s.model, ...qa.map((q) => q.model)].filter(Boolean))];
  const sources = [...new Set(qa.map((q) => q.source).filter(Boolean))];
  const routes = [...new Set(qa.map((q) => q.route).filter(Boolean))];
  const hasMic = sources.includes("microphone");
  const hasUsageTokens = qa.some((q) => Number(q?.usage?.total_tokens || q?.usage?.completion_tokens || 0) > 0);
  const hasLiveTransportHint = qa.some((q) =>
    Number(q?.latencyMs || 0) > 800
    && String(q.route || "") === "GENERATION"
    && !/mock/i.test(String(q.model || ""))
  );
  const mockModel = models.some((m) => /mock/i.test(String(m)));
  const testId = /assert|probe|hist_|manual_input|offline|forensic|v23-simp|soak|battery/i.test(id + file);
  const systemOnly = sources.length && sources.every((x) => x === "system" || x === "verified-workflow" || x === "prepared-script" || x === "admission");

  let provenance = "PROVENANCE_UNVERIFIED";
  let reason = "";
  if (testId || mockModel) {
    provenance = "TEST_OR_NON_LIVE";
    reason = mockModel ? "mock-deterministic model recorded" : "test/assert/probe session id";
  } else if (hasMic && models.some((m) => /gpt-|claude|gemini/i.test(String(m))) && !mockModel) {
    // Microphone + real model name is strongest available signal in this store.
    // Token usage strengthens; absence does not alone disqualify (older schemas omit usage).
    provenance = hasUsageTokens || hasLiveTransportHint ? "VERIFIED_LIVE" : "PROVENANCE_UNVERIFIED";
    reason = hasUsageTokens
      ? "microphone + model + token usage"
      : hasLiveTransportHint
        ? "microphone + model + GENERATION latency>800ms"
        : "microphone + model but no token usage / weak latency evidence";
    if (provenance === "PROVENANCE_UNVERIFIED") {
      // Still a strong candidate for genuine interview use — label clearly.
      provenance = "CANDIDATE_LIVE_WEAK_PROVENANCE";
    }
  } else if (/^live_/i.test(id) && src === "live-interview" && !systemOnly) {
    provenance = "PROVENANCE_UNVERIFIED";
    reason = "live_ id but insufficient mic/token evidence";
  } else if (systemOnly || testId) {
    provenance = "TEST_OR_NON_LIVE";
    reason = "system/assert sources only";
  }

  const completed = qa.filter((q) => q.status === "completed" && String(q.answerShown || "").length > 40);
  return {
    sessionId: id,
    file,
    startedAt: s.startedAt || null,
    endedAt: s.endedAt || null,
    source: src,
    company: s.company || "",
    models,
    sources,
    routes,
    qaCount: qa.length,
    completedCount: completed.length,
    hasMic,
    hasUsageTokens,
    hasLiveTransportHint,
    provenance,
    reason,
    sampleQuestions: completed.slice(0, 8).map((q, i) => ({
      seq: i + 1,
      question: String(q.question || q.questionRaw || "").slice(0, 160),
      route: q.route || null,
      model: q.model || null,
      source: q.source || null,
      latencyMs: q.latencyMs ?? null,
      tokens: q?.usage?.total_tokens ?? q?.usage?.completion_tokens ?? null,
      answerPreview: String(q.answerShown || "").slice(0, 140)
    }))
  };
}

const env = loadEnvFiles();
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
const rows = files.map((f) => {
  const p = path.join(DIR, f);
  const st = fs.statSync(p);
  let s;
  try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
  return { mtime: st.mtime.toISOString(), size: st.size, ...classifySession(s, f) };
}).filter(Boolean).sort((a, b) => b.mtime.localeCompare(a.mtime));

const byProv = rows.reduce((a, r) => { a[r.provenance] = (a[r.provenance] || 0) + 1; return a; }, {});

// Select 3–5 most recent genuine / candidate LIVE (exclude TEST)
const livePool = rows.filter((r) =>
  r.provenance === "VERIFIED_LIVE"
  || r.provenance === "CANDIDATE_LIVE_WEAK_PROVENANCE"
).slice(0, 12);

const selected = [];
for (const r of livePool) {
  if (selected.length >= 5) break;
  // Prefer distinct sessions with completed Q&A
  if (r.completedCount < 1) continue;
  selected.push(r);
}

const inventory = {
  at: new Date().toISOString(),
  persistence: {
    mechanism: "JSON files via lib/interviewSessionStore.js",
    directory: "data/interview-sessions",
    evalSessionsPresent: fs.existsSync(path.join(ROOT, "eval", "sessions")),
    totalSessionFiles: rows.length
  },
  providerEnv: env,
  provenanceCounts: byProv,
  selectedSessions: selected.map((s) => ({
    sessionId: s.sessionId,
    provenance: s.provenance,
    reason: s.reason,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    mtime: s.mtime,
    qaCount: s.qaCount,
    completedCount: s.completedCount,
    models: s.models,
    sources: s.sources,
    hasMic: s.hasMic,
    hasUsageTokens: s.hasUsageTokens
  })),
  recentTop15: rows.slice(0, 15).map((r) => ({
    sessionId: r.sessionId,
    provenance: r.provenance,
    reason: r.reason,
    mtime: r.mtime,
    completedCount: r.completedCount,
    models: r.models,
    sources: r.sources
  }))
};

fs.writeFileSync(OUT_JSON, JSON.stringify(inventory, null, 2));

const md = [];
md.push("# V23 Historical Session Inventory");
md.push("");
md.push(`Generated: ${inventory.at}`);
md.push("");
md.push("## Persistence mechanism (verified from code)");
md.push("");
md.push("- Store: `lib/interviewSessionStore.js` → `data/interview-sessions/<sessionId>.json`");
md.push("- Written by `pages/api/chat.js` via `appendQa` during interview turns");
md.push("- `eval/sessions/`: **not present** — not the production history path");
md.push(`- Total session files: **${rows.length}**`);
md.push("");
md.push("## Provider environment (presence only — no secrets)");
md.push("");
if (!env.length) md.push("- No `.env` / `.env.local` provider keys found at project root.");
for (const e of env) {
  md.push(`### ${e.file}`);
  const keys = Object.keys(e.keys);
  if (!keys.length) md.push("- No matching provider keys.");
  for (const k of keys) {
    const v = e.keys[k];
    md.push(`- \`${k}\`: present=${v.present}${v.present ? `, len=${v.len}` : ""}`);
  }
}
md.push("");
md.push("## Provenance summary");
md.push("");
for (const [k, v] of Object.entries(byProv)) md.push(`- **${k}**: ${v}`);
md.push("");
md.push("### Provenance rules used");
md.push("");
md.push("- **VERIFIED_LIVE**: `microphone` source + real model id + (token usage OR GENERATION latency > 800ms)");
md.push("- **CANDIDATE_LIVE_WEAK_PROVENANCE**: microphone + real model, but no token/latency corroboration");
md.push("- **PROVENANCE_UNVERIFIED**: live_ id / live-interview source without sufficient evidence");
md.push("- **TEST_OR_NON_LIVE**: assert/probe/hist/manual_input ids, or `mock-deterministic` model");
md.push("");
md.push("## Selected sessions for replay (up to 5)");
md.push("");
if (!selected.length) {
  md.push("**None selected.** Genuine LIVE recovery blocked or empty.");
} else {
  for (const s of selected) {
    md.push(`### ${s.sessionId}`);
    md.push("");
    md.push(`- Provenance: **${s.provenance}** (${s.reason})`);
    md.push(`- Started: ${s.startedAt} · Ended: ${s.endedAt}`);
    md.push(`- Q&A: ${s.qaCount} total / ${s.completedCount} completed`);
    md.push(`- Models: ${s.models.join(", ") || "(none)"}`);
    md.push(`- Sources: ${s.sources.join(", ") || "(none)"}`);
    md.push(`- Mic: ${s.hasMic} · Token usage: ${s.hasUsageTokens} · Latency hint: ${s.hasLiveTransportHint}`);
    md.push("- Sample questions:");
    for (const q of s.sampleQuestions) {
      md.push(`  ${q.seq}. [${q.route}/${q.source}] ${q.question}`);
    }
    md.push("");
  }
}
md.push("## Limitations");
md.push("");
md.push("- Session JSON does **not** persist `LLM_PROVIDER_MODE` or a live-transport receipt. Classification is inferred from source/model/usage/latency.");
md.push("- Many `live_*` files are automated probes reused with `source: live-interview` — excluded when id/source pattern indicates test.");
md.push("- Safe-mode / LOCAL_KNOWLEDGE_FALLBACK / VERIFIED_WORKFLOW turns inside a LIVE session are not LLM generations; replay must still invoke LIVE generation for eligible GENERATION turns, and must not treat bank/procedure short-circuits as LIVE LLM proof.");
md.push("");

fs.writeFileSync(OUT_MD, md.join("\n"));
console.log(JSON.stringify({
  total: rows.length,
  byProv,
  selected: selected.map((s) => ({ id: s.sessionId, prov: s.provenance, completed: s.completedCount })),
  envFiles: env.map((e) => ({ file: e.file, keys: Object.fromEntries(Object.entries(e.keys).map(([k, v]) => [k, v.present])) })),
  outMd: path.relative(ROOT, OUT_MD)
}, null, 2));
