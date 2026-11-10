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

// PROFILE_FACTS is the authoritative certification/years source. Other surfaces must not
// contradict confirmed years/PMP; they are not required to restate ITIL on every UI string.
for (const [name, text] of Object.entries(surfaces)) {
  assert.doesNotMatch(text, /15\+\s*years/i, `${name} still says 15+ years`);
  assert.doesNotMatch(text, /10\+\s*years/i, `${name} still says 10+ years`);
  assert.match(text, /17\+ years of overall IT|17\+ years overall IT/, `${name} missing 17+ IT`);
  assert.match(text, /12\+\s*years.*(?:SAP GRC|GRC Access Control|SAP Security)/i, `${name} missing 12+ SAP`);
  assert.match(text, /PMP/, `${name} missing PMP`);
}
assert.match(PROFILE_FACTS, /ITIL V4 Foundation/i, "PROFILE_FACTS must retain confirmed ITIL V4 Foundation");
assert.match(PROFILE_FACTS, /PMP/, "PROFILE_FACTS must retain confirmed PMP");
assert.match(
  PROFILE_FACTS,
  /12\+\s*years\s+hands-on\s+enterprise\s+SAP Security\s*\/\s*GRC Access Control/,
  "PROFILE_FACTS must keep the confirmed SAP Security / GRC Access Control years wording"
);

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
  // Without an injected resume, years/certs appear via MASTER HANDS-ON BANK / profile baseline text.
  assert.match(prompt, /17\+ years(?: of)? overall IT/);
  assert.match(prompt, /12\+\s*years\s+(?:hands-on\s+enterprise\s+)?(?:SAP Security|enterprise SAP Security).*GRC|12\+\s*years enterprise SAP Security\/GRC/i);
  assert.match(prompt, /PMP/);
  assert.match(prompt, /ITIL V4 Foundation/i);
  assert.doesNotMatch(prompt, /15\+\s*years|10\+\s*years/i);

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
