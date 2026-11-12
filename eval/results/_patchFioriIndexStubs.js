const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../..");
const indexPath = path.join(root, "data/knowledgeIndex.json");
const mdPath = path.join(root, "knowledge/fiori/fiori-security.md");
const md = fs.readFileSync(mdPath, "utf8");

function section(heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`## ${escaped}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`);
  const m = md.match(re);
  if (!m) throw new Error(`missing section: ${heading}`);
  return (`## ${heading}\n\n${m[1].trim()}`).trim();
}

const replacements = [
  "Troubleshoot a user who cannot access a Fiori app",
  "Troubleshoot Fiori access when the server is on premise",
  "Fiori app missing from the launchpad",
  "Fiori app opens and returns an authorization error"
].map((heading) => ({ heading, content: section(heading) }));

const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
let updated = 0;

for (const chunk of index.chunks || []) {
  const source = chunk.sourceFile || chunk.metadata?.sourceFile || "";
  if (!String(source).includes("fiori-security.md")) continue;
  const hit = replacements.find(
    (r) => chunk.heading === r.heading || chunk.section === r.heading
  );
  if (!hit) continue;
  const body = String(chunk.content || "");
  const needsPatch = body.includes("If the server is on premise, I would follow the ABAP Fiori path")
    || body.includes("I would first check whether the user cannot see the app")
    || body.includes("When the app is missing, I would check")
    || body.includes("When the app opens and then returns an authorization error, I would reproduce")
    || /I would (first |)check/.test(body)
    || body.startsWith(`## ${hit.heading}`);
  if (needsPatch) {
    chunk.content = hit.content;
    updated += 1;
  }
}

fs.writeFileSync(indexPath, JSON.stringify(index));
const serialized = JSON.stringify(index);
console.log(JSON.stringify({
  updated,
  stubRemaining: serialized.includes("ABAP Fiori path"),
  firstPersonOnPremStub: serialized.includes("If the server is on premise, I would follow")
}));
