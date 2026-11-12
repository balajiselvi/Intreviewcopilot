const fs = require("fs");

const stagedPath = "D:/My Projects/InterviewCopilot/data/index-staged/knowledgeIndex.json";
const backupPath = "D:/My Projects/InterviewCopilot/data/index-backup-2026-10-19/knowledgeIndex.json";
const manifestPath = "D:/My Projects/InterviewCopilot/data/index-staged/knowledgeManifest.json";
const reportPath = "D:/My Projects/InterviewCopilot/data/index-staged/knowledgeReport.json";

const staged = JSON.parse(fs.readFileSync(stagedPath, "utf8"));
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const dims = new Set(staged.chunks.map((chunk) => (chunk.embedding || []).length));
const files = new Set(staged.chunks.map((chunk) => chunk.sourceFile || chunk.metadata?.sourceFile || chunk.fileName));
const backupFiles = new Set(backup.chunks.map((chunk) => chunk.sourceFile || chunk.metadata?.sourceFile || chunk.fileName));
const textOf = (chunk) => `${chunk.heading || chunk.section || ""}\n${chunk.content || ""}`;
const joined = staged.chunks.map(textOf).join("\n");

function has(pattern) {
  return staged.chunks.some((chunk) => pattern.test(textOf(chunk)));
}

const required = [
  ["activate-phases", /Discover, Prepare, Explore, Realize, Deploy, and Run/],
  ["joule-trust", /Trust Configuration/],
  ["joule-groups", /joule_tenant_admin/],
  ["car-admin", /\/POSDW\/ADMINISTRATOR/],
  ["sac-team", /team folder/],
  ["public-trace", /Display Authorization Trace/]
];
const forbidden = [
  ["false-weeks", /Execute \(Weeks/],
  ["false-percent", /70–80%/],
  ["false-duration", /6–12 months/]
];

const summary = {
  stagedChunks: staged.chunks.length,
  backupChunks: backup.chunks.length,
  stagedDocuments: staged.totalDocuments,
  manifestChunks: manifest.totalChunks,
  manifestDocuments: manifest.totalDocuments,
  embeddingVersion: manifest.embeddingVersion,
  indexEmbeddingModel: staged.embeddingModel,
  dims: [...dims],
  report: {
    documentsProcessed: report.documentsProcessed,
    documentsSkipped: report.documentsSkipped,
    documentsUpdated: report.documentsUpdated,
    chunksCreated: report.chunksCreated,
    errors: report.errors
  },
  required: Object.fromEntries(required.map(([name, pattern]) => [name, has(pattern)])),
  forbidden: Object.fromEntries(forbidden.map(([name, pattern]) => [name, has(pattern)])),
  activateFiles: [...files].filter((file) => /sap-activate|rise-project|project-lifecycle/.test(String(file))),
  backupOnly: [...backupFiles].filter((file) => !files.has(file)).slice(0, 40),
  stagedOnly: [...files].filter((file) => !backupFiles.has(file)).slice(0, 40)
};

const out = "D:/My Projects/InterviewCopilot/eval/results/_stagedIndexValidation.json";
fs.writeFileSync(out, JSON.stringify(summary, null, 2));
const ok = summary.dims.length === 1 && summary.dims[0] === 384
  && summary.embeddingVersion === "text-embedding-3-small"
  && Object.values(summary.required).every(Boolean)
  && Object.values(summary.forbidden).every((hit) => !hit)
  && summary.report.errors.length === 0
  && summary.stagedChunks === summary.manifestChunks;
console.log(JSON.stringify({ ok, stagedChunks: summary.stagedChunks, dims: summary.dims, required: summary.required, forbidden: summary.forbidden, errors: summary.report.errors.length }));
if (!ok) process.exitCode = 1;
