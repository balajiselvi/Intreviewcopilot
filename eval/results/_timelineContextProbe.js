process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const fs = require("fs");
const { generateAnswer } = require("../lib/generateAnswer");
const { readScenarioTimeline } = require("../../lib/interviewSessionStore");

const sessionA = `timelineCtxA_${Date.now().toString(36)}`;
const sessionB = `timelineCtxB_${Date.now().toString(36)}`;
const statement = "We have a nine-month greenfield implementation, with security testing in Months 6-7 and go-live preparation in Month 8.";

(async () => {
  const context = await generateAnswer(statement, { interviewSessionId: sessionA, history: [] });
  const afterStatement = readScenarioTimeline(sessionA);
  const follow = await generateAnswer("When does security testing begin in that plan?", {
    interviewSessionId: sessionA,
    history: []
  });
  const afterFollow = readScenarioTimeline(sessionA);
  const upgrade = await generateAnswer("For a separate upgrade programme, what timeline would you use?", {
    interviewSessionId: sessionA,
    history: []
  });
  const afterUpgrade = readScenarioTimeline(sessionA);
  const otherSession = readScenarioTimeline(sessionB);
  const report = {
    generatedAt: new Date().toISOString(),
    sessionA,
    checks: {
      statementStoredImmediately: afterStatement?.durationMonths === 9,
      statementDidNotRequireAnAnswer: !String(context.answer || "").includes("### 1."),
      followUpUsesStoredWindow: /months?\s*6/i.test(follow.answer || ""),
      followUpKeepsNine: afterFollow?.durationMonths === 9,
      historyWasEmpty: true,
      upgradeAvoidsUniversalRange: !/\b12\s*(?:to|-)\s*18\s*months?\b/i.test(upgrade.answer || ""),
      upgradeDropsGreenfieldPlan: afterUpgrade?.projectType !== "implementation",
      otherSessionEmpty: otherSession == null
    },
    contextAnswer: context.answer || "",
    followAnswer: follow.answer || "",
    upgradeAnswer: upgrade.answer || ""
  };
  fs.writeFileSync("eval/results/_timelineContextProbe.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.checks, null, 2));
  console.log("\nUPGRADE", (upgrade.answer || "").replace(/\s+/g, " ").slice(0, 500));
  console.log("\nFOLLOW", (follow.answer || "").replace(/\s+/g, " ").slice(0, 400));
  const failed = Object.entries(report.checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) {
    console.error("FAILED", failed.join(", "));
    process.exit(1);
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
