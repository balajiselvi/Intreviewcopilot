process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const { generateAnswer } = require("../lib/generateAnswer");

const EMPLOYER = /\b(?:Dover(?:\s+Corporation)?|Eminnov|Fabtech|Enerlife|Ascent Staffing)\b/i;
const FLUFF = /aligned with security best practices|I held workshops|I communicated with stakeholders/i;
const ARTIFACT = /\b(?:ARA|BRF\+?|MSMP|PFCG|SU25|SU24|Activate|SoD|ITGC|SOX)\b/i;

async function run(id, question, checks) {
  const result = await generateAnswer(question);
  const answer = String(result.answer || "");
  const row = { id, latencyMs: result.latencyMs, words: answer.split(/\s+/).filter(Boolean).length, preview: answer.replace(/\s+/g, " ").slice(0, 500) };
  const failures = [];
  for (const [name, fn] of Object.entries(checks)) {
    if (!fn(answer)) failures.push(name);
  }
  console.log(`\n=== ${id} ===`);
  console.log(JSON.stringify({ ...row, failures }, null, 2));
  console.log(answer);
  return failures.length === 0;
}

(async () => {
  const a = await run(
    "star-go-live",
    "What challenges did you face during go-live for GRC Access Control?",
    {
      noEmployer: (t) => !EMPLOYER.test(t),
      noFluff: (t) => !FLUFF.test(t),
      hasArtifact: (t) => ARTIFACT.test(t)
    }
  );
  const b = await run(
    "process-control-honesty",
    "Do you have experience with SAP GRC Process Control?",
    {
      frankBasic: (t) => /basic|conceptual|not (?:a |my )?deliver|limited|awareness|Access Control/i.test(t),
      noFakeDelivery: (t) => !/\bI (?:implemented|led|delivered|configured) (?:SAP )?GRC Process Control\b/i.test(t)
        && !/\bat Dover.{0,40}Process Control\b/i.test(t)
    }
  );
  const c = await run(
    "certs",
    "Are you PMP and ITIL certified?",
    {
      pmp: (t) => /\bPMP\b/i.test(t),
      itil: (t) => /\bITIL\b/i.test(t)
    }
  );
  const pass = a && b && c;
  console.log(`\nPROFILE AUTHORITY ${pass ? "PASS" : "FAIL"}`);
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
