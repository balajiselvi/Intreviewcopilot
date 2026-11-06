/**
 * Serves the V2 Principal Architect engine over the main interview UI SSE contract:
 *   - token chunks:  data: {"text":"..."}\n\n
 *   - answer_final:  event: answer_final\n data: {...}\n\n
 *   - completion:    data: [DONE]\n\n
 *
 * Bypasses V1 sanitizers / integrity mutation / client custom prompt overrides.
 */

import path from "path";
import { applyKnowledgeRootEnv } from "./resolveKnowledgeRoot.js";
import { warmKnowledgeCache } from "./retrieval.js";
import { runInterviewPipeline } from "./pipeline.js";

const V2_MODEL = "gpt-4o";

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

  // Ignore localStorage gpt-4o-mini / Gemini / Claude overrides for the V2 engine path.
  // Principal Architect contract requires gpt-4o + principalArchitect.js (not client systemPrompt).
  const requested = String(model || "").trim();
  const useModel = (!requested || /mini|gemini|claude|gpt-3\.5/i.test(requested))
    ? (process.env.OPENAI_MODEL || V2_MODEL)
    : (requested.startsWith("gpt-4o") ? requested : (process.env.OPENAI_MODEL || V2_MODEL));
  const finalModel = /gpt-4o/i.test(useModel) ? useModel : V2_MODEL;

  writeEvent(res, "generation", {
    engine: "v2-principal-architect",
    model: finalModel,
    answerKind: "v2_streaming",
    recovered: false,
    knowledgeRoot: path.basename(path.dirname(knowledgeRoot)) === "InterviewCopilot_V2"
      ? "InterviewCopilot_V2/knowledge"
      : path.basename(knowledgeRoot)
  });

  try {
    const validationMode = String(process.env.V2_VALIDATION_MODE || "full").trim() || "full";
    let streamedChars = 0;

    const result = await runInterviewPipeline(
      {
        question: q,
        apiKey,
        model: finalModel,
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
          streamedChars += String(token || "").length;
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

    // If the UI missed tokens (proxy buffering), still deliver the full answer once.
    if (finalText && streamedChars === 0) {
      writeChunk(res, finalText);
    }

    writeEvent(res, "answer_final", {
      text: finalText,
      recovered: false,
      mutated: false,
      answerKind: "v2_validated",
      engine: "v2-principal-architect",
      model: result.model || finalModel,
      retrievalMs: result.retrievalMs ?? null,
      ttftMs: result.ttftMs ?? null,
      totalMs: result.totalMs ?? null,
      latencyMs: result.latencyMs ?? null,
      hits: (result.retrieval?.hits || []).map((h) => h.id)
    });

    writeEvent(res, "generation", {
      engine: "v2-principal-architect",
      model: result.model || finalModel,
      finish_reason: result.finishReason || "stop",
      answerKind: "v2_validated",
      recovered: false,
      retrievalMs: result.retrievalMs,
      ttftMs: result.ttftMs,
      totalMs: result.totalMs,
      usage: result.usage || null
    });

    res.write("data: [DONE]\n\n");
    if (typeof res.flush === "function") {
      try { res.flush(); } catch { /* ignore */ }
    }
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
