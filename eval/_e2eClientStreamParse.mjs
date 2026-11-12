/**
 * E2E: POST /api/chat with the exact browser body shape, parse with consumeChatStream,
 * assert no interrupt/recovered strings and first-person voice.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { consumeChatStream } = require("../lib/chatStream.js");

const BAN = /Generation was interrupted|Answer incomplete|recovered/i;
const QUESTION = "What are the main components of SAP BTP?";

async function main() {
  const base = process.env.E2E_BASE || "http://127.0.0.1:3000";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      question: QUESTION,
      history: [],
      responseLength: "medium",
      interviewSessionId: `e2e_${Date.now()}`
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  let streamed = "";
  let answerFinal = "";
  let meta = {};
  const result = await consumeChatStream(res, {
    onText(chunk) {
      streamed += chunk;
    },
    onEvent(name, payload) {
      if (name === "answer_final") answerFinal = String(payload?.text || "");
      if (name === "generation" || name === "context") meta = { ...meta, ...payload };
    }
  });

  const finalText = String(answerFinal || streamed || "").trim();
  const preview = finalText.slice(0, 300);
  const report = {
    chars: finalText.length,
    streamedChars: streamed.length,
    gotAnswerFinal: Boolean(result?.gotAnswerFinal),
    engine: meta.engine || null,
    model: meta.model || null,
    banned: BAN.test(finalText),
    iHits: (finalText.match(/\bI\b/g) || []).length,
    weHits: (finalText.match(/\bwe\b/gi) || []).length,
    preview
  };
  console.log(JSON.stringify(report, null, 2));

  if (finalText.length <= 500) throw new Error(`answer too short: ${finalText.length}`);
  if (BAN.test(finalText)) throw new Error("banned interrupt/recovered text present");
  if (report.iHits + report.weHits < 1) throw new Error("missing first-person voice");
  console.log("E2E PASS");
}

main().catch((err) => {
  console.error("E2E FAIL:", err?.message || err);
  process.exitCode = 1;
});
