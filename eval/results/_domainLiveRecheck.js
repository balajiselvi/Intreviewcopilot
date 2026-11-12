process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const { generateAnswer } = require("../lib/generateAnswer");
const cases = [
  ["car", "How do you authorize an administrator for SAP Customer Activity Repository?"],
  ["joule", "How is identity and access administered for SAP Joule?"],
  ["fiori-open", "A Fiori app opens in SAP S/4HANA Cloud Public Edition, but the request fails an authorization check. What do you check?"]
];
(async () => {
  for (const [id, question] of cases) {
    const result = await generateAnswer(question);
    const answer = result.answer || "";
    console.log(`\n${id} finish=${result.generation && result.generation.finish_reason || "-"}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 800));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
