/**
 * Local ranking probe. node eval/results/policyRetrievalProbe.js
 */
const { searchKnowledge } = require("../../services/vectorSearch");

const STOP = new Set("what does how the for you can which are this that with from into your their mean about when where who did would should".split(" "));

function keyword(question, content, dropStop) {
  const norm = (value) => String(value || "").toLowerCase().replace(/[^\w\s/.-]/g, " ").replace(/\s+/g, " ").trim();
  const queryTokens = norm(question).split(" ").filter((token) => token.length > 2 && (!dropStop || !STOP.has(token)));
  const contentNorm = norm(content);
  if (!queryTokens.length) return 0;
  const matches = queryTokens.filter((token) => contentNorm.includes(token)).length;
  return matches / queryTokens.length;
}

const questions = [
  ["policy-meaning", "What does authorization policy mean in IAG Access Request?", true],
  ["policy-config", "How do you configure an authorization policy in IAG?", true],
  ["policy-app", "Which IAG app limits what a requestor can search?", true],
  ["search-systems", "Which systems can an IAG requestor search for?", true],
  ["search-roles", "How are the roles a requestor can find in IAG Access Request restricted?", true],
  ["search-users", "What stops an IAG requestor from seeing every user in search?", true],
  ["filter-results", "How are access-search results filtered in IAG?", true],
  ["search-scope", "What controls the search scope of an IAG access request?", true],
  ["activate-policy", "How do you activate an IAG policy so search returns only allowed objects?", true],
  ["policy-attributes", "Which attributes does an IAG access policy use to restrict a request?", true],
  ["policy-vs-path", "What is the difference between an IAG search policy and workflow determination?", true],
  ["requestor-find", "How does IAG decide which access a requestor is allowed to find?", true],
  ["policy-set", "How do you create an IAG policy set for access requests?", true],
  ["business-role-policy", "How do you restrict which business roles an IAG requestor can request?", true],
  ["application-policy", "How do you limit the applications an IAG requestor can select?", true],
  ["neg-msmp", "How do you configure MSMP in GRC Access Control?", false],
  ["neg-password", "What is a password policy in Microsoft Entra ID?", false],
  ["neg-pfcg", "How do you maintain authorization objects in PFCG?", false],
  ["neg-grc-ara", "How do you run access risk analysis in SAP GRC?", false]
];

(async () => {
  for (const [id, question, expectPolicy] of questions) {
    const rows = await searchKnowledge(question, { category: "IAG", domain: "SAP Cloud Identity / BTP" }, 8);
    const ranked = rows.map((row, index) => ({
      rank: index + 1,
      score: Number(row.score || 0),
      semantic: Number(row.semanticScore || 0),
      keyword: keyword(question, row.content, false),
      keywordContent: keyword(question, row.content, true),
      file: row.sourceFile,
      heading: row.heading
    }));
    const hit = ranked.find((row) => row.heading === "Authorization policy");
    const top3 = ranked.slice(0, 3).map((row) => `${row.rank}:${row.heading}@${row.score.toFixed(3)}`).join(" | ");
    console.log(`${expectPolicy ? "POS" : "NEG"} ${id} hit=${hit ? hit.rank : "-"} inTop3=${Boolean(hit && hit.rank <= 3)} ${top3}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
