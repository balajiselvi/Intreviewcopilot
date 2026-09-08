const { APP_BASE_URL } = require("./env");

// Calls the LIVE production endpoint exactly as a real interview session would —
// single-pass, streaming, no critic/improve loop. This is deliberate: the point
// of this stage is to capture what actually ships, not an idealized answer.
async function generateAnswer(question, { model = "gpt-4o-mini", candidateResume, jobDescription, history } = {}) {
  const start = Date.now();
  const body = { model, question };
  if (candidateResume) body.candidateResume = candidateResume;
  if (jobDescription) body.jobDescription = jobDescription;
  if (history) body.history = history;
  const res = await fetch(`${APP_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let errorMsg = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data: ")) continue;
      const payload = l.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const obj = JSON.parse(payload);
        if (obj.text) answer += obj.text;
        if (obj.error) errorMsg = obj.error;
      } catch (e) {
        // ignore malformed SSE fragments
      }
    }
  }

  if (errorMsg) throw new Error(`Generator error: ${errorMsg}`);
  return { answer: answer.trim(), latencyMs: Date.now() - start };
}

module.exports = { generateAnswer };
