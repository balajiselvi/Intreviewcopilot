const fs = require("fs");
(async () => {
  const { authoritativeProcedure } = await import("../../lib/procedureRetention.js");
  const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
  const question = "How would you deliver a programme with SAP Activate? Topic: Activate. Facet: request for technical steps.";
  for (const heading of ["Overview", "30 Second Interview Answer", "Configuration"]) {
    const chunk = index.chunks.find((item) => item.sourceFile === "rise-project.md" && (item.heading === heading || item.section === heading));
    if (!chunk) {
      console.log("missing", heading);
      continue;
    }
    const text = `## ${chunk.heading || chunk.section}\n${chunk.content}`;
    const steps = authoritativeProcedure(question, text, "");
    console.log("\n", heading, "steps", steps.length);
    console.log(JSON.stringify(String(chunk.content).slice(0, 220)));
    console.log(steps.slice(0, 3).join(" || "));
  }
  const activate = index.chunks.find((item) => item.sourceFile === "sap-activate.md");
  const activateText = `## ${activate.heading || activate.section}\n${activate.content}`;
  console.log("\nsap-activate", activate.heading, authoritativeProcedure(question, activateText, "").length);
  console.log(JSON.stringify(String(activate.content).slice(0, 220)));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
