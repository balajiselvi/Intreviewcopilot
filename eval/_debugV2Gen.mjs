import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || /^\s*#/.test(line)) continue;
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

console.log({
  key: process.env.OPENAI_API_KEY ? `len=${process.env.OPENAI_API_KEY.length}` : "MISSING",
  mode: process.env.LLM_VALIDATION_MODE || null,
  model: process.env.OPENAI_MODEL || null,
  useV2: process.env.USE_V2_ENGINE || null
});

process.env.LLM_VALIDATION_MODE = "full";

const { applyKnowledgeRootEnv } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/resolveKnowledgeRoot.js")).href);
applyKnowledgeRootEnv(ROOT);
const { invalidateKnowledgeCache, warmKnowledgeCache } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/retrieval.js")).href);
invalidateKnowledgeCache();
warmKnowledgeCache();
const { runInterviewPipeline } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/pipeline.js")).href);

try {
  const r = await runInterviewPipeline({
    question: "How do you build PFCG roles?",
    model: "gpt-4o",
    validationMode: "full"
  });
  console.log({
    ok: r.ok,
    mode: r.mode,
    error: r.error || null,
    chars: (r.answer || "").length,
    ttft: r.ttftMs,
    total: r.totalMs,
    model: r.model
  });
  console.log((r.answer || "").slice(0, 300));
} catch (e) {
  console.error("THROW", e?.message, e?.code, e?.stack?.split("\n").slice(0, 4).join(" | "));
}
