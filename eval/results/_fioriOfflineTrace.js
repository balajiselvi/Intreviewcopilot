/**
 * Offline non-provider trace for generic Fiori launchpad configuration.
 * No live model calls.
 */
const fs = require("node:fs");
const path = require("node:path");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const { decideInterviewTurn } = require("../../lib/turnDecision.js");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope.js");
const { retrieveCandidatesStage } = require("../../services/retrievalService.js");
const { explicitProductTopics } = require("../../lib/interviewContext.js");

const QUESTION = "How do you configure an SAP Fiori app in the launchpad?";

(async () => {
  const workflow = selectVerifiedWorkflow(QUESTION);
  const decision = decideInterviewTurn({ question: QUESTION, history: [] });
  const folders = productKnowledgeFolders(QUESTION);
  const topics = explicitProductTopics(QUESTION);

  const indexPath = path.join(__dirname, "..", "..", "data", "knowledgeIndex.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const candidates = await retrieveCandidatesStage({
    provider: { getCandidates: async () => index.chunks },
    query: { question: QUESTION },
    metadataFilters: { sourceFolders: folders }
  });
  const scoped = selectProductScopedChunks(QUESTION, candidates);
  const top = scoped.slice(0, 12).map((chunk, i) => ({
    rank: i + 1,
    id: chunk.id || chunk.chunkId,
    folder: chunk.sourceFolder,
    file: chunk.sourceFile,
    heading: chunk.heading || chunk.section,
    score: chunk.score ?? chunk.semanticScore ?? chunk.confidenceScore ?? null,
    preview: String(chunk.content || "").replace(/\s+/g, " ").slice(0, 220)
  }));

  // Prompt-lane check: read Fiori category template + deployment language from interviewPrompt
  const promptSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "prompt", "interviewPrompt.js"), "utf8");
  const fioriTemplateMatch = promptSrc.match(/Fiori:\s*"([\s\S]*?)",\s*\n\s*BW:/);
  const fioriTemplate = fioriTemplateMatch ? fioriTemplateMatch[1] : "";
  const promptHasSpacesPages = /spaces?\s*(?:and|&|\/)\s*pages|Manage Launchpad Spaces/i.test(fioriTemplate);
  const promptHasClassicDesigner = /Launchpad Designer|FLPD_CUST|FLPD_CONF|Groups/i.test(fioriTemplate);
  const promptHasODataV4 = /OData\s*V4|\/IWFND\/V4_ADMIN|service group/i.test(fioriTemplate + promptSrc);
  const promptHasDeploymentFirst = /deployment|Public Edition|Private Edition|on-premise/i.test(fioriTemplate);

  const out = {
    question: QUESTION,
    topics,
    decideInterviewTurn: {
      route: decision.route,
      reason: decision.reason || null,
      workflowId: decision.workflowId || decision.id || null
    },
    selectVerifiedWorkflow: workflow
      ? { id: workflow.id, route: workflow.route, sourceFiles: workflow.sourceFiles }
      : null,
    folders,
    topRankedChunks: top,
    sourceFilesUsed: [...new Set(top.map((row) => `${row.folder}/${row.file}`))],
    promptLaneCheck: {
      hasSpacesPages: promptHasSpacesPages,
      hasClassicDesigner: promptHasClassicDesigner,
      hasODataV4: promptHasODataV4,
      hasDeploymentFirst: promptHasDeploymentFirst,
      fioriTemplatePreview: fioriTemplate.slice(0, 500)
    }
  };

  const dumpPath = path.join(__dirname, "_fioriOfflineTrace.json");
  fs.writeFileSync(dumpPath, JSON.stringify(out, null, 2), "utf8");
  console.log(JSON.stringify(out, null, 2));
  console.log("\nWrote", dumpPath);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
