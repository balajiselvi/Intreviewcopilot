/**
 * Offline probe: does Implementation Activities alone produce shallow First/Next/Finally answers?
 * Fresh process; no provider calls.
 */
import fs from "fs";
import path from "path";
import { authoritativeProcedure, renderSpokenProcedure } from "../../lib/procedureRetention.js";

const cases = [
  ["Fiori", "How do you configure an SAP Fiori app in the launchpad?", "knowledge/s4hana/s4hana-fiori.md"],
  ["SAC", "How do you configure security for SAP Analytics Cloud?", "knowledge/sac/sac-security.md"],
  ["BW", "How do you configure BW analysis authorization?", "knowledge/bw/bw-security.md"],
  ["BTP", "How do you configure BTP security for a subaccount?", "knowledge/btp/btp-security.md"],
  ["IAS", "How do you configure IAS MFA and federation?", "knowledge/btp/ias.md"],
  ["IPS", "Walk me through configuring a joiner job in IPS.", "knowledge/btp/ips.md"],
  ["IAG", "How do you implement SAP Cloud IAG?", "knowledge/iag/iag-overview.md"],
  ["GRC-ARA", "How do you configure SAP Access Control ARA?", "knowledge/grc/ara.md"],
  ["PFCG", "How do you design a PFCG single role?", "knowledge/security/pfcg.md"],
  ["S4-Public", "How do you configure S/4HANA Cloud Public Edition security?", "knowledge/s4hana/s4hana-security.md"],
  ["HANA", "How do you configure HANA analytic privileges?", "knowledge/hana/hana-authorization.md"],
  ["Behavioral", "How do you handle conflict on a security project?", "knowledge/behavioral/conflict-resolution.md"]
];

function implSection(file) {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const idx = text.search(/^## Implementation Activities\s*$/m);
  if (idx < 0) return null;
  const rest = text.slice(idx);
  const afterHeading = rest.indexOf("\n");
  const bodySearch = rest.slice(afterHeading + 1).search(/\n## /);
  return bodySearch < 0 ? rest : rest.slice(0, afterHeading + 1 + bodySearch);
}

const rows = [];
for (const [domain, question, file] of cases) {
  const section = implSection(file);
  if (!section) {
    rows.push({ domain, status: "no-impl-section" });
    continue;
  }
  // Simulate indexed old Fiori inventory for negative control when file was rewritten.
  const fioriLegacy = [
    "### SOURCE: s4hana/s4hana-fiori.md | SECTION: Implementation Activities",
    "## Implementation Activities",
    "",
    "- Maintain OData service authorization for standard and custom Fiori apps",
    "- Validate backend authorization content is complete for every app granted launchpad access",
    "- Test the full app experience end to end, not just launchpad visibility"
  ].join("\n");
  const ctx = domain === "Fiori"
    ? fioriLegacy
    : `### SOURCE: ${file.replace(/\\/g, "/")} | SECTION: Implementation Activities\n${section}`;
  const steps = authoritativeProcedure(question, ctx, "");
  const spoken = renderSpokenProcedure(question, steps);
  rows.push({
    domain,
    status: steps.length ? "WOULD_SPEAK" : "REJECTED_OR_EMPTY",
    stepCount: steps.length,
    firstNextFinally: /^First,/i.test(spoken),
    preview: spoken.slice(0, 180)
  });
}

console.log(JSON.stringify(rows, null, 2));
const stillShallow = rows.filter((row) => row.firstNextFinally && !/PFCG|RSECADMIN|Cloud Connector|IAS|IPS|Job Logs|MSMP|BRF|Maintain Business|analytic privilege|role collection/i.test(row.preview || ""));
console.log("\nstillShallowCount", stillShallow.length);
console.log("stillShallow", JSON.stringify(stillShallow, null, 2));
