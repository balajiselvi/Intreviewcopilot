const fs = require("fs");
const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
for (const chunk of index.chunks.filter((item) => item.sourceFile === "joule-security.md")) {
  console.log("---", JSON.stringify(chunk.heading), "trust", String(chunk.content).includes("Trust Configuration"), "provisioned", String(chunk.content).includes("provisioned by SAP"));
  console.log(JSON.stringify(String(chunk.content).slice(0, 160)));
}
