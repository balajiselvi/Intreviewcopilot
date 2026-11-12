/**
 * Read-only implementation/transformation capability probe (no provider calls).
 */
const fs = require("fs");
const path = require("path");
const { productKnowledgeFolders, selectProductScopedChunks } = require("../../lib/productKnowledgeScope.js");
const { explicitProductTopics, resolveInterviewContext } = require("../../lib/interviewContext.js");
const { selectVerifiedWorkflow } = require("../../lib/verifiedWorkflow.js");
const {
  shouldPreferRetrievedProcedure,
  expandPoolWithHeadingSiblings
} = require("../../lib/procedureRetention.js");

const ROOT = path.join(__dirname, "..", "..");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "knowledgeIndex.json"), "utf8"));
const chunks = idx.chunks || [];

function scoreChunks(q, folders, n = 8) {
  const allow = new Set((folders || []).map((f) => String(f).toLowerCase()));
  const terms = [...new Set((String(q).toLowerCase().match(/[a-z0-9+/]{4,}/g) || []))];
  return chunks
    .filter((c) => !allow.size || allow.has(String(c.sourceFolder || "").toLowerCase()))
    .map((c) => {
      const h = String(c.heading || c.section || "").toLowerCase();
      const f = String(c.sourceFile || "").toLowerCase();
      const body = String(c.content || "").toLowerCase().slice(0, 400);
      let s = 0;
      for (const t of terms) {
        if (h.includes(t)) s += 4;
        if (f.includes(t)) s += 2;
        if (body.includes(t)) s += 1;
      }
      return { c, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.c);
}

const battery = [
  ["W1a", "How would you lead an SAP GRC Access Control implementation from requirements workshops through production hypercare?"],
  ["W1b", "In a greenfield Access Control 12.0 programme, what is the ordered build sequence for connectors, ARA ruleset, MSMP/BRF+, BRM and Firefighter before UAT?"],
  ["W2a", "How would you plan an SAP GRC Access Control upgrade, including support-package impacts, remediation, regression testing and rollback?"],
  ["W2b", "After applying a GRC Access Control support package, what authorization and workflow regressions must you prove before returning the system to business users?"],
  ["W3a", "How do you transform SAP Security and GRC from ECC to S/4HANA, including role remediation and Access Control connector impacts?"],
  ["W3b", "During an ECC to S/4HANA brownfield conversion, how do you handle SU25, role redesign and GRC ruleset remediation without freezing operations?"],
  ["W4a", "How would you design the SAP Security architecture for a RISE with SAP Private Edition landscape, including identity and GRC boundaries?"],
  ["W4b", "On RISE with SAP, who operates infrastructure versus customer security responsibilities, and how does that change Access Control and IAS/IPS design?"],
  ["W5a", "How do you run the SAP Security workstream under SAP Activate, and when would you use Agile versus Waterfall governance inside Explore and Realize?"],
  ["W5b", "How do you distinguish SAP Activate quality gates from RISE transformation gates for a security and GRC workstream?"],
  ["W6a", "How would you plan security and GRC testing, cutover, go/no-go, rollback and hypercare for an S/4HANA go-live?"],
  ["W6b", "What is your cutover runbook for GRC connectors, Firefighter and role transports, including rollback triggers?"],
  ["W7a", "How would you roll out SAP GRC Access Control to additional company codes and locations without breaking the global ruleset?"],
  ["W7b", "For a multi-company Access Control rollout, how do you localize MSMP approvers and SoD risk ownership while keeping one global ruleset?"],
  ["W8a", "How would you estimate, staff and govern a multi-location SAP Security and GRC engagement for an RFP response?"],
  ["W8b", "As a Protiviti Senior Manager, how do you set effort assumptions, RAID governance and audit expectations for a GRC Access Control delivery proposal?"]
];

const cases = [];
for (const [id, q] of battery) {
  const topics = explicitProductTopics(q);
  const folders = productKnowledgeFolders(q);
  const ctx = resolveInterviewContext({ questionRaw: q });
  const verified = selectVerifiedWorkflow(q);
  let ranked = scoreChunks(q, folders, 10);
  ranked = selectProductScopedChunks(q, ranked);
  const pool = expandPoolWithHeadingSiblings(
    ranked,
    chunks.filter((c) => folders.includes(String(c.sourceFolder || "").toLowerCase())).slice(0, 50)
  );
  const knowledgeText = ranked.map((c) => String(c.content || "")).join("\n\n").slice(0, 8000);
  let prefer = null;
  try {
    prefer = shouldPreferRetrievedProcedure({
      question: q,
      knowledgeText,
      answerScope: ctx.answerScope,
      procedurePool: pool,
      seedChunks: ranked.slice(0, 3)
    });
  } catch (e) {
    prefer = { error: String(e.message || e) };
  }
  const evidence = ranked.slice(0, 6).map((c) => ({
    id: c.id || c.chunkId,
    folder: c.sourceFolder,
    file: path.basename(String(c.sourceFile || "")),
    heading: c.heading || c.section,
    pc: /process-control|process control/i.test(String(c.sourceFile || "") + " " + String(c.heading || "") + " " + String(c.content || "").slice(0, 200)),
    preview: String(c.content || "").replace(/\s+/g, " ").slice(0, 140)
  }));
  const pcBleed = evidence.some((e) => e.pc);
  cases.push({
    id,
    q,
    topics,
    folders,
    topic: ctx.questionTopic,
    scope: ctx.answerScope,
    verifiedId: verified?.id || null,
    verifiedRoute: verified?.route || null,
    prefer: prefer?.prefer ?? null,
    preferReason: prefer?.reason || prefer?.error || null,
    preferRoute: prefer?.route || null,
    stepCount: prefer?.stepCount || 0,
    pathGuess: verified?.id
      ? "VERIFIED_WORKFLOW"
      : prefer?.prefer
        ? "RETRIEVED_PROCEDURE"
        : "GENERATION",
    pcBleed,
    evidence
  });
}

const out = {
  generatedAt: new Date().toISOString(),
  mode: "deterministic-offline-impl-transform-audit",
  cases
};
fs.writeFileSync(path.join(__dirname, "_impl_transform_audit_probe.json"), JSON.stringify(out, null, 2));
for (const c of cases) {
  console.log(
    `${c.id} path=${c.pathGuess} topic=${c.topic} folders=${JSON.stringify(c.folders)} verified=${c.verifiedId || "-"} prefer=${c.prefer}(${c.preferReason}) pcBleed=${c.pcBleed}`
  );
  console.log(
    "  evidence:",
    c.evidence.map((e) => `${e.folder}/${e.file}::${String(e.heading || "").slice(0, 60)}${e.pc ? " [PC]" : ""}`).join(" | ")
  );
}
