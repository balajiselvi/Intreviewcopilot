const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  extractTimeline,
  isNewScenario,
  timelinePromptForTurn,
  nextScenarioTimeline,
  unspecifiedTimelinePolicy,
  isContextOnlyTimeline
} = require("../lib/scenarioTimeline");
const { readScenarioTimeline, writeScenarioTimeline, DATA_DIR } = require("../lib/interviewSessionStore");

const establishedAnswer = [
  "This is an illustrative nine-month greenfield implementation, not a personal project.",
  "Months 1-2: discovery, planning and solution design.",
  "Months 3-5: configuration, build and integration.",
  "Months 6-7: testing, remediation and readiness.",
  "Month 8: cutover rehearsals and go-live preparation.",
  "Month 9: deployment, hypercare and transition."
].join("\n");

const extracted = extractTimeline(establishedAnswer);
assert.strictEqual(extracted.durationMonths, 9);
assert.strictEqual(extracted.phases[2].start, 6);
assert.strictEqual(extracted.phases[2].end, 7);
assert.strictEqual(extracted.phases[3].start, 8);

const established = nextScenarioTimeline({ active: null, question: "Give me an illustrative nine-month greenfield timeline.", answer: establishedAnswer });
assert.strictEqual(established.action, "replace");
assert.strictEqual(established.timeline.source, "illustrative");

const testingQuestion = "When does security testing begin in that plan?";
const testingPrompt = timelinePromptForTurn({ active: established.timeline, question: testingQuestion });
assert.match(testingPrompt, /9 months/);
assert.match(testingPrompt, /Months 6-7: testing, remediation and readiness/);
assert.match(testingPrompt, /product constraint still wins/);
assert.doesNotMatch(testingPrompt, /12 months/);

const silentRewrite = nextScenarioTimeline({
  active: established.timeline,
  question: testingQuestion,
  answer: "In this twelve-month plan, security testing starts in month 10."
});
assert.strictEqual(silentRewrite.action, "keep");

const shortened = nextScenarioTimeline({
  active: established.timeline,
  question: "Reduce the programme from nine months to eight months.",
  answer: "Months 1-2: discovery, planning and solution design.\nMonth 8: deployment, hypercare and transition."
});
assert.strictEqual(shortened.timeline.durationMonths, 8);
assert.strictEqual(shortened.timeline.source, "approved-change");
assert.strictEqual(shortened.timeline.phases[0].start, 1);
assert.strictEqual(shortened.timeline.phases[0].end, 2);

const delayed = nextScenarioTimeline({
  active: established.timeline,
  question: "The cutover slips by two weeks. What moves?",
  answer: "The cutover, go-live, and hypercare move by two weeks."
});
assert.strictEqual(delayed.timeline.durationMonths, 9);
assert.strictEqual(delayed.timeline.phases[0].label.includes("discovery"), true);
assert.ok(delayed.timeline.delays.some((item) => /two weeks/i.test(item)));
const delayPrompt = timelinePromptForTurn({ active: delayed.timeline, question: "What happens to hypercare in that plan?" });
assert.match(delayPrompt, /Months 1-2: discovery/);
assert.match(delayPrompt, /two weeks/i);

const upgradeQuestion = "For a separate upgrade programme, what timeline would you use?";
assert.strictEqual(isNewScenario(upgradeQuestion, established.timeline), true);
const upgradePrompt = timelinePromptForTurn({ active: established.timeline, question: upgradeQuestion });
assert.match(upgradePrompt, /new scenario/i);
assert.doesNotMatch(upgradePrompt, /Months 1-2/);
const upgradeTurn = nextScenarioTimeline({
  active: established.timeline,
  question: upgradeQuestion,
  answer: "An upgrade schedule comes from the supported path and the approved plan."
});
assert.strictEqual(upgradeTurn.action, "clear");

const sessionA = `timelineA_${Date.now()}`;
const sessionB = `timelineB_${Date.now()}`;
assert.strictEqual(writeScenarioTimeline(sessionA, established.timeline).ok, true);
assert.strictEqual(readScenarioTimeline(sessionB), null);
const recovered = readScenarioTimeline(sessionA);
assert.strictEqual(recovered.durationMonths, 9);
const longHistoryPrompt = timelinePromptForTurn({
  active: recovered,
  question: "When does security testing begin in that plan?"
});
assert.match(longHistoryPrompt, /Months 6-7/);

