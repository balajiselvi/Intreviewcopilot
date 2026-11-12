import { authoritativeProcedure, questionProcedureIntent, renderSpokenProcedure } from "../../lib/procedureRetention.js";
import fs from "node:fs";

const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
const q = "How do you configure BRF+ agent determination and integrate it with MSMP?";
console.log("intent", questionProcedureIntent(q, ""));

const brf = index.chunks.filter((c) => c.sourceFile === "brf-plus.md" || c.sourceFile === "msmp.md");
const pool = brf.map((c) => `## ${c.heading}\n${c.content}`).join("\n\n");
const steps = authoritativeProcedure(q, pool, "");
console.log("allBrfMsmp steps", steps.length);
console.log(steps.map((s) => s.slice(0, 110)));

const configureOnly = brf
  .filter((c) => /configure|agent rule|initiator/i.test(c.heading))
  .map((c) => `## ${c.heading}\n${c.content}`)
  .join("\n\n");
const steps2 = authoritativeProcedure(q, configureOnly, "");
console.log("configureOnly steps", steps2.length);
console.log(steps2.map((s) => s.slice(0, 110)));

const spoken = renderSpokenProcedure(q, steps2);
console.log("spoken opening", spoken.slice(0, 200));
console.log("has GRCMSMP", /GRCMSMP/i.test(spoken));
console.log("has Define Workflow", /Define Workflow-Related MSMP Rules/i.test(spoken));
