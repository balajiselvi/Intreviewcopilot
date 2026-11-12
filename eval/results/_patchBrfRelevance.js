const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "../../lib/procedureRetention.js");
const lines = fs.readFileSync(file, "utf8").split(/\n/);

function replaceLineStarting(prefix, next) {
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) throw new Error(`line not found: ${prefix}`);
  lines[index] = next;
  return index;
}

replaceLineStarting(
  "const ACTION = ",
  "const ACTION = /\\b(open|check|confirm|compare|read|run|start|form|download|upload|import|export|edit|select|choose|browse|monitor|process|activate|assign|transport|review|validate|freeze|agree|exit|close|follow|use|reproduce|inspect|verify|capture|isolate|correct|sign in|log out|scope|maintain|link|map|define|configure|build|deploy|develop|expose|protect|perform|complete|identify|distinguish|restrict|retain|document|trace|prepare|support|generate|attach|declare|regenerate|test)\\b/i;"
);

replaceLineStarting(
  "const CONCRETE = ",
  "const CONCRETE = /\\b(log|logs|trace|failed|failure|error|job|jobs|restart|runbook|rollback|rehearsal|connector|transformation|source system|target system|communication scenario|cloud connector|transaction|catalog|authorization|ruleset|rule set|business function group|workflow template|business rule|role collection|permission|privilege|policy|mapping|configuration|go\\/no-go|hypercare|cutover|workflow|process id|initiator|routing|path|stage|approver|agent determination|agent rule|initiator rule|decision table|rule_result|service|application|app|odata|cds|data model|deployment)\\b/i;"
);

const start = lines.findIndex((line) => line.includes("const asksMsmp = /\\bMSMP\\b/i.test(normalizedQuestion);"));
const end = lines.findIndex((line, index) => index > start && line.trim() === "return score;");
if (start < 0 || end < 0) throw new Error(`BRF block bounds not found start=${start} end=${end}`);

const replacement = [
  "  const asksMsmp = /\\bMSMP\\b/i.test(normalizedQuestion);",
  "  const asksBrf = /\\bBRF\\+?\\b|\\bBRFplus\\b|\\bBRF\\s*plus\\b/i.test(normalizedQuestion);",
  "  const headingMsmp = /\\bMSMP\\b/i.test(headingText);",
  "  // Headings use BRFplus / BRF+ / BRF plus; \\bBRF\\b alone misses BRFplus and",
  "  // incorrectly treats those sections as MSMP-only (-24), dropping agent-rule procedures.",
  "  const headingBrf = /\\bBRF(?:\\+|plus)?\\b|\\bBRF\\s*plus\\b/i.test(headingText);",
  "  const asksStuck = /\\b(?:stuck|no approver|incorrectly routed|failed workflow)\\b/i.test(normalizedQuestion);",
  "  const headingTroubleshoot = /\\b(?:troubleshoot|stuck|no approver|diagnos)\\b/i.test(headingText);",
  "  const asksAgentDetermin = /\\b(?:agent(?:\\s+determination|\\s+rule)?|determin\\w*)\\b/i.test(normalizedQuestion);",
  "  const headingAgentRule = /\\b(?:agent rule|agent determination|initiator rule)\\b/i.test(headingText);",
  "  const headingConfigure = /\\bconfigur/i.test(headingText);",
  "  if (asksBrf && headingBrf) score += 28;",
  "  if (asksBrf && asksAgentDetermin && headingBrf && headingAgentRule) score += 36;",
  "  if (asksBrf && asksAgentDetermin && headingConfigure && headingBrf) score += 20;",
  "  if (asksBrf && headingMsmp && !headingBrf) score -= 24;",
  "  if (asksMsmp && asksStuck && headingTroubleshoot) score += 32;",
  "  if (asksMsmp && asksStuck && headingMsmp && !headingTroubleshoot && /configur|technical configuration/i.test(headingText)) score -= 18;",
  "  if (/\\b(?:how (?:do|would|to)|configur|troubleshoot|integrat)\\b/i.test(normalizedQuestion)",
  "    && /\\b(?:red flags|common interview|hidden expectations|keywords|\\d+\\s*second interview)\\b/i.test(headingText)) {",
  "    score -= 30;",
  "  }",
  "  return score;"
];

lines.splice(start, end - start + 1, ...replacement);
fs.writeFileSync(file, lines.join("\n"));
console.log("patched", file, "lines", start, "to", end);
