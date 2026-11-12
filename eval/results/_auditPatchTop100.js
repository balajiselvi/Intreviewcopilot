const fs = require("fs");

const bankPath = "data/answer-bank/SAP_Security_GRC_Senior_Consultant_Top_100_QA.json";
const archivePath = "data/answer-bank/archive/original-pre-audit-2026-10-22/SAP_Security_GRC_Senior_Consultant_Top_100_QA.json";
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const original = JSON.parse(fs.readFileSync(archivePath, "utf8"));

const improvements = {
  "SAPSC-024": {
    answer: "I baseline ECC users, roles, SoD and critical-access results, custom transactions, interfaces and usage before conversion, then map them to the S/4 process and Simplification Item impact. I decide which roles can be remediated and regenerated after SU25, which must be redesigned for Fiori or replaced transactions, and which GRC Access Control connectors, sync jobs and ruleset functions must be retargeted. Build work covers SU25 reconciliation, SU24 updates, Fiori catalog assignment where in scope, and Access Control ruleset remediation for obsolete T-codes and services. I validate in quality with positive and negative authorization tests, ARA completeness against known fixtures—not job success alone—connector sync reconciliation, and cutover freeze, go/no-go and rollback criteria before Production. Exact object and transaction replacements are landscape-specific.",
    must_include: ["ECC baseline", "SU25 and redesign decision", "connector and ruleset retarget", "ARA completeness vs job success", "cutover freeze go/no-go rollback"],
    must_not: ["copy ECC roles unchanged as the S/4 model", "treat Public Edition Maintain Business Roles as PFCG brownfield"],
    verification_status: "internally_reviewed",
    change_rationale: "Added explicit connector/ruleset retarget, ARA completeness criterion, and cutover controls for brownfield practicality."
  },
  "SAPSC-025": {
    answer: "I design greenfield S/4 roles from future-state processes and job duties, not from legacy ECC menus. I set naming, ownership, SoD principles, org-level strategy and whether Private Edition/on-premise PFCG or Public Edition business roles apply. Build uses task-based Fiori catalogs, Spaces or Pages where used, SU24 as the proposal source, and an S/4-compatible Access Control ruleset from the start. I plan DEV/QA/PRD transport of roles and GRC content, UAT with positive and negative tests, and hypercare defect routing. I do not invent personal project metrics, and I keep IAG Role Designer separate when cloud IAG is also in scope.",
    must_include: ["future-state processes", "edition-correct role model", "SU24 discipline", "S/4-compatible ruleset", "UAT positive and negative"],
    must_not: ["lift ECC roles as greenfield design", "confuse IAG Role Designer with PFCG"],
    verification_status: "internally_reviewed",
    change_rationale: "Clarified edition boundary, SU24, ruleset-from-day-one and test expectations."
  },
  "SAPSC-057": {
    aliases: ["GRC batch jobs connector monitoring", "monitor Access Control synchronization jobs"],
    must_not: ["answering what a connector is", "connector configuration procedure", "source versus target definition"],
    change_rationale: "Narrow aliases/must_not so monitoring does not steal connector definition or configure questions."
  },
  "SAPSC-058": {
    aliases: ["GRC user role sync failure", "authorization synchronization job failure"],
    must_not: ["answering what a connector is", "end-to-end connector configuration guide"],
    change_rationale: "Removed overly broad connector sync troubleshooting alias that collided with connector setup prompts."
  },
  "SAPSC-069": {
    answer: "I baseline in-scope Access Control risks, mitigations, role assignments, privileged-access arrangements and evidence sources before migration, then map each control to the target S/4 architecture. Testing covers changed transactions and OData services, regenerated roles, connector sync completeness, ARA fixtures, ARM provisioning samples if enabled, and Process Control evidence only when PC is actually in scope. I require positive and negative authorization tests, reconcile risk results to data freshness, and record defects to owners before cutover sign-off. A green migration job is not control assurance by itself.",
    must_include: ["pre-migration baseline", "connector sync completeness", "ARA fixtures", "positive and negative tests", "edition and product scope"],
    must_not: ["assuming Process Control CCM replaces Access Control ARA", "job success as sole control proof"],
    verification_status: "internally_reviewed",
    change_rationale: "Tied control testing to connector freshness, ARA fixtures and product boundaries."
  },
  "SAPSC-082": {
    answer: "I structure delivery as discovery, target design, build, test, cutover and hypercare. Discovery inventories systems, users, roles, SoD, connectors and interfaces. Design sets role principles, Access Control processes, ruleset ownership and identity-plane boundaries. Build covers PFCG or cloud business roles as applicable, SU24, MSMP/BRF+ where used, connectors and sync jobs. Test includes unit, integration, UAT, negative access, ARA completeness and provisioning proofs. Cutover uses freeze windows, transport sequence, go/no-go evidence and rollback; hypercare tracks access defects and connector failures to owners. Client landscape decides IDM, IAG Bridge or direct provisioning—those are explicit forks, not assumed defaults.",
    must_include: ["phased delivery", "connectors in discovery and build", "ARA and provisioning tests", "go/no-go and rollback", "landscape forks"],
    must_not: ["one universal provisioning architecture"],
    verification_status: "internally_reviewed",
    change_rationale: "Made phases operational and called out connector/provisioning architecture forks."
  },
  "SAPSC-083": {
    answer: "In Discover and Prepare I lock scope, systems, stakeholders and security assumptions. Explore validates role principles, SoD, access ownership and Fit-to-Standard security impacts. Realize builds roles, SU24, Access Control workflows, connectors and ruleset remediation with quality gates. Deploy executes cutover runbooks, connector retarget validation, emergency access readiness and audit evidence packs. Run covers UAR, job and connector monitoring, and defect SLAs. I keep Access Control, Process Control and IAG workstreams distinct in the RACI when more than one product is in scope.",
    must_include: ["Activate phases", "connectors in Realize/Deploy", "product-separated RACI", "evidence packs"],
    must_not: ["merging IAG PAM with Access Control EAM as one workstream"],
    verification_status: "internally_reviewed",
    change_rationale: "Added connector validation and AC/PC/IAG separation into Activate narrative."
  },
  "SAPSC-084": {
    answer: "I publish a cutover runbook with role and user freeze, transport order, connector and sync job sequencing, emergency access, reconciliation owners and business validation scripts. Each step has entry/exit criteria and evidence. Go/no-go requires destination health, sync reconciliation samples, ARA fixture results and critical-process access tests—not completion percentage alone. Rollback distinguishes technical failure from business access defects and preserves a governed break-glass path. I rehearse on production-like data before the freeze.",
    must_include: ["freeze and sequencing", "connector sync in go/no-go", "ARA fixtures", "rollback criteria", "rehearsal"],
    must_not: ["optimism-based go-live"],
    verification_status: "internally_reviewed",
    change_rationale: "Strengthened go/no-go evidence to include connector and ARA completeness."
  },
  "SAPSC-086": {
    answer: "I map business scenarios to roles, expected allow/deny outcomes, SoD conditions, apps and connectors in scope. The plan includes positive paths, negative org and activity tests, firefighter or PAM cases as designed, provisioning samples and ARA known fixtures. Defects are classified by layer—catalog, backend object, DCL, connector, workflow or ruleset—so owners fix the right component before UAT sign-off.",
    must_include: ["positive and negative tests", "layer-classified defects", "ARA fixtures", "connector in scope when used"],
    must_not: ["UAT as happy-path only"],
    verification_status: "internally_reviewed",
    change_rationale: "Added defect-layer taxonomy and ARA/connector testing expectations."
  },
  "SAPSC-090": {
    answer: "I compare source landscape, target architecture, process change, custom code, regulatory scope and the access-risk baseline, then choose remediate-and-migrate versus redesign for each role family. Connector and Integration Framework retarget, ruleset remediation and identity provisioning path—direct ABAP, IDM or IAG Bridge—are explicit decision points. I quantify temporary dual maintenance, test effort and residual risk, and I refuse a strategy that copies ECC roles and ECC connectors unchanged into S/4 without SU25 and sync proof.",
    must_include: ["remediate versus redesign", "connector retarget decision", "provisioning path fork", "reject unchanged ECC copy"],
    must_not: ["universal greenfield-only advice for brownfield"],
    verification_status: "internally_reviewed",
    change_rationale: "Added connector and provisioning-path decision criteria to migration strategy."
  }
};

