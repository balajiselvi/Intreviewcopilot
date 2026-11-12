process.env.EVAL_APP_BASE_URL = "http://127.0.0.1:3000";
const { generateAnswer } = require("../lib/generateAnswer");
(async () => {
  for (const question of ["Have you worked on SAP Joule?", "How is identity and access administered for SAP Joule?"]) {
    const result = await generateAnswer(question);
    const finish = result.generation && result.generation.finish_reason ? result.generation.finish_reason : "-";
    console.log(`\nfinish=${finish}`);
    console.log(result.answer.replace(/\s+/g, " ").slice(0, 700));
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