const candidate = nextScenarioTimeline({
  active: null,
  question: "Assume our plan is nine months.",
  answer: establishedAnswer
});
assert.strictEqual(candidate.timeline.source, "candidate");
const ignored = nextScenarioTimeline({
  active: candidate.timeline,
  question: "When is cutover in that plan?",
  answer: "Use a twelve-month timeline and put cutover in month 11."
});
assert.strictEqual(ignored.action, "keep");

const contextOnly = "We have a nine-month greenfield implementation, with security testing in Months 6-7 and go-live preparation in Month 8.";
const captured = nextScenarioTimeline({ active: null, question: contextOnly, answer: "" });
assert.strictEqual(captured.action, "replace");
assert.strictEqual(captured.timeline.durationMonths, 9);
assert.strictEqual(captured.timeline.baselineDurationMonths, 9);
assert.ok(captured.timeline.phases.some((phase) => phase.start === 6 && phase.end === 7));
assert.strictEqual(captured.timeline.source, "candidate");
const contextSession = `timelineC_${Date.now()}`;
assert.strictEqual(writeScenarioTimeline(contextSession, captured.timeline).ok, true);
const storedContext = readScenarioTimeline(contextSession);
assert.strictEqual(storedContext.durationMonths, 9);
const abbreviated = timelinePromptForTurn({ active: storedContext, question: "When does security testing begin in that plan?" });
assert.match(abbreviated, /Months 6-7/);

const forecast = nextScenarioTimeline({
  active: captured.timeline,
  question: "The cutover slips by two weeks.",
  answer: ""
});
assert.strictEqual(forecast.timeline.baselineDurationMonths, 9);
assert.strictEqual(forecast.timeline.durationMonths, 9);
assert.match(forecast.timeline.forecastNote, /extends by two weeks/i);
assert.match(forecast.timeline.forecastNote, /Earlier phases stay/i);

const overflow = nextScenarioTimeline({
  active: established.timeline,
  question: "Reduce the programme to eight months.",
  answer: ""
});
assert.strictEqual(overflow.timeline.durationMonths, 8);
assert.match(overflow.timeline.changeNote, /outside/i);

const policy = unspecifiedTimelinePolicy("For a separate upgrade programme, what timeline would you use?", captured.timeline);
assert.match(policy, /no standard duration/i);
assert.doesNotMatch(policy, /12 to 18|12-18/);
assert.strictEqual(unspecifiedTimelinePolicy("When does security testing begin in that plan?", captured.timeline), "");

const noise = nextScenarioTimeline({ active: null, question: "Thanks for joining.", answer: "" });
assert.strictEqual(isContextOnlyTimeline(contextOnly), true);
assert.strictEqual(isContextOnlyTimeline("When does security testing begin in that plan?"), false);
assert.strictEqual(noise.action, "keep");

const supplied = nextScenarioTimeline({
  active: null,
  question: establishedAnswer,
  answer: "I would use a twelve-month plan instead."
});
assert.strictEqual(supplied.timeline.durationMonths, 9);
assert.strictEqual(supplied.timeline.source, "candidate");

const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const timelineSource = fs.readFileSync(path.join(__dirname, "../lib/scenarioTimeline.js"), "utf8");
assert.doesNotMatch(chat, /readSession\(/);
assert.doesNotMatch(timelineSource, /openai|chat\.completions|generateContent/);
assert.match(chat, /nextScenarioTimeline/);
assert.match(chat, /persistIncomingTimeline/);
assert.match(chat, /unspecifiedTimelinePolicy/);

(async () => {
  const { register } = require("node:module");
  const { pathToFileURL } = require("node:url");
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const { buildSapInterviewPrompt } = await import("../lib/prompt/interviewPrompt.js");
  const prompt = buildSapInterviewPrompt({
    question: testingQuestion,
    analysis: { category: "PMP" },
    reasoningContract: { deliveryQuestion: true, reasoningMode: "decide" },
    interviewContext: { questionRaw: testingQuestion },
    scenarioTimeline: testingPrompt
  });
  assert.match(prompt, /ESTABLISHED SCENARIO TIMELINE/);
  assert.match(prompt, /Months 6-7/);
  assert.doesNotMatch(prompt, /interview-sessions/);
  fs.unlinkSync(path.join(DATA_DIR, `${sessionA}.json`));
  fs.unlinkSync(path.join(DATA_DIR, `${contextSession}.json`));
  console.log("scenarioTimelineAssert: PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
