/**
 * Serves the V2 Principal Architect engine over the main interview UI SSE contract:
 *   - token chunks:  data: {"text":"..."}\n\n
 *   - answer_final:  event: answer_final\n data: {...}\n\n
 *   - completion:    data: [DONE]\n\n
 *
 * Bypasses V1 sanitizers / integrity mutation. Audio auto-submit uses the same /api/chat route.
 */

import path from "path";
import { applyKnowledgeRootEnv } from "./resolveKnowledgeRoot.js";
import { warmKnowledgeCache } from "./retrieval.js";
import { runInterviewPipeline } from "./pipeline.js";

function writeChunk(res, text) {
  if (!res?.writable) return false;
  try {
    const ok = res.write(`data: ${JSON.stringify({ text })}\n\n`);
    if (typeof res.flush === "function") {
      try { res.flush(); } catch { /* ignore */ }
    }
    return ok;
  } catch {
    return false;
  }
}

function writeEvent(res, event, payload) {
  if (!res?.writable) return false;
  try {
    const ok = res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    if (typeof res.flush === "function") {
      try { res.flush(); } catch { /* ignore */ }
    }
    return ok;
  } catch {
    return false;
  }
}

function setHeaders(res) {
  try {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<boolean>} true if this request was fully handled
 */
export async function serveV2Chat(req, res, {
  question,
  apiKey,
  model,
  logger
} = {}) {
  const enabled = String(process.env.USE_V2_ENGINE || "1").trim() !== "0";
  if (!enabled) return false;

  const q = String(question || "").trim();
  if (!q) return false;

  const knowledgeRoot = applyKnowledgeRootEnv(process.cwd());
  try {
    warmKnowledgeCache();
  } catch (err) {
    logger?.error?.("V2 KB warm failed:", err);
  }

  if (!setHeaders(res)) {
    res.status(500).json({ error: "Failed to initialize streaming response." });
    return true;
  }

  const useModel = model && !String(model).toLowerCase().startsWith("gemini") && !String(model).toLowerCase().includes("claude")
    ? model
    : (process.env.OPENAI_MODEL || "gpt-4o");

  writeEvent(res, "generation", {
    engine: "v2-principal-architect",
    model: useModel,
    knowledgeRoot: path.basename(path.dirname(knowledgeRoot)) === "InterviewCopilot_V2"
      ? "InterviewCopilot_V2/knowledge"
      : path.basename(knowledgeRoot)
  });

  try {
    // Interactive UI always needs spoken generation. Legacy retrieval-only diagnostics
    // must not blank the dashboard — override unless V2_VALIDATION_MODE is set explicitly.
    const validationMode = String(process.env.V2_VALIDATION_MODE || "full").trim() || "full";

    const result = await runInterviewPipeline(
      {
        question: q,
        apiKey,
        model: useModel,
        validationMode
      },
      {
        onRetrieval(info) {
          writeEvent(res, "context", {
            engine: "v2",
            domain: info.domain,
            intent: info.intent,
            retrievalMs: info.retrievalMs,
            totalChars: info.totalChars,
            corpusSize: info.corpusSize,
            hits: (info.hits || []).map((h) => h.id)
          });
        },
        onToken(token) {
          writeChunk(res, token);
        }
      }
    );

    if (!result.ok) {
      writeEvent(res, "error", { error: result.error || "v2-pipeline-failed" });
      res.write("data: [DONE]\n\n");
      res.end();
      return true;
    }

    const finalText = String(result.answer || "").trim();
    writeEvent(res, "answer_final", {
      text: finalText,
      recovered: false,
      mutated: false,
      engine: "v2-principal-architect",
      model: result.model,
      retrievalMs: result.retrievalMs ?? null,
      ttftMs: result.ttftMs ?? null,
      totalMs: result.totalMs ?? null,
      latencyMs: result.latencyMs ?? null,
      hits: (result.retrieval?.hits || []).map((h) => h.id)
    });

    // Ensure UI that only concatenates message tokens still has the final text if stream was empty.
    if (finalText) {
      // answer_final is authoritative; do not re-emit full text as tokens (would duplicate).
    }

    writeEvent(res, "generation", {
      engine: "v2-principal-architect",
      model: result.model,
      finish_reason: result.finishReason || "stop",
      retrievalMs: result.retrievalMs,
      ttftMs: result.ttftMs,
      totalMs: result.totalMs,
      usage: result.usage || null
    });

    res.write("data: [DONE]\n\n");
    res.end();
    return true;
  } catch (err) {
    logger?.error?.("V2 chat engine failed:", err);
    try {
      writeEvent(res, "error", { error: err?.message || String(err) });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch {
      try { res.end(); } catch { /* ignore */ }
    }
    return true;
  }
}

export function isV2EngineEnabled() {
  return String(process.env.USE_V2_ENGINE || "1").trim() !== "0";
}
