/**
 * Live operator probe against a running dev server.
 * node eval/liveOperatorProbe.js
 */
const tests = [
  ["good-morning", { question: "Good morning." }, { decision: "IGNORE", maxGen: 0 }],
  ["profile", { question: "Run us through your profile and presales experience." }, { decision: "ANSWER", route: "PREPARED_SCRIPT", scriptId: "about-yourself", maxGen: 0, ban: /\b17\b/ }],
  ["pfcg", { question: "What exactly is PFCG?" }, { decision: "ANSWER", route: "GENERATION", minGen: 1, maxGen: 1 }],
  ["fabtech", { question: "Tell me about your Fabtech experience." }, { decision: "ANSWER", route: "GENERATION", evidenceMode: "programme", maxGen: 1, ban: /8,700|15-month|team of 8/ }],
  ["grc", { question: "What was your GRC experience?" }, { decision: "ANSWER", route: "GENERATION", evidenceMode: "domain", maxGen: 1 }],
  ["time", { question: "time, time, time." }, { decision: "IGNORE", maxGen: 0 }],
  ["why-alone", { question: "Why?" }, { decision: "DEFER", maxGen: 0 }],
  ["why-context", { question: "Why?", history: [{ role: "user", content: "How does ARM approval work?" }] }, { decision: "ANSWER", maxGen: 1 }],
  ["demo-garbage", { question: "Have you statistical or any session demo case?" }, { decision: "DEFER", maxGen: 0 }]
];

function texts(raw) {
  return [...raw.matchAll(/data: (\{.*\})/g)].map((match) => {
    try {
      return JSON.parse(match[1]).text || "";
    } catch (error) {
      return "";
    }
  }).join("");
}

async function main() {
  let failed = 0;
  for (const [name, body, expect] of tests) {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", history: [], ...body })
    });
    const raw = await response.text();
    const admissionMatch = raw.match(/event: admission\ndata: (\{.*\})/);
    const admission = admissionMatch ? JSON.parse(admissionMatch[1]) : {};
    const gen = (raw.match(/event: generation/g) || []).length;
    const spoken = texts(raw).replace(/\s+/g, " ").trim();
    const problems = [];
    if (admission.decision !== expect.decision) problems.push(`decision ${admission.decision}`);
    if (expect.route && admission.route !== expect.route) problems.push(`route ${admission.route}`);
    if (expect.scriptId && admission.scriptId !== expect.scriptId) problems.push(`script ${admission.scriptId}`);
    if (expect.evidenceMode && admission.evidenceMode !== expect.evidenceMode) problems.push(`evidence ${admission.evidenceMode}`);
    if (expect.maxGen != null && gen > expect.maxGen) problems.push(`gen ${gen}`);
    if (expect.minGen != null && gen < expect.minGen) problems.push(`gen ${gen}`);
    if (expect.ban && expect.ban.test(spoken)) problems.push("banned text");
    if (problems.length) failed += 1;
    console.log(`${problems.length ? "FAIL" : "PASS"} ${name} gen=${gen} ${JSON.stringify(admission)}`);
    if (spoken) console.log(spoken.slice(0, 240));
    if (problems.length) console.log(problems.join("; "));
  }
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
