const fs = require("fs");
const path = require("path");
const { generateAnswer } = require("./lib/generateAnswer");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const JD = `Head of Global SAP IT Security & Compliance. Landscape: S/4, SuccessFactors, BW/4, SAC, Datasphere, Ariba, CAR, BTP, RISE. Planes: SF=HR attributes; IAS=authn; IPS=provisioning; IAG=governance; app=enforcement.`;

const questions = [
  "Design an enterprise SAP role model.",
  "How do IAS, IPS and IAG work together?",
  "Explain a mover process after an employee changes division.",
  "How would you rationalize 5,000 SAP roles?",
  "How would you identify duplicate or excessive access in 50,000 user-role assignments?",
  "How would you design an SoD ruleset?",
  "How would you remediate an SoD violation?",
  "Explain IAG versus GRC coexistence.",
  "How does SuccessFactors drive SAP access?",
  "How would you design a RISE hybrid IAM architecture?",
  "How would you handle access issues during hypercare?",
  "How would you explain a security risk to a business stakeholder?",
  "How would you integrate SAP IAM with a non-SAP application?",
  "Explain SAC versus Datasphere security.",
  "Tell me about a difficult SAP security problem you personally solved."
];

(async () => {
  const out = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const r = await generateAnswer(q, {
      candidateResume: CANDIDATE_BACKGROUND,
      jobDescription: JD
    });
    out.push({ n: i + 1, q, latencyMs: r.latencyMs, answer: r.answer });
    console.log("\n========== Q" + (i + 1) + " (" + r.latencyMs + "ms) ==========\nQ: " + q + "\n\n" + r.answer + "\n");
  }
  const dest = path.join(process.env.TEMP || "C:/Temp", "interviewer-sim-15.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log("WROTE " + dest);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
