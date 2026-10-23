process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3102";
const { generateAnswer } = require("../lib/generateAnswer");

const FAKE_EMPLOYER = /\b(?:Dover(?:\s+Corporation)?|Eminnov|Fabtech|Enerlife|Ascent Staffing|Nabati)\b/i;
const FLUFF = /aligned with security best practices|I held workshops|I communicated with stakeholders|I aligned the teams/i;
const ARTIFACT = /\b(?:ARA|BRF\+?|MSMP|PFCG|SU25|SU24|Activate|Quality Gate|SoD|ITGC|SOX|IPS|IAG)\b/i;

(async () => {
  const question = "What challenges did you face during go-live for GRC Access Control?";
  const result = await generateAnswer(question);
  const answer = String(result.answer || "");
  const row = {
    latencyMs: result.latencyMs,
    words: answer.split(/\s+/).filter(Boolean).length,
    hasEmployer: FAKE_EMPLOYER.test(answer),
    hasFluff: FLUFF.test(answer),
    hasArtifact: ARTIFACT.test(answer),
    hasStar: /\*\*Situation:\*\*|Situation:/i.test(answer),
    preview: answer.replace(/\s+/g, " ").slice(0, 600)
  };
  console.log(JSON.stringify(row, null, 2));
  console.log("\n--- answer ---\n" + answer);
  const fail = row.hasEmployer || row.hasFluff || !row.hasArtifact;
  console.log(`\nSTAR GROUNDING ${fail ? "FAIL" : "PASS"}`);
  process.exit(fail ? 1 : 0);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
