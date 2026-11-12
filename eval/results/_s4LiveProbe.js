process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const { generateAnswer } = require("../lib/generateAnswer");

const cases = [
  ["public-design", "How would you design security for SAP S/4HANA Cloud Public Edition?"],
  ["public-assign", "How do you assign a business role to a business user in SAP S/4HANA Cloud Public Edition?"],
  ["public-trace", "How do you trace an authorization check and confirm the business user can complete the app in S/4HANA Cloud Public Edition?"],
  ["private-pfcg", "How do you create and assign a role in SAP S/4HANA Cloud Private Edition?"],
  ["compare", "What changes in role administration between SAP S/4HANA Cloud Public Edition and Private Edition?"],
  ["fiori-miss", "A user cannot launch a Fiori app in SAP S/4HANA Cloud Public Edition. What do you check?"],
  ["no-edition", "How do you design and verify authorization for S/4HANA?"],
  ["regression", "How would you design security for SAP S/4HANA Cloud, and how would you verify that the user has the required access?"],
  ["architecture", "Walk me through the overall security architecture for S/4HANA Cloud."]
];

(async () => {
  for (const [id, question] of cases) {
    const result = await generateAnswer(question);
    const answer = result.answer || "";
    const finish = result.generation && result.generation.finish_reason ? result.generation.finish_reason : "-";
    console.log(`\n${id} ${result.latencyMs}ms finish=${finish} words=${answer.split(/\s+/).filter(Boolean).length}`);
    console.log(answer.replace(/\s+/g, " ").slice(0, 500));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