const qaRows = [];
for (const entry of bank.questions) {
  const orig = original.questions.find((q) => q.id === entry.id);
  const imp = improvements[entry.id];
  let changed = false;
  const fixes = [];
  if (imp) {
    if (imp.answer && imp.answer !== entry.answer) {
      entry.answer = imp.answer;
      changed = true;
      fixes.push("answer");
    }
    if (imp.must_include) {
      entry.must_include = imp.must_include;
      changed = true;
      fixes.push("must_include");
    }
    if (imp.must_not) {
      entry.must_not = [...new Set([...(entry.must_not || []), ...imp.must_not])];
      changed = true;
      fixes.push("must_not");
    }
    if (imp.aliases) {
      entry.aliases = imp.aliases;
      changed = true;
      fixes.push("aliases");
    }
    if (imp.verification_status) entry.verification_status = imp.verification_status;
  } else {
    const first = String(entry.answer || "").split(/(?<=\.)\s+/)[0] || "";
    const genericOpen = /^(A |An |The |In general|Typically|Overall)\b/i.test(first) && first.length > 120;
    if (genericOpen) fixes.push("flagged_generic_opening_unfixed");
  }
  if (!Array.isArray(entry.source_refs)) entry.source_refs = [];
  if (!entry.verification_status || String(entry.verification_status).startsWith("draft")) {
    entry.verification_status = changed
      ? "internally_reviewed"
      : "internally_reviewed_only_no_authoritative_source_pass";
  }
  qaRows.push({
    id: entry.id,
    question: entry.question,
    status: entry.verification_status,
    changed,
    fixes,
    change_rationale: imp?.change_rationale || null,
    answer_unchanged_from_archive: orig ? orig.answer === entry.answer : null,
    source_refs: entry.source_refs
  });
}

