process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const { generateAnswer } = require("../lib/generateAnswer");

const cases = [
  ["car", "How do you authorize an administrator for SAP Customer Activity Repository?"],
  ["joule", "How is identity and access administered for SAP Joule?"],
  ["sac", "How do you assign roles and teams in SAP Analytics Cloud?"],
  ["fiori-miss", "A user cannot launch a Fiori app in SAP S/4HANA Cloud Public Edition. What do you check?"],
  ["fiori-open", "A Fiori app opens in SAP S/4HANA Cloud Public Edition, but the request fails an authorization check. What do you check?"],
  ["years", "How many years of SAP GRC experience do you have, and are you PMP certified?"],
  ["technical", "How do you configure an IAG access request workflow?"]
];

(async () => {
  for (const [id, question] of cases) {
    const result = await generateAnswer(question);
    const answer = result.answer || "";
    const finish = result.generation && result.generation.finish_reason ? result.generation.finish_reason : "-";
    console.log(`\n${id} ${result.latencyMs}ms finish=${finish} words=${answer.split(/\s+/).filter(Boolean).length}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 700));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
