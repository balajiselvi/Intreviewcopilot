const fs = require("fs");
const path = require("path");
const { resolveInterviewContext } = require("../lib/interviewContext");
const { generateAnswer } = require("./lib/generateAnswer");
const { DEFAULT_CAREER_BACKGROUND } = require("./lib/careerTimeline");
const TARGET_JOB_DESCRIPTION = "Chalhoub Group — Lead, Identity Security & Access Management. SAP S/4HANA IAM/Security workstream. Do not invent Chalhoub experience.";

const CASES = [
  { id: "CON", q: "What is SoD?" },
  { id: "EXP", q: "Have you implemented SoD analysis in GRC ARA?" },
  { id: "IMP", q: "Take me through creating a derived role for a new company code in PFCG." },
  { id: "TS", q: "A user gets an authorization error after FB01. How would you investigate?" },
  { id: "ARC", q: "How do you approach SAP S/4HANA role design from scratch?" },
  { id: "PMP", q: "A vendor delay is affecting the cutover plan. What would you do?" },
  { id: "SU53", q: "What is SU53 used for?" },
  { id: "COMP", q: "When would you use composite roles versus single and derived roles?" }
];

function lastSentence(text) {
  const t = String(text || "").trim();
  return t.slice(Math.max(0, t.length - 220));
}

function incomplete(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  return !/[.!?]"?$/.test(t) || /(?:the|a|an|to|of|and|or|for|with|by|in|on)$/i.test(t.split(/\s+/).slice(-1)[0]);
}

(async () => {
  const rows = [];
  for (const c of CASES) {
    const ctx = resolveInterviewContext({ questionRaw: c.q, history: [] });
    let gen = { answer: "", latencyMs: 0, error: null };
    try {
      gen = await generateAnswer(c.q, { candidateResume: DEFAULT_CAREER_BACKGROUND, jobDescription: TARGET_JOB_DESCRIPTION });
    } catch (error) {
      gen.error = error.message;
    }
    const answer = gen.answer || "";
    rows.push({
      id: c.id,
      q: c.q,
      intent: ctx.questionIntent,
      scope: ctx.answerScope,
      topic: ctx.questionTopic,
      depth: ctx.depth,
      words: answer.trim().split(/\s+/).filter(Boolean).length,
      incomplete: incomplete(answer),
      error: gen.error || null,
      latencyMs: gen.latencyMs,
      tail: lastSentence(answer),
      answer
    });
    console.log([
      c.id,
      ctx.answerScope,
      ctx.questionIntent,
      `w=${answer.trim().split(/\s+/).filter(Boolean).length}`,
      incomplete(answer) ? "INCOMPLETE" : "complete",
      gen.error || ""
    ].join(" | "));
  }
  const out = path.join(__dirname, "results", "quality-probe.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  console.log("wrote", out);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