bank.version = "1.1-post-audit";
bank.audit_note = "Substantive updates limited to migration/implementation practicality and connector-collision alias hygiene. Full Help Portal verification was not completed for all 100 records.";
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);

const report = {
  generated_at: new Date().toISOString(),
  archive_path: archivePath,
  archive_sha256_json: "2d05acffcb27c3d462f20de8d242b305c57eab21b64f73c3407ec0d109398994",
  top100_path: bankPath,
  counts: {
    total: qaRows.length,
    changed: qaRows.filter((r) => r.changed).length,
    unchanged: qaRows.filter((r) => !r.changed).length,
    source_verified_help_portal: qaRows.filter((r) => /help_portal|source.verified/i.test(r.status)).length,
    internally_reviewed: qaRows.filter((r) => /internally_reviewed/i.test(r.status)).length,
    needs_landscape: qaRows.filter((r) => /needs_release/i.test(r.status)).length
  },
  provenance_note: "Observed generic connector answer traced to knowledge/grc/connectors.md interview prose via generation/retrieval; Top-100 had no connector-definition ID. what-is-grc PREPARED_SCRIPT could steal connector wording.",
  records: qaRows
};
fs.writeFileSync("data/answer-bank/QA_REPORT_Top100_audit_2026-10-22.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.counts, null, 2));
console.log("changed ids", qaRows.filter((r) => r.changed).map((r) => r.id).join(","));
