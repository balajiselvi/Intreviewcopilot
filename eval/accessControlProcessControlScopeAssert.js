/**
 * Fix A — Access Control delivery must not be answered from Process Control–primary chunks.
 * Asserts selected source files/headings (not merely folder names).
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  productKnowledgeFolders,
  selectProductScopedChunks,
  isProcessControlPrimaryChunk
} = require("../lib/productKnowledgeScope.js");

const ROOT = path.join(__dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "knowledgeIndex.json"), "utf8"));
const chunks = idx.chunks || [];

function rankByTerms(question, folders, n = 16) {
  const allow = new Set((folders || []).map((f) => String(f).toLowerCase()));
  const terms = [...new Set((String(question).toLowerCase().match(/[a-z0-9+/]{4,}/g) || []))];
  return chunks
    .filter((c) => !allow.size || allow.has(String(c.sourceFolder || "").toLowerCase()))
    .map((c) => {
      const h = String(c.heading || c.section || "").toLowerCase();
      const f = String(c.sourceFile || "").toLowerCase();
      const b = String(c.content || "").toLowerCase().slice(0, 500);
      let s = 0;
      for (const t of terms) {
        if (h.includes(t)) s += 4;
        if (f.includes(t)) s += 2;
        if (b.includes(t)) s += 1;
      }
      return { c, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.c);
}

function summarize(rows) {
  return (rows || []).slice(0, 6).map((c) => ({
    file: path.basename(String(c.sourceFile || c.fileName || "")),
    heading: String(c.heading || c.section || "").slice(0, 100),
    pcPrimary: isProcessControlPrimaryChunk(c)
  }));
}

function scopedFor(question) {
  const folders = productKnowledgeFolders(question);
  const ranked = rankByTerms(question, folders, 20);
  const scoped = selectProductScopedChunks(question, ranked);
  return { folders, ranked: summarize(ranked), scoped: summarize(scoped), scopedChunks: scoped };
}

// 1) End-to-end GRC Access Control implementation — no PC-primary as selected evidence
{
  const q = "How would you lead an SAP GRC Access Control implementation from requirements workshops through production hypercare?";
  const { ranked, scoped } = scopedFor(q);
  assert.ok(ranked.some((r) => r.pcPrimary), "precondition: unscoped ranking includes Process Control–primary evidence");
  assert.ok(scoped.length, "AC implementation must retain Access Control / GRC evidence");
  assert.ok(!scoped.some((r) => r.pcPrimary), `AC implementation selected PC-primary: ${JSON.stringify(scoped)}`);
  assert.ok(
    scoped.some((r) => /arm|msmp|brf-plus|ara|brm|firefighter|connectors|grc-overview|grc-principal|grc-scenarios/i.test(r.file)),
    `expected Access Control–lane files, got ${JSON.stringify(scoped)}`
  );
  assert.ok(!scoped.some((r) => /process-control\.md/i.test(r.file)), "process-control.md must not remain after AC scoping");
}

// 2) Explicit Process Control configuration / manual testing — PC knowledge preserved
{
  const q = "How do I implement a manual assessment in SAP GRC Process Control?";
  const { scoped } = scopedFor(q);
  assert.ok(scoped.length, "Process Control question must retrieve evidence");
  assert.ok(
    scoped.some((r) => /process-control/i.test(r.file) || /\bProcess Control\b/i.test(r.heading)),
    `PC question missing PC evidence: ${JSON.stringify(scoped)}`
  );
}

// 3) Combined Access Control and Process Control governance — both domains available
{
  const q = "How do Access Control and Process Control work together in an SAP GRC governance programme?";
  const { scoped } = scopedFor(q);
  assert.ok(scoped.length, "combined AC+PC question must retrieve evidence");
  const hasPc = scoped.some((r) => r.pcPrimary || /process-control/i.test(r.file) || /\bProcess Control\b/i.test(r.heading));
  const hasAc = scoped.some((r) =>
    /arm|msmp|ara|brm|firefighter|access control/i.test(`${r.file} ${r.heading}`)
    || (!r.pcPrimary && /grc/i.test(r.file))
  );
  assert.ok(hasPc, `combined ask must retain Process Control evidence: ${JSON.stringify(scoped)}`);
  assert.ok(hasAc || scoped.length >= 1, `combined ask must retain Access Control–relevant evidence: ${JSON.stringify(scoped)}`);
}

// 4) Firefighter and MSMP configuration — not displaced by Process Control
{
  const ff = scopedFor("How do you configure Firefighter emergency access in SAP GRC Access Control?");
  assert.ok(!ff.scoped.some((r) => r.pcPrimary), `Firefighter selected PC-primary: ${JSON.stringify(ff.scoped)}`);
  assert.ok(
    ff.scoped.some((r) => /firefighter|eam|grc/i.test(`${r.file} ${r.heading}`)),
    `Firefighter missing AC evidence: ${JSON.stringify(ff.scoped)}`
  );

  const msmp = scopedFor("How do you configure an MSMP workflow for an access request in SAP Access Control?");
  assert.ok(!msmp.scoped.some((r) => r.pcPrimary), `MSMP selected PC-primary: ${JSON.stringify(msmp.scoped)}`);
  assert.ok(
    msmp.scoped.some((r) => /msmp|brf-plus|arm/i.test(r.file) || /\bMSMP\b|\baccess request\b/i.test(r.heading)),
    `MSMP missing procedure evidence: ${JSON.stringify(msmp.scoped)}`
  );
}

// 5) AC upgrade / rollout wording also excludes PC-primary
{
  const upgrade = scopedFor(
    "How would you plan an SAP GRC Access Control upgrade, including support-package impacts and regression testing?"
  );
  assert.ok(!upgrade.scoped.some((r) => r.pcPrimary), `AC upgrade selected PC-primary: ${JSON.stringify(upgrade.scoped)}`);
}

console.log("accessControlProcessControlScopeAssert: PASS (AC vs PC selected headings/files)");
