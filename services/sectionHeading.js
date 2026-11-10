function normalizeHeadingText(text) {
  return String(text || "").toLowerCase().replace(/[^\w\s/.-]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeIssueLanguage(text) {
  return normalizeHeadingText(text)
    .replace(/\b(?:can t|cannot|unable to)\s+(?:see|find|locate)\b/g, "missing")
    .replace(/\bnot visible\b/g, "missing")
    .replace(/\b(?:tile|app)\s+(?:does not|doesn t)\s+appear\b/g, "missing");
}

/**
 * 1 when the section heading's content words appear, in order, as whole words
 * in the question. Single-word headings such as "Overview" stay at 0.
 * This is section identity, not a boost for any one product term.
 */
function headingAlignment(question, heading) {
  const headingTokens = normalizeIssueLanguage(heading).split(" ").filter((token) => token.length >= 4);
  if (headingTokens.length < 2) return 0;
  const query = ` ${normalizeIssueLanguage(question)} `;
  return headingTokens.every((token) => query.includes(` ${token} `)) ? 1 : 0;
}

const NAMED_SOURCE_PATTERNS = Object.freeze([
  ["ips", /\b(?:ips|identity provisioning)\b/i],
  ["ias", /\b(?:ias|identity authentication)\b/i],
  ["iag", /\b(?:iag|identity access governance)\b/i],
  ["idm", /\b(?:idm|identity management)\b/i],
  ["ariba", /\bariba\b/i],
  ["datasphere", /\bdatasphere\b/i],
  ["sac", /\b(?:sac|analytics cloud)\b/i],
  ["process-control", /\b(?:SAP GRC )?Process Control\b/i],
  ["brm", /\b(?:\bbrm\b|business role management)\b/i],
  ["pfcg", /\b(?:\bpfcg\b|profile generator)\b/i],
  ["ara", /\b(?:\bara\b|access risk analysis)\b/i],
  ["msmp", /\bmsmp\b/i],
  ["firefighter", /\b(?:firefighter|eam)\b/i],
  ["cutover", /\bcutover\b/i],
  ["hypercare", /\bhypercare\b/i]
]);

/**
 * Prefer a knowledge file whose name is the product the question actually names.
 * A chunk that names none of those products is pushed down. This is document
 * identity, not a per-question answer.
 */
function namedSourceAdjustment(question, chunk = {}) {
  const asked = NAMED_SOURCE_PATTERNS
    .filter(([, pattern]) => pattern.test(String(question || "")))
    .map(([source]) => source);
  if (!asked.length) return 0;
  const file = `${chunk.sourceFolder || ""} ${chunk.sourceFile || ""}`.toLowerCase().replace(/\.md\b/g, " ");
  const normalizedFile = ` ${file.replace(/[^a-z0-9]+/g, " ").trim()} `;
  if (asked.some((token) => normalizedFile.includes(` ${token.replace(/[^a-z0-9]+/g, " ").trim()} `))) return 0.22;
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
  const asksConfigure = /\b(how (?:do|would|to)\b.{0,40}\bconfigur|configur(?:e|ation|ing)\b|integrat(?:e|ion|ing)\b|attach|link|route|set up|implement)\b/i.test(q)
    || /configur|implement/i.test(intent)
    || /configuration|implementation/i.test(category);
  // Central vs decentral EAM / Firefighter deploy (and central-GRC failover) must rank even
  // when the ask is conceptual/comparison — those questions never set configure/trouble intent.
  const asksEamDeploy = (
    /\b(?:central(?:ized)?|decentral(?:ized)?)\b/i.test(q)
    && /\b(?:eam|firefighter|ff\s*ids?|emergency access)\b/i.test(q)
  ) || (
    /\b(?:unavailable|offline|outage|failover)\b/i.test(q)
    && /\b(?:(?:central\s+)?grc|eam|firefighter|ff\s*ids?)\b/i.test(q)
  );
  if (!asksTrouble && !asksDelivery && !asksConfigure && !asksEamDeploy) return 0;
  const wrapperHeading = /\b(what makes|common interview|red flags|hidden expectations|keywords|tough follow|interview summary|\d+ second interview answer)\b/i.test(heading);
  const procedureHeading = asksTrouble
    ? /\b(troubleshoot|troubleshooting|diagnos|diagnostic|investigation|triage|failing authorization|service not active|symptom|problem|missing app|failed entities)\b/i.test(heading)
    : asksConfigure
      ? /\b(configur|technical configuration|agent rule|initiator rule|integrate|implementation|runtime flow)\b/i.test(heading)
      : /\b(runtime flow|best practices|implementation|cutover|hypercare|go-live|configuration|troubleshoot)\b/i.test(heading);
  const deliveryBody = /\b(runbook|rehearsal|rollback|go\/no-go)\b/i.test(content);
  let delta = 0;
  // A visibility failure and a request-time failure are different diagnostic stages.
  // Carry that distinction across products using the question and section language.
  const normalizedQuestion = normalizeIssueLanguage(q);
  const asksMissing = /\b(missing|no tile|not found|unavailable)\b/i.test(normalizedQuestion);
  const asksAfterLaunch = /\b(app opens|opens? but|launches? but|http\s*\d{3}|odata|runtime|authorization fails?|access denied|request fails?)\b/i.test(normalizedQuestion);
  const sectionEvidence = `${heading} ${content}`;
  const sectionMissing = /\b(missing|no tile|not found|app is missing|absent from app finder)\b/i.test(sectionEvidence);
  const sectionAfterLaunch = /\b(app opens|opens?|launches?|http\s*\d{3}|odata|runtime|authorization|request fails?|service not active)\b/i.test(sectionEvidence);
  if ((asksMissing && sectionAfterLaunch && !sectionMissing)
    || (asksAfterLaunch && sectionMissing && !sectionAfterLaunch)) delta -= 0.55;
  if ((asksMissing && sectionMissing) || (asksAfterLaunch && sectionAfterLaunch)) delta += 0.18;
  // A diagnostic query must retrieve the operational procedure ahead of interview
  // summaries and generic support prose. Keep this a shared heading signal across
  // products rather than encoding one keyword recipe per SAP domain.
  if (procedureHeading) delta += 0.28;
  if (asksDelivery && deliveryBody) delta += 0.12;
  if (wrapperHeading) delta -= 0.24;
  else if ((asksTrouble || asksConfigure) && !procedureHeading) delta -= 0.20;
  if (asksDelivery && /\barchitecture\b/i.test(heading) && !deliveryBody) delta -= 0.16;
  // Keep MSMP workflow how-tos on MSMP configure/troubleshoot sections rather than
  // neighboring BRF agent-rule essays when the question did not ask for BRF+.
  const asksMsmp = /\bMSMP\b|\bGRFNMW_CONFIGURE\b|\bstuck (?:approval )?workflow\b|\bno approver\b/i.test(q);
  const asksBrf = /\bBRF\+?\b|\bBRFplus\b|\bBRF\s*plus\b/i.test(q);
  if (asksConfigure && asksMsmp && !asksBrf && /^configure an msmp\b/i.test(heading)) delta += 0.22;
  if (asksConfigure && asksMsmp && !asksBrf && /\b(?:agent rule|initiator rule)\b/i.test(heading)) delta -= 0.28;
  if (asksConfigure && asksBrf && /\b(?:agent rule|initiator rule|brf)\b/i.test(heading)) delta += 0.22;

  // Capability-aware GRC ranking: SoD / ARA / business-risk-report asks must not lose to
  // MSMP "troubleshooting" headings merely because deliveryProcedureAdjustment rewards
  // the word troubleshooting (+0.28) and demotes headings without it (-0.20).
  const asksAraCapability = !asksMsmp && /\b(?:ARA|access risk analysis|SoD|segregation of duties|risk violations?|excessive (?:SoD |sod )?violations?|business reports?.{0,40}(?:sod|violation|risk)|GRAC_BATCH_RISK_ANALYSIS|ruleset)\b/i.test(q);
  const asksEamCapability = /\b(?:EAM|firefighter|ff\s*ids?|emergency access|fflog|GRACFFLOG)\b/i.test(q)
    && !asksMsmp
    && !asksAraCapability;
  const headingMsmpOnly = /\b(?:msmp|grfnmw|workflow|approver|initiator rule|agent rule)\b/i.test(heading)
    && !/\b(?:ara|sod|risk analysis|risk violation|business report|ruleset)\b/i.test(heading);
  const headingAra = /\b(?:ara|sod|risk analysis|risk violation|business report|ruleset|GRAC_BATCH|access risk)\b/i.test(heading);
  const headingEam = /\b(?:eam|firefighter|ff\s*id|emergency access|fflog|GRACFF)\b/i.test(heading);
  if (asksAraCapability) {
    if (headingAra) delta += 0.42;
    if (headingMsmpOnly) delta -= 0.55;
    // Do not let a generic "troubleshooting" label outweigh ARA technical relevance.
    if (asksTrouble && /\btroubleshoot/i.test(heading) && headingMsmpOnly) delta -= 0.28;
  }
  if (asksEamCapability) {
    if (headingEam) delta += 0.42;
    if (headingMsmpOnly && !headingEam) delta -= 0.45;
  }
  if (asksMsmp && !asksAraCapability) {
    if (/\b(?:msmp|grfnmw|initiator|agent rule|workflow path)\b/i.test(heading)) delta += 0.22;
    if (headingAra && !/\b(?:msmp|workflow|arm|access request)\b/i.test(heading)) delta -= 0.25;
  }

  // Prefer Q109-class headings over GRAC_SPM interview answers, connector groups, or sync ops.
  if (asksEamDeploy) {
    if (/central vs\.?\s*decentralized emergency access|q109|centralized|decentralized|firefighting/i.test(heading)) {
      delta += 0.42;
    }
    if (wrapperHeading || /\b(?:red flags|what makes|connector groups?|repository sync)\b/i.test(heading)) {
      delta -= 0.35;
    }
    if (/\b(?:repository sync|connector groups?)\b/i.test(heading)
      && !/\b(?:firefighter|eam|emergency|central|decentral)\b/i.test(heading)) {
      delta -= 0.4;
    }
  }
  return delta;
}

module.exports = { headingAlignment, namedSourceAdjustment, deliveryProcedureAdjustment };
