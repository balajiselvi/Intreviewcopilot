/**
 * Smoke: main-app V2 engine path (same code /api/chat delegates to).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadEnvLocal();
process.env.LLM_VALIDATION_MODE = "full";
process.env.V2_VALIDATION_MODE = "full";
process.chdir(ROOT);

const { applyKnowledgeRootEnv } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/resolveKnowledgeRoot.js")).href);
const knowledgeRoot = applyKnowledgeRootEnv(ROOT);
console.log("knowledgeRoot", knowledgeRoot);

const { invalidateKnowledgeCache, warmKnowledgeCache } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/retrieval.js")).href);
invalidateKnowledgeCache();
const warm = warmKnowledgeCache();
console.log("warm", warm);

const { runInterviewPipeline } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/pipeline.js")).href);

const question = "How do you build PFCG roles?";
let ttft = null;
const r = await runInterviewPipeline(
  { question, model: process.env.OPENAI_MODEL || "gpt-4o" },
  { onFirstToken: (ms) => { ttft = ms; } }
);

const answer = String(r.answer || "");
const must = [/Menu/i, /SU24|USOBT_C/i, /Expert Mode/i, /PFUD|SUPC|user (?:master )?comparison/i];
const mustOk = must.every((re) => re.test(answer));
const masterHit = (r.retrieval?.hits || []).some((h) => /00_master/.test(h.id));
const pass = Boolean(r.ok && mustOk && masterHit && (r.retrievalMs ?? 99) < 50 && (r.ttftMs ?? ttft ?? 9999) < 2500);

const out = {
  pass,
  mustOk,
  masterHit,
  retrievalMs: r.retrievalMs,
  ttftMs: r.ttftMs ?? ttft,
  totalMs: r.totalMs,
  corpusSize: r.retrieval?.corpusSize,
  hits: (r.retrieval?.hits || []).map((h) => h.id),
  knowledgeRoot,
  answerPreview: answer.slice(0, 400)
};
fs.writeFileSync(path.join(ROOT, "eval", "v2_engine_ui_smoke.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!pass) process.exit(1);
