const assert = require("assert");

const sample = 'data: {"text":"Hello"}\r\n\r\nevent: generation\r\ndata: {"finish_reason":"stop"}\r\n\r\ndata: [DONE]\r\n\r\n';

function oldParse(buf) {
  let streamed = "";
  const events = buf.split("\n\n");
  events.pop();
  for (const event of events) {
    if (event.includes("event: generation")) continue;
    const payload = event.split("data: ")[1];
    if (!payload || payload === "[DONE]") continue;
    try {
      streamed += JSON.parse(payload).text || "";
    } catch {
      // old client dropped CRLF payloads
    }
  }
  return streamed;
}

function newParse(buf) {
  let streamed = "";
  const buffer = buf.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const events = buffer.split("\n\n");
  events.pop();
  for (const event of events) {
    const eventName = (/^event:\s*(.+)$/m.exec(event) || [])[1]?.trim() || "message";
    if (eventName === "generation") continue;
    for (const line of event.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        streamed += JSON.parse(payload).text || "";
      } catch {
        // ignore malformed chunk
      }
    }
  }
  return streamed;
}

assert.strictEqual(oldParse(sample), "");
assert.strictEqual(newParse(sample), "Hello");
console.log("sseCrlfParseProbe: PASS");
