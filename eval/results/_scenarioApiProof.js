/**
 * Live API proof for scenario answer-bank routing (typed interview path).
 * Usage: node eval/results/_scenarioApiProof.js
 */
const assert = require("node:assert/strict");
const { loadBank, resetAnswerBankCacheForTests } = require("../../lib/answerBank.js");

const BASE = process.env.EVAL_APP_BASE_URL || "http://127.0.0.1:3102";

async function ask(question) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: question,
      question,
      history: [],
      source: "typed",
      interviewSessionId: `scenario_proof_${Date.now()}`
    })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  const chunks = [];
  for (const line of text.split(/\n/)) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed === "string") chunks.push(parsed);
      else if (parsed?.content) chunks.push(parsed.content);
      else if (parsed?.delta) chunks.push(parsed.delta);
      else if (parsed?.text) chunks.push(parsed.text);
    } catch {
      chunks.push(payload);
    }
  }
  return { status: res.status, answer: chunks.join(""), raw: text.slice(0, 500) };
}

async function main() {
  resetAnswerBankCacheForTests();
  const bank = loadBank();
  const cases = [
    ["Tell me about a difficult GRC issue you resolved", "SAPSCN-001"],
    ["How did you handle an MSMP request with no approver", "SAPSCN-005"],
    ["What is a connector in SAP GRC Access Control?", "SAPSUP-001"],
    ["How do you troubleshoot an access request stuck in MSMP?", "SAPSC-042"]
  ];
  const results = [];
  for (const [question, id] of cases) {
    const entry = bank.questions.find((row) => row.id === id);
    assert.ok(entry, id);
    const live = await ask(question);
    const ok = live.answer.includes(entry.answer.slice(0, 80));
    results.push({ id, question: question.slice(0, 60), ok, answerLen: live.answer.length, preview: live.answer.slice(0, 100) });
    assert.equal(ok, true, `API answer mismatch for ${id}: ${live.preview || live.raw}`);
  }
  // Negative: HDMI must not return connector bank text.
  const neg = await ask("What is an HDMI connector on a monitor?");
  assert.equal(neg.answer.includes("SAP GRC Access Control connector"), false);
  console.log(JSON.stringify({ base: BASE, results, negativeOk: true }, null, 2));
  console.log("scenarioApiProof: PASS");
}

main().catch((error) => {
  console.error("scenarioApiProof: FAIL", error);
  process.exit(1);
});
