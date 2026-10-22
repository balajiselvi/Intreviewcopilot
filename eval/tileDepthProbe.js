/**
 * Narrow live probe for the Fiori tile walkthrough: does the answer use the current launchpad
 * content model, or fall back to the deprecated designer? Local diagnostic harness.
 */
const { generateAnswer } = require("./lib/generateAnswer");
const { resolveInterviewContext } = require("../lib/interviewContext");

const QUESTIONS = [
  "I have given you a requirement to add a tile. How are you going to do that?",
  "How would you add a Fiori tile?",
  "Walk me through configuring a new tile.",
  "How would you configure the catalog and target mapping?"
];

const MARKERS = [
  ["app manager / FLPAM", /app manager|FLPAM/i],
  ["content manager / FLPCM", /content manager|FLPCM/i],
  ["spaces and pages", /spaces?\b.{0,12}pages?/i],
  ["semantic object + action", /semantic object/i],
  ["target mapping", /target mapping/i],
  ["OData activation", /IWFND|gateway service|activate.{0,24}service/i],
  ["PFCG role", /PFCG/i],
  ["transport", /transport|change management/i],
  ["trace", /STAUTHTRACE|SU53|trace/i],
  ["release qualified", /depend\w*\s+on\s+(?:the\s+)?(?:S\/?4|release|version)|older releases?|from S\/?4HANA \d{4}|deprecated/i],
  ["LEGACY-FIRST designer", /^(?:(?!app manager|content manager).){0,600}launchpad designer/is]
];

(async () => {
  for (const questionRaw of QUESTIONS) {
    const ctx = resolveInterviewContext({ questionRaw });
    try {
      const { answer } = await generateAnswer(questionRaw, { history: [] });
      const hits = MARKERS.filter(([, re]) => re.test(answer)).map(([name]) => name);
      console.log(`\n--- ${questionRaw}`);
      console.log(`scope=${ctx.answerScope} words=${answer.trim().split(/\s+/).length}`);
      console.log(`present: ${hits.join(", ")}`);
      console.log(answer);
    } catch (error) {
      console.log(`\n--- ${questionRaw}\nGENERATION_FAILED ${error && error.message}`);
    }
  }
})();
