/**
 * Clean-Core pipeline:
 * Question → Router → Top-K right-sized retrieval → Principal Architect prompt → streaming LLM → UI
 * Intentionally NO destructive sanitizers / integrity replacements.
 */

import { routeQuestion } from "./router.js";
import { retrieveKnowledge, warmKnowledgeCache } from "./retrieval.js";
import { buildPrincipalArchitectMessages } from "./prompts/principalArchitect.js";
import { generateAnswer } from "./llmProvider.js";

function loadCandidateBackground() {
  return String(process.env.CANDIDATE_BACKGROUND || process.env.CANDIDATE_PROFILE_NOTES || "").trim();
}

/**
 * @param {{ question: string, apiKey?: string, model?: string, validationMode?: string }} input
 * @param {{ onToken?: (t: string) => void, onFirstToken?: (ttftMs: number) => void, onRetrieval?: (info: object) => void }} [hooks]
 */
export async function runInterviewPipeline(input, hooks = {}) {
  const question = String(input.question || "").trim();
  if (!question) {
    return { ok: false, error: "empty-question" };
  }

  const pipelineStarted = Date.now();
  warmKnowledgeCache();

  const routed = routeQuestion(question);
  const retrieval = retrieveKnowledge(question, { domain: routed.domain, topK: 6 });

  if (typeof hooks.onRetrieval === "function") {
    try {
      hooks.onRetrieval({
        hits: retrieval.hits,
        retrievalMs: retrieval.retrievalMs,
        totalChars: retrieval.totalChars,
        corpusSize: retrieval.corpusSize,
        domain: routed.domain,
        intent: routed.intent
      });
    } catch { /* ignore */ }
  }

  const messages = buildPrincipalArchitectMessages({
    question,
    domain: routed.domain,
    intent: routed.intent,
    knowledgeBlock: retrieval.knowledgeBlock,
    candidateBackground: loadCandidateBackground()
  });

  const mode = input.validationMode || process.env.LLM_VALIDATION_MODE || "full";
  if (mode === "retrieval-only") {
    return {
      ok: true,
      mode: "retrieval-only",
      route: routed,
      retrieval,
      answer: null,
      rawProviderHint: null,
      promptMessages: messages,
      retrievalMs: retrieval.retrievalMs,
      totalMs: Date.now() - pipelineStarted
    };
  }

  const generation = await generateAnswer({
    messages,
    model: input.model,
    apiKey: input.apiKey,
    maxTokens: routed.intent === "experience" || routed.intent === "architecture" ? 1000 : 900,
    temperature: 0.25
  }, hooks);

  return {
    ok: true,
    mode: "full",
    route: routed,
    retrieval: {
      hits: retrieval.hits,
      corpusSize: retrieval.corpusSize,
      totalChars: retrieval.totalChars,
      retrievalMs: retrieval.retrievalMs,
      cacheLoadMs: retrieval.cacheLoadMs,
      cacheWarm: retrieval.cacheWarm
    },
    answer: generation.text,
    rawProviderHint: generation.rawProviderHint,
    model: generation.model,
    finishReason: generation.finishReason,
    usage: generation.usage,
    latencyMs: generation.latencyMs,
    ttftMs: generation.ttftMs,
    retrievalMs: retrieval.retrievalMs,
    totalMs: Date.now() - pipelineStarted,
    traceFile: generation.traceFile
  };
}
