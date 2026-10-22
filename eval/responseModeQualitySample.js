/**
 * Live quality sample for unseen paraphrases. Local diagnostic; not a rule source.
 */
const { resolveInterviewContext } = require("../lib/interviewContext");
const { generateAnswer } = require("./lib/generateAnswer");

const CASES = [
  ["CONCEPT", "What exactly is SoD?"],
  ["TROUBLESHOOT", "How would you troubleshoot a Fiori tile?"],
  ["IMPLEMENT", "How would you stand up a new IPS source system for SuccessFactors?"],
  ["ARCHITECTURE", "How should identity boundaries sit between IAS, IPS and IAG?"],
  ["EXPERIENCE_CONFIRM", "Have you actually implemented IAG access analysis?"],
  ["PMP", "The steering committee wants to cut two weeks off hypercare. How do you handle that?"]
];

function flags(answer) {
  const a = String(answer || "");
  return {
    words: a.trim() ? a.trim().split(/\s+/).length : 0,
    firstPersonPast: /\bI (?:implemented|configured|delivered|led|owned|built)\b/i.test(a),
    employerish: /\b(?:at |with )?(?:Accenture|Chalhoub|client|my last programme)\b/i.test(a),
    methodology: /\bI would\b|\bMy approach would be\b/i.test(a),
    fioriDesignerFirst: /launchpad designer/i.test(a) && !/app manager|content manager|FLPAM|FLPCM/i.test(a),
    identityPlanes: /IAS/.test(a) && /IPS/.test(a) && /IAG/.test(a)
  };
}

(async () => {
  for (const [mode, question] of CASES) {
    const ctx = resolveInterviewContext({ questionRaw: question });
    let answer = "";
    let err = "";
    try {
      const result = await generateAnswer(question, { history: [] });
      answer = result.answer;
    } catch (error) {
      err = error && error.message ? error.message : String(error);
    }
    const f = flags(answer);
    console.log(`\n=== ${mode}`);
    console.log(`Q: ${question}`);
    console.log(`route: intent=${ctx.questionIntent} scope=${ctx.answerScope} depth=${ctx.depth} topic=${ctx.questionTopic} scenario=${ctx.scenarioMode}/${ctx.step || "-"}`);
    if (err) {
      console.log(`GENERATION_FAILED ${err}`);
      continue;
    }
    console.log(`flags: ${JSON.stringify(f)}`);
    console.log(answer.slice(0, 700));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
