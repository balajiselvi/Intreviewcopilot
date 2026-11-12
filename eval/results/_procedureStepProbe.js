const fs = require("fs");
const {
  authoritativeProcedure,
  shouldPreferRetrievedProcedure,
  questionProcedureIntent
} = require("../../lib/procedureRetention.js");

const brf = fs.readFileSync("knowledge/grc/brf-plus.md", "utf8");
const msmp = fs.readFileSync("knowledge/grc/msmp.md", "utf8");
const overviewOnly = brf.slice(0, brf.indexOf("## Configure a BRFplus agent"));
const configureOnly = brf.slice(brf.indexOf("## Configure a BRFplus agent"));
const implActivities = (() => {
  const i = brf.indexOf("## Implementation Activities");
  const j = brf.indexOf("\n## ", i + 5);
  return brf.slice(i, j > i ? j : undefined);
})();

// Simulate retrieval: short overview chunks only (what causes stepCount=0)
const simulatedThinRetrieval = [
  "### SOURCE: grc/brf-plus.md | SECTION: Overview",
  brf.match(/## Overview\n([\s\S]*?)(?=\n## )/)?.[1] || "",
  "### SOURCE: grc/brf-plus.md | SECTION: 30 Second Interview Answer",
  brf.match(/## 30 Second Interview Answer\n([\s\S]*?)(?=\n## )/)?.[1] || ""
].join("\n\n");

const cases = [
  ["full-brf", "How to configure BRF+?", brf],
  ["overview-only", "How to configure BRF+?", overviewOnly],
  ["configure-section", "How to configure BRF+?", configureOnly],
  ["impl-activities", "How to configure BRF+?", implActivities],
  ["thin-retrieval-sim", "How to configure BRF+?", simulatedThinRetrieval],
  ["full-msmp", "How to configure MSMP?", msmp],
  ["msmp+brf", "How to configure MSMP?", `${msmp}\n${brf}`]
];

for (const [label, q, kb] of cases) {
  const steps = authoritativeProcedure(q, kb) || [];
  const prefer = shouldPreferRetrievedProcedure({ question: q, knowledgeText: kb });
  console.log(
    JSON.stringify({
      label,
      intent: questionProcedureIntent(q),
      steps: steps.length,
      prefer: prefer.prefer,
      reason: prefer.reason,
      stepCount: prefer.stepCount,
      head: (steps[0] || "").slice(0, 100)
    })
  );
}
