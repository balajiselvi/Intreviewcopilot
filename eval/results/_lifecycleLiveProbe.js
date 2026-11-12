process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const fs = require("fs");
const { generateAnswer } = require("../lib/generateAnswer");

const cases = [
  ["choose-path", "How do you choose between a greenfield new implementation and a system conversion?"],
  ["selective", "When would you use selective data transition instead of a system conversion?"],
  ["upgrade", "What is the difference between an upgrade, an update, and a system conversion?"],
  ["rollback", "How do you plan rollback for an SAP cutover?"],
  ["security-stream", "What does the SAP Security workstream do across the implementation lifecycle?"],
  ["joule-experience", "Have you worked on SAP Joule?"]
];

(async () => {
  const rows = [];
  for (const [id, question] of cases) {
    const result = await generateAnswer(question);
    const answer = result.answer || "";
    const finish = result.generation && result.generation.finish_reason ? result.generation.finish_reason : null;
    rows.push({ id, question, finish, words: answer.split(/\s+/).filter(Boolean).length, latencyMs: result.latencyMs, answer });
    console.log(`\n${id} finish=${finish || "-"} words=${rows.at(-1).words}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 1100));
  }
  fs.writeFileSync("eval/results/_lifecycleLiveProbe.json", JSON.stringify(rows, null, 2));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
