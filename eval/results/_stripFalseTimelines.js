const fs = require("fs");

function replaceSection(file, heading, body) {
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf(`## ${heading}\n`);
  if (start < 0) throw new Error(`${heading} missing in ${file}`);
  const after = text.indexOf("\n## ", start + 4);
  const next = text.slice(0, start) + `## ${heading}\n\n${body}\n` + text.slice(after);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, file);
}

const architecture = `The lifecycle follows SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run. Do not publish a universal month count. The approved plan owns the schedule. A new implementation uses a new installation and the Migration Cockpit. A system conversion uses Software Update Manager for one existing ERP system. Selective data transition uses the verified company-code and time-slice scenario, or a separately contracted tool. Security confirms scope in Explore, builds and tests in Realize, and joins the Deploy go/no-go review.`;

for (const file of [
  "knowledge/project-types/greenfield.md",
  "knowledge/project-types/brownfield.md",
  "knowledge/project-types/bluefield.md"
]) {
  replaceSection(file, "Architecture", architecture);
  console.log("architecture", file);
}

const replacements = [
  ["knowledge/project-types/greenfield.md", "Greenfield longer timeline (18-24 mo), brownfield faster (12-15 mo).", "A new implementation is a new installation. A system conversion reuses one existing ERP system. Do not quote a universal duration."],
  ["knowledge/project-types/greenfield.md", "18-24 months. Longer than upgrades because infrastructure, processes, and team expertise built in parallel. Can be accelerated to 12-15 months with strong team and clear scope.", "There is no universal duration. The approved plan sets the schedule after scope, landscape, and data-migration evidence."],
  ["knowledge/project-types/greenfield.md", "Root cause: Greenfield projects are long (18-24 months); team members move on.", "Root cause: a long programme can lose named owners. The control is role ownership and a documented handover, not a fixed month count."],
  ["knowledge/project-types/greenfield.md", "(2) **realistic timeline expectations** (18-24 months is normal)", "(2) a schedule owned by the approved plan"],
  ["knowledge/project-types/greenfield.md", "Underestimating timeline (assuming 12 months when 18-24 is normal)", "Quoting a universal duration instead of the approved plan"],
  ["knowledge/project-types/greenfield.md", "Infrastructure, 18-24 months, phased rollout", "New installation, Migration Cockpit, and the approved rollout plan"],
  ["knowledge/project-types/brownfield.md", "ECC systems have 80-90% custom code; brownfield must assess each: keep it (if competitive), rearchitect to SAP standard, or decommission. This assessment and rearchitecture is most difficult and time-consuming phase.", "Assess each modification from the simplification and custom-code evidence. Keep, redesign, or retire it. Do not quote a universal customization percentage."],
  ["knowledge/project-types/brownfield.md", "12-15 months typical (faster than greenfield because infrastructure/org exists, but higher complexity). Can stretch to 18+ months if heavy customization rearchitecture needed.", "There is no universal duration. The source release, add-ons, and custom-code result set the schedule."],
  ["knowledge/project-types/brownfield.md", "Rough estimates: 20-30% truly competitive (worth rearchitecting), 70-80% are legacy inertia (can be standardized with retrain). Detailed analysis: 30-50 modifications as samples, extrapolate findings.", "Do not use a universal percentage. Sample the custom-code assessment and record each decision."],
  ["knowledge/project-types/brownfield.md", "Realistic timeline (12-15 months) and risk mitigation", "Supported source release, simplification evidence, and risk mitigation"],
  ["knowledge/project-types/bluefield.md", "Greenfield: all new (18-24 mo). Brownfield: all legacy migration (12-15 mo). Bluefield: hybrid (15-18 mo, some new + some legacy).", "New implementation, system conversion, and selective data transition are different paths. Do not assign a universal duration to any of them."],
  ["knowledge/project-types/bluefield.md", "15-18 months (between greenfield 18-24 and brownfield 12-15). Depends on integration complexity and phasing strategy.", "There is no universal duration. The selected company codes, time slice, and integrations set the schedule."],
  ["knowledge/project-types/bluefield.md", "Realistic timeline (15-18 months, longer than brownfield)", "Named company-code scope, time slice, and reconciliation evidence"],
  ["knowledge/project-types/upgrade.md", "Brownfield: Legacy customizations (80-90%), schema changes, data migration. Effort: 12-15 months.", "System conversion: one existing ERP system, simplification assessment, and Software Update Manager. Do not quote a universal customization percentage or duration."],
  ["knowledge/project-types/upgrade.md", "Upgrade shorter (6-12 mo), brownfield longer (12-15 mo).", "An upgrade changes the release of the same product. A system conversion changes SAP ERP to SAP S/4HANA. Do not quote a universal duration."],
  ["knowledge/project-types/upgrade.md", "Faster (upgrade 12-18 mo, greenfield 18-24 mo). Less risky (same data, less migration). Preserves existing customizations (that still work). Cost lower.", "An upgrade keeps the same system and data model family. A new implementation is a new installation. Compare the supported path, not a universal duration."]
];

for (const [file, from, to] of replacements) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(from)) {
    console.log("missing", file, from.slice(0, 60));
    continue;
  }
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, text.replace(from, to));
  fs.renameSync(tmp, file);
  console.log("line", file);
}
