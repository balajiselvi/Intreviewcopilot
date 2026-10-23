process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const { generateAnswer } = require("../lib/generateAnswer");

const cases = [
  {
    id: "low-relevance-obscure",
    question: "How would you design a quantum-resistant HANA key rotation policy for obsolete NetWeaver 7.0 dual-stack PI adapters?"
  },
  {
    id: "fiori-onprem",
    question: "If the server is on premise, how do you troubleshoot a user who cannot access a Fiori app?"
  },
  {
    id: "su24-custom-tx",
    question: "How do you handle custom transaction SU24 authorization proposal updates?"
  },
  {
    id: "star-challenge",
    question: "What challenges did you face during go-live for GRC Access Control?"
  }
];

const LEAK = /LOW-RELEVANCE RETRIEVAL FALLBACK|INTERNAL RETRIEVAL NOTE|BEHAVIORAL STAR MODE|SUPPORTING KNOWLEDGE/i;
const STUB = /If the server is on premise,\s*I would follow the ABAP Fiori path/i;
const FLUFF = /I held workshops|I communicated with stakeholders|I aligned the teams/i;

(async () => {
  const report = [];
  for (const c of cases) {
    const result = await generateAnswer(c.question);
    const answer = String(result.answer || "");
    const row = {
      id: c.id,
      latencyMs: result.latencyMs,
      words: answer.split(/\s+/).filter(Boolean).length,
      hasLeak: LEAK.test(answer),
      hasStub: STUB.test(answer),
      hasFluff: FLUFF.test(answer),
      hasFourBullets: /\*\*Decision:\*\*|\*\*Situation:\*\*/.test(answer),
      preview: answer.replace(/\s+/g, " ").slice(0, 420)
    };
    report.push(row);
    console.log(`\n=== ${c.id} ===`);
    console.log(JSON.stringify({
      latencyMs: row.latencyMs,
      words: row.words,
      hasLeak: row.hasLeak,
      hasStub: row.hasStub,
      hasFluff: row.hasFluff,
      hasFourBullets: row.hasFourBullets
    }));
    console.log(row.preview);
  }
  const fail = report.some((r) => r.hasLeak || r.hasStub);
  console.log(`\nSMOKE ${fail ? "FAIL" : "PASS"} — leak/stub gate`);
  process.exit(fail ? 1 : 0);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
