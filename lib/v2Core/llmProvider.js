/**
 * Streamlined OpenAI provider — singleton client, fast model default, TTFT capture.
 * No strip / recover / replace layers.
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0.2;

function tracesDir() {
  const dir = path.join(process.cwd(), "data", "traces");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getClient(apiKey) {
  if (!globalThis.__openaiClient || globalThis.__openaiClientKey !== apiKey) {
    globalThis.__openaiClient = new OpenAI({ apiKey, maxRetries: 1, timeout: 60000 });
    globalThis.__openaiClientKey = apiKey;
  }
  return globalThis.__openaiClient;
}

/**
 * @param {{ messages: Array<{role:string,content:string}>, model?: string, apiKey?: string, maxTokens?: number, temperature?: number }} args
 * @param {{ onToken?: (t: string) => void, onFirstToken?: (ttftMs: number) => void }} [hooks]
 */
export async function generateAnswer({
  messages,
  model,
  apiKey,
  maxTokens = 900,
  temperature = DEFAULT_TEMPERATURE
}, hooks = {}) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    const err = new Error("OPENAI_API_KEY missing");
    err.code = "NO_API_KEY";
    throw err;
  }

  const client = getClient(key);
  const useModel = model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const started = Date.now();
  let ttftMs = null;

  const stream = await client.chat.completions.create({
    model: useModel,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
    stream_options: { include_usage: true }
  });

  let raw = "";
  let finishReason = null;
  let usage = null;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    if (delta) {
      if (ttftMs == null) {
        ttftMs = Date.now() - started;
        if (typeof hooks.onFirstToken === "function") {
          try { hooks.onFirstToken(ttftMs); } catch { /* ignore */ }
        }
      }
      raw += delta;
      if (typeof hooks.onToken === "function") {
        try { hooks.onToken(delta); } catch { /* UI write failures must not kill generation */ }
      }
    }
    if (chunk.choices?.[0]?.finish_reason) finishReason = chunk.choices[0].finish_reason;
    if (chunk.usage) usage = chunk.usage;
  }

  const latencyMs = Date.now() - started;
  const trace = {
    at: new Date().toISOString(),
    model: useModel,
    temperature,
    latencyMs,
    ttftMs,
    finishReason,
    usage,
    rawChars: raw.length,
    raw
  };

  try {
    const file = path.join(tracesDir(), `trace_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(trace, null, 2), "utf8");
    trace.traceFile = file;
  } catch (e) {
    trace.traceWriteError = e?.message || String(e);
  }

  return {
    text: raw.trim(),
    rawProviderHint: raw,
    model: useModel,
    finishReason,
    usage,
    latencyMs,
    ttftMs,
    traceFile: trace.traceFile || null
  };
}
