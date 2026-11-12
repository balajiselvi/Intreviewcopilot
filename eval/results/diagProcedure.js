const { searchKnowledge } = require("../../services/vectorSearch.js");

function promptText(chunks) {
  let current = 0;
  const kept = [];
  for (const chunk of chunks) {
    for (const para of String(chunk.content || "").split(/\n+/)) {
      const p = para.trim();
      if (!p) continue;
      if (current + p.length > 3000) return kept.join("\n");
      kept.push(p);
      current += p.length;
    }
  }
  return kept.join("\n");
}

const cases = [
  ["ips-sync", "How would you troubleshoot a failed IPS synchronization? Topic: IPS. Facet: direct question.", { category: "Troubleshooting", secondaryCategories: [] }, 4],
  ["cutover", "What do you do during cutover and hypercare? Topic: . Facet: direct question.", { category: "General", secondaryCategories: [] }, 2]
];

(async () => {
  const { authoritativeProcedure, renderSpokenProcedure, selectProcedureSteps } = await import("../../lib/procedureRetention.js");
  for (const [id, query, analysis, topK] of cases) {
    const chunks = await searchKnowledge(query, analysis, topK);
    const text = promptText(chunks);
    const steps = authoritativeProcedure(query, text);
    const all = selectProcedureSteps(query, text, 8);
    console.log("\n==", id, "authoritative", steps.length, "selected", all.length, "runbook", text.includes("runbook"), "jobLogs", /Job Logs/i.test(text));
    all.forEach((step) => console.log(" -", step.slice(0, 160)));
    chunks.forEach((chunk, index) => {
      const file = String(chunk.sourceFile || "").split(/[/\\]/).pop();
      console.log(index + 1, (chunk.score || 0).toFixed(3), file, "|", chunk.heading);
      if (id === "ips-sync") console.log(String(chunk.content || "").slice(0, 280).replace(/\n/g, " "));
    });
    console.log(renderSpokenProcedure(query, steps).slice(0, 700));
  }
})().catch((error) => { console.error(error); process.exit(1); });
