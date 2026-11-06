const { classifyGenerationFailure, isIncompleteGeneration } = require("./generationGuard");

function streamFailure(message) {
  const classified = classifyGenerationFailure({ message });
  return Object.assign(new Error(classified.userMessage), { classified });
}

// Retain a trailing CR until the next chunk: CRLF may straddle network reads.
function createSseParser(onEvent) {
  let buffer = "";
  let name = "message";
  let data = [];
  function line(value) {
    if (!value) {
      if (data.length) onEvent({ name, data: data.join("\n") });
      name = "message";
      data = [];
      return;
    }
    if (value.startsWith(":")) return;
    const colon = value.indexOf(":");
    const field = colon < 0 ? value : value.slice(0, colon);
    let content = colon < 0 ? "" : value.slice(colon + 1);
    if (content.startsWith(" ")) content = content.slice(1);
    if (field === "event") name = content;
    if (field === "data") data.push(content);
  }
  return {
    push(chunk, final = false) {
      buffer += chunk;
      let boundary;
      while ((boundary = /\r\n|\r|\n/.exec(buffer))) {
        if (!final && boundary[0] === "\r" && boundary.index === buffer.length - 1) break;
        const value = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        line(value);
      }
      if (final) {
        if (buffer) line(buffer);
        buffer = "";
        line("");
      }
    }
  };
}

async function consumeChatStream(response, { onText = () => {}, onEvent = () => {} } = {}) {
  if (!response.body) throw streamFailure("empty body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let completed = false;
  let ended = false;
  let generation = null;
  let gotAnswerFinal = false;
  let gotStop = false;
  const parser = createSseParser(({ name, data }) => {
    if (completed) return;
    if (name === "message" && data.trim() === "[DONE]") {
      completed = true;
      return;
    }
    // Ignore SSE extensions; only parse this endpoint's known JSON events.
    // answer_final is authoritative post-generation text for the live interview UI.
    if (!["message", "error", "generation", "admission", "analysis", "context", "retrieval_only", "answer_final"].includes(name)) return;
    let payload;
    try { payload = JSON.parse(data); } catch { throw streamFailure("invalid stream payload"); }
    if (!payload || typeof payload !== "object") throw streamFailure("invalid stream payload");
    // Only treat explicit error events as failures — generation/context payloads must not trip on stray keys.
    if (name === "error") {
      // Soft-fail when answer_final already locked — never discard a completed stream.
      onEvent(name, payload);
      if (!gotAnswerFinal) {
        throw streamFailure(payload.error || payload.message || "stream error");
      }
      completed = true;
      return;
    }
    if (name === "generation") {
      generation = payload;
      onEvent(name, payload);
      // Never abort on finish_reason (length/max_tokens/etc). The UI keeps streamed text.
      // isIncompleteGeneration retained only for offline asserts / callers that inspect generation.
      void isIncompleteGeneration;
      if (payload.finish_reason) gotStop = true;
      return;
    }
    if (name === "answer_final") {
      gotAnswerFinal = true;
      onEvent(name, payload);
      return;
    }
    if (name === "message" && payload.text !== undefined) {
      if (typeof payload.text !== "string") throw streamFailure("invalid stream payload");
      if (payload.text) onText(payload.text);
    } else {
      onEvent(name, payload);
    }
  });
  try {
    while (!completed) {
      const { value, done } = await reader.read();
      if (done) {
        ended = true;
        parser.push(decoder.decode(), true);
        break;
      }
      parser.push(decoder.decode(value, { stream: true }));
    }
    // V2 may close after answer_final + stop without a delivered [DONE] under some proxies.
    if (!completed && !(gotAnswerFinal || gotStop)) throw streamFailure("incomplete generation");
    completed = true;
    return { generation, gotAnswerFinal };
  } finally {
    if (!ended) {
      try { await reader.cancel(); } catch { /* preserve the original failure */ }
    }
    reader.releaseLock();
  }
}

module.exports = { createSseParser, consumeChatStream };
