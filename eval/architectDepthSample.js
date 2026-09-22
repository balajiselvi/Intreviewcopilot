/**
 * Live architect-depth sample. Diagnostic only; not a rule source.
 */
const { resolveInterviewContext } = require("../lib/interviewContext");
const { generateAnswer } = require("./lib/generateAnswer");
const { DEFAULT_CAREER_BACKGROUND } = require("./lib/careerTimeline");

const TARGET_JOB_DESCRIPTION = "Chalhoub Group — Lead, Identity Security & Access Management. SAP S/4HANA IAM/Security workstream. Do not invent Chalhoub experience.";

const CASES = [
  { id: "CON-SOD", q: "What is SoD?" },
  { id: "ARC-ROLE", q: "How do you approach SAP S/4HANA role design from scratch?" },
  { id: "IMP-DERIVED", q: "Take me through creating a derived role for a new company code in PFCG." },
  { id: "CMP-ROLES", q: "When would you use composite roles versus single and derived roles?" },
  { id: "ARC-PLANES", q: "How should identity boundaries sit between IAS, IPS and IAG?" },
  { id: "LIVE-DT", q: "What will be your approach when a customer says that he faces a lot of problem with others and at downtime for the business uses?" },
  { id: "CTRL-PMP", q: "A vendor delay is affecting the cutover plan. What would you do?" }
];

function flags(answer) {
  const a = String(answer || "");
  const words = a.trim() ? a.trim().split(/\s+/).length : 0;
  const sentences = a.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentence = sentences.length
    ? Math.round(sentences.reduce((n, s) => n + s.split(/\s+/).length, 0) / sentences.length)
    : 0;
  return {
    words,
    avgSentence,
    inventedProject: /\b(?:in a recent project|during a previous project|my last (?:role|programme|project))\b/i.test(a),
    compositeBan: /\b(?:avoid(?:ing)?|never use|do not use|forbidden|instead of)\b.{0,40}\bcomposite/i.test(a),
    su53AsUat: /\bSU53\b.{0,80}\b(?:UAT|validate the derived role|functioning as intended|user assignment test)\b/i.test(a),
    workshopOpen: /^(?:When approaching|I start by defining the business functions|gathering requirements)/i.test(a.trim()),
    genericIncident: /\b(?:incident response team|legacy system in parallel|rollback procedure to revert to a backup)\b/i.test(a),
    namedArtifact: /\b(?:AGR_USERS|AGR_1251|AGR_1252|SU24|PFCG|PFUD|SUIM|AUTHORITY-CHECK|SAML|OIDC|MSMP|RSECADMIN|XSUAA|Firefighter|EAM|ARA|ruleset)\b/.test(a),
    genericCloser: /\b(?:improves compliance|enhances governance|enterprise security policies|that's the architectural pattern|robust and efficient)\b/i.test(a)
  };
}

(async () => {
  for (const c of CASES) {
    const ctx = resolveInterviewContext({ questionRaw: c.q, history: [] });
    let answer = "";
    let err = "";
    let latencyMs = 0;
    try {
      const result = await generateAnswer(c.q, {
        candidateResume: DEFAULT_CAREER_BACKGROUND,
        jobDescription: TARGET_JOB_DESCRIPTION
      });
      answer = result.answer;
      latencyMs = result.latencyMs;
    } catch (error) {
      err = error && error.message ? error.message : String(error);
    }
    console.log(`\n=== ${c.id}`);
    console.log(`Q: ${c.q}`);
    console.log(`route: intent=${ctx.questionIntent} scope=${ctx.answerScope} depth=${ctx.depth} topic=${ctx.questionTopic}`);
    if (err) {
      console.log(`GENERATION_FAILED ${err}`);
      continue;
    }
    console.log(`flags: ${JSON.stringify(flags(answer))} latency=${latencyMs}`);
    console.log(answer);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
