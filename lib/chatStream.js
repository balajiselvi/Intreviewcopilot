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
  const parser = createSseParser(({ name, data }) => {
    if (completed) return;
    if (name === "message" && data.trim() === "[DONE]") {
      completed = true;
      return;
    }
    // Ignore SSE extensions; only parse this endpoint's known JSON events.
    if (!["message", "error", "generation", "admission", "analysis", "context", "retrieval_only"].includes(name)) return;
    let payload;
    try { payload = JSON.parse(data); } catch { throw streamFailure("invalid stream payload"); }
    if (!payload || typeof payload !== "object") throw streamFailure("invalid stream payload");
    if (name === "error" || payload.error) throw streamFailure(payload.error || "stream error");
    if (name === "generation") {
      generation = payload;
      onEvent(name, payload);
      if (isIncompleteGeneration(payload.finish_reason)) throw streamFailure("incomplete generation");
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
    if (!completed) throw streamFailure("incomplete generation");
    return { generation };
  } finally {
    if (!ended) {
      try { await reader.cancel(); } catch { /* preserve the original failure */ }
    }
    reader.releaseLock();
  }
}

module.exports = { createSseParser, consumeChatStream };
