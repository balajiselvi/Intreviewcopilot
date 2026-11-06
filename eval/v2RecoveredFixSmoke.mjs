/**
 * Verify V2 path answers BTP questions with no principle-level recovered fallback.
 */
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
process.env.V2_VALIDATION_MODE = "full";
process.env.OPENAI_MODEL = "gpt-4o";

const PRINCIPLE = /define the control at the correct identity or authorization plane/i;

const { applyKnowledgeRootEnv } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/resolveKnowledgeRoot.js")).href);
applyKnowledgeRootEnv(ROOT);
const { invalidateKnowledgeCache, warmKnowledgeCache } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/retrieval.js")).href);
invalidateKnowledgeCache();
warmKnowledgeCache();
const { runInterviewPipeline } = await import(pathToFileURL(path.join(ROOT, "lib/v2Core/pipeline.js")).href);
const { prepareLiveTranscript } = await import(pathToFileURL(path.join(ROOT, "lib/transcriptGuardrails.js")).href).catch(async () => {
  // CJS module
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  return require("../lib/transcriptGuardrails.js");
});

const QUESTIONS = [
  "What are the main components of SAP BTP?",
  "What is the difference between SAP BTP and SAP Cloud Platform (SCP)?"
];

const outPath = path.join(ROOT, "eval", "v2_recovered_fix_smoke.jsonl");
fs.writeFileSync(outPath, "", "utf8");
let fails = 0;

for (const question of QUESTIONS) {
  const prepared = prepareLiveTranscript(question);
  const r = await runInterviewPipeline({ question, model: "gpt-4o", validationMode: "full" });
  const answer = String(r.answer || "");
  const hasPrinciple = PRINCIPLE.test(answer);
  const hasBtp = /BTP|Business Technology Platform/i.test(answer);
  const depth =
    question.includes("components")
      ? /HANA|Datasphere|Analytics|Integration|AI Core|Joule|XSUAA|IAS/i.test(answer)
      : /Cloud Platform|SCP|Neo|Cloud Foundry|Global Account/i.test(answer);
  const pass = Boolean(r.ok && answer.length > 200 && !hasPrinciple && hasBtp && depth);
  if (!pass) fails += 1;
  const row = {
    question,
    preparedNormalized: prepared.normalized,
    pass,
    hasPrinciple,
    hasBtp,
    depth,
    retrievalMs: r.retrievalMs,
    ttftMs: r.ttftMs,
    totalMs: r.totalMs,
    hits: (r.retrieval?.hits || []).map((h) => h.id),
    answer
  };
  fs.appendFileSync(outPath, `${JSON.stringify(row)}\n`, "utf8");
  console.log(`pass=${pass} principle=${hasPrinciple} ttft=${r.ttftMs} total=${r.totalMs}`);
  console.log(answer.slice(0, 220).replace(/\s+/g, " "), "…");
}

console.log(`Wrote ${outPath} fails=${fails}`);
if (fails) process.exit(1);
