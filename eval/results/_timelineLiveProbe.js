process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const fs = require("fs");
const { generateAnswer } = require("../lib/generateAnswer");
const { readScenarioTimeline } = require("../../lib/interviewSessionStore");

const sessionA = `timelineLiveA_${Date.now().toString(36)}`;
const sessionB = `timelineLiveB_${Date.now().toString(36)}`;
const plan = [
  "Use this illustrative nine-month greenfield implementation for the rest of this scenario.",
  "Months 1-2: discovery, planning and solution design.",
  "Months 3-5: configuration, build and integration.",
  "Months 6-7: testing, remediation and readiness.",
  "Month 8: cutover rehearsals and go-live preparation.",
  "Month 9: deployment, hypercare and transition."
].join(" ");

(async () => {
  const rows = [];
  const history = [];
  async function ask(id, sessionId, question, prior) {
    const result = await generateAnswer(question, { interviewSessionId: sessionId, history: prior });
    const answer = result.answer || "";
    history.push({ role: "user", content: question }, { role: "assistant", content: answer });
    const stored = readScenarioTimeline(sessionId);
    const row = {
      id,
      finish: result.generation?.finish_reason || null,
      words: answer.split(/\s+/).filter(Boolean).length,
      storedMonths: stored?.durationMonths || null,
      storedType: stored?.projectType || null,
      storedSource: stored?.source || null,
      delays: stored?.delays || [],
      answer
    };
    rows.push(row);
    console.log(`\n${id} finish=${row.finish || "-"} stored=${row.storedMonths || "-"}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 700));
    return row;
  }

  const first = await ask("establish", sessionA, plan, []);
  const testing = await ask("security-testing", sessionA, "When does security testing begin in that plan?", history.slice());
  const delay = await ask("cutover-delay", sessionA, "The cutover slips by two weeks. What moves?", history.slice());
  const fresh = await ask("new-session", sessionB, "When does security testing begin in that plan?", []);
  const separate = await ask("separate-upgrade", sessionA, "For a separate upgrade programme, what timeline would you use?", history.slice());

  const report = {
    generatedAt: new Date().toISOString(),
    sessionA,
    sessionB,
    checks: {
      establishedNine: testing.storedMonths === 9,
      testingUsesMonthSix: /months?\s*6/i.test(testing.answer),
      testingDoesNotSwitchToTwelve: !/\b(12|twelve)\s*-?\s*months?\b/i.test(testing.answer),
      delayKeepsNine: delay.storedMonths === 9,
      delayRecordsTwoWeeks: (delay.delays || []).some((item) => /two weeks/i.test(item)),
      delayAnswerMentionsTwoWeeks: /two[ -]?weeks?/i.test(delay.answer),
      newSessionHasNoStoredTimeline: fresh.storedMonths == null,
      separateScenarioDropsImplementationPlan: separate.storedType !== "implementation"
    },
    rows
  };
  fs.writeFileSync("eval/results/_timelineLiveProbe.json", JSON.stringify(report, null, 2));
  console.log("\nCHECKS", JSON.stringify(report.checks, null, 2));
  const failed = Object.entries(report.checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) {
    console.error("FAILED", failed.join(", "));
    process.exit(1);
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
