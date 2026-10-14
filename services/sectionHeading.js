function normalizeHeadingText(text) {
  return String(text || "").toLowerCase().replace(/[^\w\s/.-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 1 when the section heading's content words appear, in order, as whole words
 * in the question. Single-word headings such as "Overview" stay at 0.
 * This is section identity, not a boost for any one product term.
 */
function headingAlignment(question, heading) {
  const headingTokens = normalizeHeadingText(heading).split(" ").filter((token) => token.length >= 4);
  if (headingTokens.length < 2) return 0;
  const query = ` ${normalizeHeadingText(question)} `;
  return headingTokens.every((token) => query.includes(` ${token} `)) ? 1 : 0;
}

const NAMED_SOURCE_TOKENS = ["ips", "ias", "iag", "idm", "ariba", "datasphere", "sac", "cutover", "hypercare"];

/**
 * Prefer a knowledge file whose name is the product the question actually names.
 * A chunk that names none of those products is pushed down. This is document
 * identity, not a per-question answer.
 */
function namedSourceAdjustment(question, chunk = {}) {
  const query = ` ${normalizeHeadingText(question)} `;
  const asked = NAMED_SOURCE_TOKENS.filter((token) => query.includes(` ${token} `));
  if (!asked.length) return 0;
  const file = `${chunk.sourceFolder || ""} ${chunk.sourceFile || ""}`.toLowerCase().replace(/\.md\b/g, " ");
  const fileTokens = new Set(file.split(/[^a-z0-9]+/).filter(Boolean));
  if (asked.some((token) => fileTokens.has(token))) return 0.22;
  const content = ` ${normalizeHeadingText(chunk.content || "")} `;
  if (asked.some((token) => content.includes(` ${token} `))) return 0;
  return -0.2;
}

/**
 * Prefer the section that holds the procedure over a FAQ or essay heading.
 * Cutover and troubleshooting questions use the same rule. The number of
 * retrieved chunks does not change.
 */
function deliveryProcedureAdjustment(question, chunk = {}, analysis = {}) {
  const q = String(question || "");
  const heading = String(chunk.heading || chunk.section || "");
  const content = String(chunk.content || "").slice(0, 900);
  const intent = String(analysis.primaryIntent || analysis.intent || "");
  const category = String(analysis.category || "");
  const asksTrouble = /\b(troubleshoot|investigat|triage|triaged|failed|failure|error|inspect|isolate|stuck|no approver|missing approver|not routing|submitted status|what do you check|what do you look at|what evidence|diagnostic steps)\b/i.test(q)
    || /\b(how|where|what)\b.{0,32}\bdiagnos(?:e|ing|is)\b/i.test(q)
    || /troubleshoot|diagnos|production support/i.test(intent)
    || /troubleshoot|production support/i.test(category);
  const asksDelivery = /\b(cutover|hypercare|go-live|go live|implement)\b/i.test(q);
  if (!asksTrouble && !asksDelivery) return 0;
  const wrapperHeading = /\b(what makes|common interview|red flags|hidden expectations|keywords|tough follow|interview summary|\d+ second interview answer)\b/i.test(heading);
  const procedureHeading = asksTrouble
    ? /\b(troubleshoot|troubleshooting|diagnos|diagnostic|investigation|triage|failing authorization|service not active|symptom|problem|missing app|failed entities)\b/i.test(heading)
    : /\b(runtime flow|best practices|implementation|cutover|hypercare|go-live|configuration|troubleshoot)\b/i.test(heading);
  const deliveryBody = /\b(runbook|rehearsal|rollback|go\/no-go)\b/i.test(content);
  let delta = 0;
  // A diagnostic query must retrieve the operational procedure ahead of interview
  // summaries and generic support prose. Keep this a shared heading signal across
  // products rather than encoding one keyword recipe per SAP domain.
  if (procedureHeading) delta += 0.28;
  if (asksDelivery && deliveryBody) delta += 0.12;
  if (wrapperHeading) delta -= 0.24;
  else if (asksTrouble && !procedureHeading) delta -= 0.20;
  if (asksDelivery && /\barchitecture\b/i.test(heading) && !deliveryBody) delta -= 0.16;
  return delta;
}

module.exports = { headingAlignment, namedSourceAdjustment, deliveryProcedureAdjustment };
