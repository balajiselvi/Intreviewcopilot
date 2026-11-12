process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const fs = require("fs");
const { generateAnswer } = require("../lib/generateAnswer");

const cases = [
  ["activate", "How would you deliver a programme with SAP Activate?"],
  ["rise-owner", "Who owns the application security concept in RISE with SAP S/4HANA Cloud, private edition?"],
  ["joule", "How is identity and access administered for SAP Joule?"],
  ["car", "How do you authorize an administrator for SAP Customer Activity Repository?"],
  ["fiori-miss", "A user cannot launch a Fiori app in SAP S/4HANA Cloud Public Edition. What do you check?"],
  ["joule-experience", "Have you worked on SAP Joule?"],
  ["years", "How many years of SAP GRC experience do you have, and are you PMP certified?"]
];

(async () => {
  const rows = [];
  for (const [id, question] of cases) {
    const result = await generateAnswer(question);
    const answer = result.answer || "";
    const finish = result.generation && result.generation.finish_reason ? result.generation.finish_reason : null;
    const row = {
      id,
      question,
      finish,
      words: answer.split(/\s+/).filter(Boolean).length,
      latencyMs: result.latencyMs,
      answer
    };
    rows.push(row);
    console.log(`\n${id} finish=${finish || "-"} words=${row.words}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 900));
  }
  fs.writeFileSync("eval/results/_activateLiveProbe.json", JSON.stringify(rows, null, 2));
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
