const { generateAnswer } = require("../lib/generateAnswer");

const question = "How would you design security for SAP S/4HANA Cloud, and how would you verify that the user has the required access?";

generateAnswer(question)
  .then((result) => {
    console.log(JSON.stringify({
      latencyMs: result.latencyMs,
      context: result.context,
      generation: result.generation,
      answer: result.answer
    }, null, 2));
  })
  .catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
