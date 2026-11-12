/**
 * Mock interview probe: three senior questions against live /api/chat.
 * node eval/results/_mockInterviewThree.js
 */
const BASE = process.env.EVAL_APP_BASE_URL || "http://127.0.0.1:3102";

const QUESTIONS = [
  {
    id: "role-redesign",
    expect: /task-based|role explosion|composite|BRM|executive|org level/i,
    q: "A client has 10 business regions and 10 functional roles, but each region requires a slightly different mix of transactions. How do you design an efficient role architecture and present it to executive leadership?"
  },
  {
    id: "msmp-stuck",
    expect: /MSMP|GRFNMW|BRF|In Process|reassign|audit/i,
    q: "How do you handle a scenario where a critical ARM access request is stuck in 'In Process' status in MSMP, and how do you trace and unblock it without breaking audit trails?"
  },
  {
    id: "principal-propagation",
    expect: /Principal Propagation|Cloud Connector|X\.509|CERTRULE|Destination|XSUAA|IAS/i,
    q: "How do you configure Principal Propagation from a custom CAP/RAP app on SAP BTP through Cloud Connector to an S/4HANA backend, and how do you validate the X.509 certificate mapping?"
  }
];

async function ask(question) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: question,
      question,
      history: [],
      source: "typed",
      interviewSessionId: `mock3_${Date.now()}`
    })
  });
  const text = await res.text();
  const ms = Date.now() - started;
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
  return { status: res.status, ms, answer: chunks.join(""), rawHead: text.slice(0, 200) };
}

async function main() {
  const results = [];
  for (const item of QUESTIONS) {
    const live = await ask(item.q);
    const okHttp = live.status === 200 && live.answer.length > 80;
    const okContent = item.expect.test(live.answer);
    results.push({
      id: item.id,
      latencyMs: live.ms,
      http: live.status,
      answerLen: live.answer.length,
      contentHit: okContent,
      pass: okHttp && okContent,
      preview: live.answer.slice(0, 220).replace(/\s+/g, " ")
    });
  }
  const allPass = results.every((r) => r.pass);
  console.log(JSON.stringify({ base: BASE, allPass, results }, null, 2));
  if (!allPass) process.exit(1);
  console.log("mockInterviewThree: PASS");
}

main().catch((error) => {
  console.error("mockInterviewThree: FAIL", error);
  process.exit(1);
});
