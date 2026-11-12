/**
 * Offline: confirm Master Operating Contract reaches assembled systemPrompt
 * via the same builder chat.js calls. No provider calls.
 */
const { pathToFileURL } = require("url");
const { register } = require("node:module");
const { MessageChannel } = require("worker_threads");

// Extensionless ESM resolver used by Next-style imports in interviewPrompt.js
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\\.(js|json|node|mjs|cjs)$/i.test(specifier)) {
      try { return await nextResolve(specifier + ".js", context); } catch (_) {}
    }
    return nextResolve(specifier, context);
  }
`), pathToFileURL("./"));

(async () => {
  const { buildSapInterviewPrompt } = await import("../../lib/prompt/interviewPrompt.js");
  const knowledge =
    "## Configure a BRFplus agent rule for MSMP\n" +
    "I generate the BRF+ flat-rule shell in Define Workflow-Related MSMP Rules, " +
    "then open BRFPLUS and maintain the function in Event Mode.";
  const systemPrompt = buildSapInterviewPrompt({
    question: "How to configure BRF+?",
    interviewContext: {
      primaryCategory: "GRC",
      questionTopic: "GRC",
      answerScope: "IMPLEMENTATION_WALKTHROUGH",
      depth: "medium"
    },
    analysis: { domain: "GRC", primaryCategory: "GRC", category: "Implementation", secondaryCategories: [] },
    reasoningContract: { reasoningMode: "implementation" },
    technicalReasoning: { recommendedComponents: ["MSMP", "BRF+"] },
    interviewer: { persona: "architect" },
    knowledgeContext: knowledge,
    model: "gpt-4o-mini",
    responseLength: "medium",
    sapComponents: ["MSMP", "BRF+"]
  });

  const checks = {
    operatingContract: systemPrompt.includes("INTERVIEW COPILOT V2.1 OPERATING CONTRACT"),
    workflowFirst: systemPrompt.includes("WORKFLOW-FIRST"),
    fivePoint: systemPrompt.includes("5-POINT TECHNICAL STRUCTURE"),
    supportingKnowledgeHeader: /SUPPORTING KNOWLEDGE/i.test(systemPrompt),
    brfKnowledgeBody: systemPrompt.includes("Define Workflow-Related MSMP Rules"),
    brfplusToken: systemPrompt.includes("BRFPLUS"),
    forbidGrfcp2: systemPrompt.includes("GRFCP2"),
    chars: systemPrompt.length
  };
  console.log(JSON.stringify(checks, null, 2));
  if (!checks.operatingContract || !checks.workflowFirst || !checks.brfKnowledgeBody) {
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error(err);
  process.exit(2);
});
