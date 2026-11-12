const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");
const { generateEmbedding } = require("../../services/embeddingService");

function cosine(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

(async () => {
  await register(pathToFileURL("eval/lib/extlessResolveHook.mjs").href);
  const { authoritativeProcedure, renderSpokenProcedure } = await import("../../lib/procedureRetention.js");

  const source = fs.readFileSync("services/embeddingService.js", "utf8");
  const model = (source.match(/Xenova\/[A-Za-z0-9._-]+/) || [])[0] || "";
  const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
  const manifest = JSON.parse(fs.readFileSync("data/knowledgeManifest.json", "utf8"));
  const target = index.chunks.find((chunk) => chunk.heading === "Troubleshoot Fiori access when the server is on premise");
  const oauth = index.chunks.find((chunk) => chunk.sourceFile === "oauth.md" && /Design an OAuth/.test(chunk.heading));
  if (!target) throw new Error("on-premise Fiori chunk is missing");
  if (!oauth) throw new Error("oauth procedure chunk is missing");

  const rebuilt = await generateEmbedding(target.content);
  const oauthRebuilt = await generateEmbedding(oauth.content);
  const queryText = "If the user cannot access a Fiori app, how do you troubleshoot? Follow-up: What if my server was on premise?";
  const query = await generateEmbedding(queryText);
  const ranked = index.chunks
    .map((chunk) => ({ heading: chunk.heading, file: chunk.sourceFile, score: cosine(query, chunk.embedding) }))
    .sort((a, b) => b.score - a.score);
  const onPremRank = ranked.findIndex((row) => row.heading === target.heading) + 1;

  // Production does not answer from raw cosine rank alone. Prove the stored on-prem
  // procedure text still renders the ABAP path when selected.
  const spoken = renderSpokenProcedure(queryText, authoritativeProcedure(queryText, target.content, "STAGE_INVESTIGATION"));

  const result = {
    queryEncoder: model,
    indexLabel: index.embeddingModel,
    labelPurpose: "compatibility key; runtime encoder is Xenova/all-MiniLM-L6-v2",
    pooling: /pooling:\s*"mean"/.test(source),
    normalized: /normalize:\s*true/.test(source),
    indexChunks: index.chunks.length,
    manifestChunks: manifest.totalChunks,
    storedDimensions: target.embedding.length,
    rebuiltDimensions: rebuilt.length,
    sameTextCosine: Number(cosine(rebuilt, target.embedding).toFixed(4)),
    oauthSameTextCosine: Number(cosine(oauthRebuilt, oauth.embedding).toFixed(4)),
    onPremCosineRank: onPremRank,
    top: ranked.slice(0, 5),
    procedureHasPfcg: /PFCG/.test(spoken),
    procedureHasGateway: /IWFND\/ERROR_LOG/.test(spoken),
    procedureHasHeadingBan: /Direct Answer|Technical Mechanism/.test(spoken),
    oauthContentReady: /authorization-code|OpenID Connect|role collections/i.test(oauth.content)
  };
  console.log(JSON.stringify(result, null, 2));

  if (result.queryEncoder !== "Xenova/all-MiniLM-L6-v2") throw new Error("query encoder is not MiniLM");
  if (result.indexChunks !== result.manifestChunks) throw new Error("index and manifest chunk counts diverge");
  if (result.storedDimensions !== 384 || result.rebuiltDimensions !== 384) throw new Error("dimension mismatch");
  if (result.sameTextCosine < 0.995 || result.oauthSameTextCosine < 0.995) throw new Error("stored vector does not match the current encoder");
  if (onPremRank < 1 || onPremRank > 40) throw new Error(`on-premise chunk outside retrieval window at rank ${onPremRank}`);
  if (!result.procedureHasPfcg || !result.procedureHasGateway) throw new Error("on-premise procedure text lost required steps");
  if (result.procedureHasHeadingBan) throw new Error("spoken procedure returned a report heading");
  if (!result.oauthContentReady) throw new Error("oauth procedure text is not usable");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
