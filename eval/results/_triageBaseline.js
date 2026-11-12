/**
 * Read-only baseline triage — loads HEAD copies of modules into temp files.
 * Does not modify the worktree sources.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..", "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fix1-triage-"));

function gitShow(rel) {
  const out = spawnSync("git", ["show", `HEAD:${rel}`], {
    cwd: root,
    encoding: "buffer",
    maxBuffer: 20 * 1024 * 1024
  });
  if (out.status !== 0) throw new Error(`git show HEAD:${rel} failed`);
  // Avoid UTF-16 from PowerShell redirection; git stdout is utf8 bytes.
  return out.stdout.toString("utf8").replace(/^\uFEFF/, "");
}

function write(name, content) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

const pksHead = write("productKnowledgeScope.js", gitShow("lib/productKnowledgeScope.js"));
const vwHead = write("verifiedWorkflow.js", gitShow("lib/verifiedWorkflow.js"));

// productKnowledgeScope requires ./interviewContext — copy that too from HEAD
write("interviewContext.js", gitShow("lib/interviewContext.js"));

const headPks = require(pksHead);
const curPks = require(path.join(root, "lib", "productKnowledgeScope.js"));
const headVw = require(vwHead);
const curVw = require(path.join(root, "lib", "verifiedWorkflow.js"));

const editionCandidates = [
  { sourceFolder: "s4hana", heading: "Public Edition: user cannot see a Fiori app" },
  { sourceFolder: "s4hana", heading: "Private Edition: user cannot see a Fiori app" },
  { sourceFolder: "s4hana", heading: "Private Edition launchpad" },
  { sourceFolder: "fiori", heading: "Public Edition troubleshooting: app is missing" }
];
const q =
  "Compare the Fiori app assignment in S/4HANA Cloud Public Edition and Private Edition.";

const report = {
  tmp,
  productBoundary: {
    question: q,
    head: headPks.selectProductScopedChunks(q, editionCandidates).map((c) => c.heading),
    current: curPks.selectProductScopedChunks(q, editionCandidates).map((c) => c.heading),
    expectedByAssert: editionCandidates.map((c) => c.heading)
  },
  answerQuality: {
    question: "How do you configure an MSMP workflow for access requests?",
    headId: headVw.selectVerifiedWorkflow(
      "How do you configure an MSMP workflow for access requests?"
    )?.id || null,
    curId: curVw.selectVerifiedWorkflow(
      "How do you configure an MSMP workflow for access requests?"
    )?.id || null
  }
};

const headAns =
  headVw.selectVerifiedWorkflow("How do you configure an MSMP workflow for access requests?")
    ?.answer || "";
const curAns =
  curVw.selectVerifiedWorkflow("How do you configure an MSMP workflow for access requests?")
    ?.answer || "";
report.answerQuality.headHasSelectedPathPhrase = /selected path, stage, approver/i.test(headAns);
report.answerQuality.curHasSelectedPathPhrase = /selected path, stage, approver/i.test(curAns);
report.answerQuality.headHasApproversOfSelectedPath = /Approvers of Selected Path/i.test(headAns);
report.answerQuality.curHasApproversOfSelectedPath = /Approvers of Selected Path/i.test(curAns);
report.answerQuality.headSnippet = headAns.slice(-220);
report.answerQuality.curSnippet = curAns.slice(-220);

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(__dirname, "fix1_triage_baseline.json"), JSON.stringify(report, null, 2));
