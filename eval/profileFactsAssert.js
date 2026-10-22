const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PROFILE_FACTS } = require("./lib/careerTimeline");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const root = path.join(__dirname, "..");
const profiler = fs.readFileSync(path.join(root, "lib/interviewerProfiler.js"), "utf8");
const settings = fs.readFileSync(path.join(root, "components/SettingsDialog.js"), "utf8");
const surfaces = {
  profile: PROFILE_FACTS,
  background: CANDIDATE_BACKGROUND,
  profiler,
  settings
};

for (const [name, text] of Object.entries(surfaces)) {
  assert.doesNotMatch(text, /15\+\s*years/i, `${name} still says 15+ years`);
  assert.doesNotMatch(text, /10\+\s*years/i, `${name} still says 10+ years`);
  assert.doesNotMatch(text, /ITIL/i, `${name} still claims ITIL`);
  assert.match(text, /17\+ years of overall IT|17\+ years overall IT/, `${name} missing 17+ IT`);
  assert.match(text, /12\+ years of SAP GRC|12\+ years SAP GRC/, `${name} missing 12+ SAP`);
  assert.match(text, /PMP/, `${name} missing PMP`);
}

(async () => {
  const { register } = require("node:module");
  const { pathToFileURL } = require("node:url");
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const { buildSapInterviewPrompt } = await import("../lib/prompt/interviewPrompt.js");
  const prompt = buildSapInterviewPrompt({
    question: "How many years of experience do you have, and are you PMP certified?",
    analysis: { category: "General", secondaryCategories: [] },
    responseLength: "medium"
  });
  assert.match(prompt, /17\+ years of overall IT experience/);
  assert.match(prompt, /12 years of SAP GRC Security|more than 12 years of SAP GRC Security/);
  assert.match(prompt, /PMP/);
  assert.doesNotMatch(prompt, /15\+\s*years|10\+\s*years|ITIL/i);

  const concise = buildSapInterviewPrompt({
    question: "How would you decide which security risk to accept when the test window is full?",
    analysis: { category: "Implementation", secondaryCategories: [] },
    responseLength: "concise"
  });
  const lengthy = buildSapInterviewPrompt({
    question: "How would you decide which security risk to accept when the test window is full?",
    analysis: { category: "Implementation", secondaryCategories: [] },
    responseLength: "lengthy"
  });
  assert.match(concise, /Selected response length is concise/);
  assert.match(concise, /45-90/);
  assert.doesNotMatch(concise, /Prefer about 60 to 120/);
  assert.match(lengthy, /Selected response length is lengthy/);
  assert.match(lengthy, /220-360/);
  assert.doesNotMatch(concise, /### 1\. Direct Answer/);
  assert.doesNotMatch(lengthy, /Validation and Operational Boundary heading/);
  console.log("profileFactsAssert: PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
