const fs = require("fs");
const crypto = require("crypto");
const { generateEmbedding } = require("../../services/embeddingService");
const marker = "SAP-managed Joule Work is provisioned by SAP.";
const prefix = "Configure the authorization trust from the Joule SAP BTP subaccount to the Identity Authentication tenant in Security, Trust Configuration. Use that same Identity Authentication tenant and the same Global User ID for every application in the Joule formation. Assign the authorization for SAP-managed Joule Work through the Identity Authentication groups joule_tenant_admin, joule_analytics_admin, and joule_end_user, or through the BTP role collection when that edition uses a role collection. Do not assign an S/4HANA business role or a PFCG role as the Joule authorization. ";
(async () => {
  const indexPath = "data/knowledgeIndex.json";
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const matches = index.chunks.filter((chunk) => chunk.sourceFile === "joule-security.md" && chunk.heading === "Joule Work groups");
  console.log(`matches ${matches.length}`);
  for (const chunk of matches) {
    chunk.embedding = await generateEmbedding(chunk.content);
    console.log(`embedded dim ${chunk.embedding.length} trust ${String(chunk.content).includes("Trust Configuration")}`);
  }
  const tmp = `${indexPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(index));
  fs.copyFileSync(tmp, indexPath);
  fs.unlinkSync(tmp);
  console.log("index updated");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
