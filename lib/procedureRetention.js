const STEP_MARK = /\/[A-Z][A-Z0-9_]{2,}|\/UI2\/[A-Z0-9_]+|\b(?:PFCG|SU01|SU10|SU24|SU25|SU53|SUIM|STAUTHTRACE|SICF|SM59|SE38|SLG1|RSECADMIN|GRFNMW_CONFIGURE|RSRT2?|PUR\d{3}|BRF\+|MSMP|SPRO)\b|\b(?:Maintain Business (?:Users|Roles)|Manage Launchpad (?:Spaces|Pages)|Display Authorization Trace|Job Logs|Source Systems|Target Systems|Jobs tab|User Groups|Cloud Connector|communication scenario|Identity Provisioning|RAID|SAP Business Application Studio|SAP Fiori tools|service definition|service binding|CDS DCL|OData)\b/i;

const ACTION = /\b(open|check|confirm|compare|read|run|start|form|download|upload|import|export|edit|select|choose|browse|monitor|process|activate|assign\w*|transport|review\w*|validate|freeze|agree|exit|clos\w*|follow|use|reproduce|inspect|verify|capture|isolate|correct|sign in|log out|scope|maintain|link|map|define|configure|build|deploy|develop|expose|protect|perform\w*|complete|identify|distinguish|restrict|retain|document|trace|prepare|support|generate|attach|declare|regenerate|test|creat\w*|record\w*|schedule\w*|rout\w*)\b/i;
const CONCRETE = /\b(log|logs|trace|failed|failure|error|job|jobs|restart|runbook|rollback|rehearsal|connector|transformation|source system|target system|communication scenario|cloud connector|transaction|catalog|authorization|ruleset|rule set|business function group|workflow template|business rule|role collection|permission|privilege|policy|mapping|configuration|go\/no-go|hypercare|cutover|workflow|process id|initiator|routing|path|stage|approver|agent determination|agent rule|initiator rule|decision table|rule_result|service|application|app|odata|cds|data model|deployment|test plans?|assessment|control owner|issue owner|remediation plan|evidence|test activities?|retest|issue)\b/i;

export function questionProcedureIntent(question = "", answerScope = "") {
  const q = String(question || "");
  // Reuse the already-resolved interview scope. This covers natural phrasings such as
  // "the tile is visible but does nothing" without growing a product/symptom keyword list.
  if (answerScope === "STAGE_INVESTIGATION") return "troubleshoot";
  if (/\b(troubleshoot|investigat|diagnos|failed|failure|error|not working|stuck|no approver|incorrectly routed|rule[\s-]*result mapping|what do you check|what do you look at|diagnostic steps)\b/i.test(q)) return "troubleshoot";
  if (/\b(prove|proof)\b/i.test(q) && /\b(post|access|role|company)\b/i.test(q) && !/\b(cutover|hypercare|go-live)\b/i.test(q)) return "validate";
  // A design question that also asks how to verify access is a procedure, not an open architecture essay.
  if (/\bdesign\b/i.test(q) && /\bverif/i.test(q) && /\b(?:access|user|role|authorization)\b/i.test(q)) return "configure";
  if (/\bdesign\b/i.test(q) && /\b(?:security|authorization|access)\b/i.test(q)) return "configure";
  if (/\btrace\b/i.test(q) && /\b(?:confirm|complete|verif|authorization)\b/i.test(q)) return "configure";
  if (/\b(?:differ\w*|difference|between|changes)\b/i.test(q) && /\bpublic\b/i.test(q) && /\bprivate\b/i.test(q) && /\bedition\b/i.test(q)) return "configure";
  // A security-architecture question still has to name the product's authorization mechanism.
  // The retrieved procedure is spoken only when that product's source supplies one.
  if (/\barchitect/i.test(q) && /\b(?:security|authorization|access)\b/i.test(q)) return "configure";
  if (/\bwhat do you do during\b/i.test(q) && /\b(cutover|hypercare|go-live|go live)\b/i.test(q)) return "delivery";
  if (/\b(cutover and hypercare|hypercare and cutover|cutover runbook)\b/i.test(q)) return "delivery";
  if (/\b(?:prepare|support)\b/i.test(q) && /\b(?:sox|itgc|gdpr|iso\s*27001|isms|audit|compliance)\b/i.test(q)) return "configure";
  if (/\b(configur(?:e|ation|ing)?|implement(?:ed|ation|ing)?|integrat(?:e|ion|ing)|administ(?:er|ered|ration)|set up|setup|upload|import|export|maintain|creat(?:e|ing)|assign|attach|link|enable|activate)\b/i.test(q)) return "configure";
  if (/\bhow (?:do|did|would|to)\b/i.test(q) && /\b(?:provision|synchron|mapping|connector|authoriz\w*)\b/i.test(q)) return "configure";
  if (/\bhow (?:do|did|would|to)\b/i.test(q) && /\b(?:rollback|cutover|hypercare|go-live|go live)\b/i.test(q)) return "delivery";
  if (/\b(?:greenfield|brownfield|system conversion|selective data transition|new implementation|security workstream)\b/i.test(q)) return "configure";
  if (/\b(?:upgrade|update)\b/i.test(q) && /\b(?:difference|between|system conversion|support package|base release)\b/i.test(q)) return "configure";
  return "";
}

function sentenceClass(sentence, intent = "") {
  if (intent === "validate"
    && /\b(business transaction|business action|does not prove|not the success|failed check|only after)\b/i.test(sentence)) {
    return "validate";
  }
  // Configuration answers should retain their explicit validation step even when
  // it asks the reader to inspect an audit or execution log.
  if (intent === "configure"
    && /\b(test|verify|validat(?:e|ion|ing))\b/i.test(sentence)
    && /\b(stage|path|mapping|rules?|ruleset|role|service|account|catalog|configuration|approver|result|risk)\b/i.test(sentence)) {
    return "configure";
  }
  if (intent === "configure" && ACTION.test(sentence) && CONCRETE.test(sentence)) return "configure";
  if (/\b(log|logs|failed|failure|error text|trace|restart|source path|job execution|jobs tab|full read|delta read|diagnos)\b/i.test(sentence)) return "troubleshoot";
  if (/\b(runbook|rollback|rehearsal|hypercare|go-live|go\/no-go|cutover)\b/i.test(sentence)) return "delivery";
  if (intent !== "troubleshoot" && /\b(communication scenario|connector|transformation|source system|target system|cloud connector|jobs tab)\b/i.test(sentence)) return "configure";
  if (intent === "troubleshoot"
    && ACTION.test(sentence)
    && /\b(user|group|permission|authorization|role|service|request|workflow|job|query|data|filter|result|entity|target|source|account|requisition|realm|guid|procedure|privilege|object|schema)\b/i.test(sentence)) {
    return "troubleshoot";
  }
  return "general";
}

function isProcedureSentence(sentence, intent = "") {
  if (sentence.length < 40 || sentence.length > 420) return false;
  if (sentenceClass(sentence, intent) !== "general") return true;
  if (STEP_MARK.test(sentence)) return true;
  if (ACTION.test(sentence) && CONCRETE.test(sentence)) return true;
  return false;
}

function conflictsDeployment(question, sentence) {
  const q = String(question || "");
  const s = String(sentence || "");
  const namesEditionInQuestion = /public edition|public cloud|private edition|private cloud|on-premise|on premise/i.test(q);
  const asksUnqualifiedCloud = /\bS\/?4(?:HANA)?\s+Cloud\b/i.test(q) && !namesEditionInQuestion;
  const explicitPublic = /public edition|public cloud/i.test(q);
  const asksPublic = explicitPublic || asksUnqualifiedCloud;
  const asksPrivate = /private edition/i.test(q);
  const asksGateway = /on-premise|on premise|\bgateway\b/i.test(q);
  const namesPrivateTool = /\b(?:PFCG|STAUTHTRACE|SU53)\b|\/UI2\/FLPCM|\/IWFND\/|\/IWBEP\//.test(s);
  const namesPublicApp = /Maintain Business (?:Users|Roles)|Manage Launchpad Spaces|Display Authorization Trace|business catalog|restriction value|filtered check/i.test(s);
  if (/do not|not diagnosed/i.test(s)) return false;
  if (/\bonly\b/i.test(s) && !namesPrivateTool && !namesPublicApp) return false;
  // A sentence that names the other edition is the comparison, not a step for this one.
  if (explicitPublic && !asksPrivate && namesPrivateTool) return true;
  if ((asksPrivate || asksGateway) && !asksPublic && namesPublicApp) return true;
  return false;
}

function cleanSentence(sentence) {
  return String(sentence || "")
    .replace(/^#+\s+[A-Za-z][A-Za-z\s]{0,40}?\s+(?=(Open|Then|Use|For|If|Before|At|During|Confirm|Identity|A|The|Job|Source|Target|I)\b)/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractProcedureSteps(knowledgeText = "", limit = 8) {
  return selectProcedureSteps("", knowledgeText, limit);
}

/**
 * Ordered sentences from retrieved knowledge. A troubleshooting question keeps
 * diagnostic sentences, a configuration question keeps the setup sentences, and
 * a delivery question keeps the runbook sentences. This is not a per-product list.
 */
function procedureRows(paragraph, intent = "") {
  const text = String(paragraph || "").replace(/\s+/g, " ").trim();
  const questionProbe = text.replace(/`[^`]*`/g, " ");
  if (!text || questionProbe.includes("?")) return [];
  const protectedCode = [];
  const sentenceText = text.replace(/`[^`]*`/g, (code) => {
    const token = `\uE100${protectedCode.length}\uE101`;
    protectedCode.push(code);
    return token;
  });
  const rows = [];
  const seen = new Set();
  // Version decimals (for example, 12.0 and 10.1) are part of SAP release names,
  // not sentence boundaries. Keep them intact so the associated setup step survives.
  for (const raw of sentenceText.split(/(?<=[.!?])(?=\s|$)/)) {
    // Headings carry useful retrieval metadata, but are not spoken procedure steps.
    if (/^\s*#{1,6}\s+/.test(raw)) continue;
    const restored = raw.replace(/\uE100(\d+)\uE101/g, (_, index) => protectedCode[Number(index)]);
    const sentence = cleanSentence(restored);
    // Provenance remains attached to the source chunk for grounding, but it is
    // not part of a spoken interview answer. Avoid reading URLs and audit dates.
    if (/^(?:sources? checked|content verified|verified against|source:|references?:)\b/i.test(sentence)) continue;
    if (sentence.endsWith("?")) continue;
    if (!isProcedureSentence(sentence, intent)) continue;
    const key = sentence.slice(0, 90).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ sentence, kind: sentenceClass(sentence, intent) });
  }
  return rows;
}

function procedureBlocks(knowledgeText, intent = "") {
  const blocks = [];
  let activeHeading = "";
  for (const para of String(knowledgeText || "").split(/\n+/)) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // A retrieved chunk is its own evidence boundary. Never join neighboring chunks,
    // even when both happen to contain sentences that look procedural.
    if (/^#{1,3}\s+SOURCE:/i.test(trimmed)) {
      activeHeading = trimmed.match(/\|\s*SECTION:\s*(.*)$/i)?.[1]?.trim() || "";
      blocks.push({ rows: [], headed: true, sourceBoundary: true, heading: activeHeading });
      continue;
    }
    if (/^#{1,3}\s+/.test(trimmed)) {
      activeHeading = trimmed.replace(/^#{1,3}\s+/, "");
      blocks.push({ rows: [], headed: true, sectionBoundary: true, heading: activeHeading });
      continue;
    }
    const rows = procedureRows(trimmed, intent);
    if (rows.length) blocks.push({ rows, headed: false, heading: activeHeading, raw: trimmed });
  }
  return blocks;
}

const COMMON_QUERY_WORDS = new Set([
  "about", "after", "also", "and", "are", "but", "does", "for", "first", "from", "have", "help", "how", "into", "its", "just",
  "more", "most", "only", "should", "that", "them", "then", "there", "this", "through", "what",
  "when", "where", "which", "while", "with", "would", "your"
]);

function blockRelevance(question, rows, heading = "") {
  const normalizedQuestion = String(question || "")
    .replace(/\b(?:can't|cannot|unable to|does not|doesn't)\s+(?:see|find|locate|launch|open|start)\b/gi, "missing")
    .replace(/\bnot visible\b/gi, "missing")
    .replace(/\b(?:tile|app)\s+(?:does not|doesn't)\s+appear\b/gi, "missing");
  const terms = normalizedQuestion.toLowerCase().match(/[a-z0-9_/.-]{3,}/g) || [];
  const queryTerms = [...new Set(terms.filter((term) => !COMMON_QUERY_WORDS.has(term)))];
  if (!queryTerms.length) return 0;
  const evidence = rows.map((row) => row.sentence).join(" ").toLowerCase();
  const headingText = String(heading || "").toLowerCase();
  const asksOnPrem = /on-premise|on premise/i.test(normalizedQuestion);
  const headingOnPrem = /on-premise|on premise/i.test(headingText);
  const absenceQuestion = /\b(missing|no tile|not found|unavailable)\b/i.test(normalizedQuestion);
  const runtimeQuestion = /\b(app opens|opens? but|launches? but|http\s*\d{3}|odata|runtime|authorization fails?|access denied)\b/i.test(normalizedQuestion);
  const absenceHeading = /\b(missing|no tile|not found|app is missing)\b/i.test(headingText);
  const runtimeHeading = /\b(opens?|launches?|request fails?|odata|runtime|authorization|service not active)\b/i.test(headingText);
  if ((absenceQuestion && runtimeHeading && !absenceHeading)
    || (runtimeQuestion && absenceHeading && !runtimeHeading)) return -100;
  let score = queryTerms.reduce((total, term) => total + (headingText.includes(term) ? 4 : 0) + (evidence.includes(term) ? 1 : 0), 0);
  if (asksOnPrem && headingOnPrem) score += 30;
  const asksMsmp = /\bMSMP\b/i.test(normalizedQuestion);
  const asksBrf = /\bBRF\+?\b|\bBRFplus\b|\bBRF\s*plus\b/i.test(normalizedQuestion);
  const headingMsmp = /\bMSMP\b/i.test(headingText);
  // Headings use BRFplus / BRF+ / BRF plus; \bBRF\b alone misses BRFplus and
  // incorrectly treats those sections as MSMP-only (-24), dropping agent-rule procedures.
  const headingBrf = /\bBRF(?:\+|plus)?\b|\bBRF\s*plus\b/i.test(headingText);
  const asksStuck = /\b(?:stuck|no approver|incorrectly routed|failed workflow)\b/i.test(normalizedQuestion);
  const headingTroubleshoot = /\b(?:troubleshoot|stuck|no approver|diagnos)\b/i.test(headingText);
  const asksAgentDetermin = /\b(?:agent(?:\s+determination|\s+rule)?|determin\w*)\b/i.test(normalizedQuestion);
  const headingAgentRule = /\b(?:agent rule|agent determination|initiator rule)\b/i.test(headingText);
  const headingConfigure = /\bconfigur/i.test(headingText);
  if (asksBrf && headingBrf) score += 28;
  if (asksBrf && asksAgentDetermin && headingBrf && headingAgentRule) score += 36;
  if (asksBrf && asksAgentDetermin && headingConfigure && headingBrf) score += 20;
  if (asksBrf && headingMsmp && !headingBrf) score -= 24;
  if (asksMsmp && asksStuck && headingTroubleshoot) score += 32;
  if (asksMsmp && asksStuck && headingMsmp && !headingTroubleshoot && /configur|technical configuration/i.test(headingText)) score -= 18;
  // Prefer a Configure-* procedure whose product focus matches the question.
  // Do not let "Configure a BRFplus agent rule for MSMP" win a pure MSMP how-to.
  if (/\bhow (?:do|would|to)\b.{0,48}\bconfigur/i.test(normalizedQuestion) && /^configure\b/i.test(String(heading || "").trim())) {
    if (asksMsmp && !asksBrf && /\bmsmp\b/i.test(String(heading || "")) && !headingBrf) score += 40;
    else if (asksBrf && headingBrf) score += 34;
    else if (!asksMsmp && !asksBrf) score += 24;
  }
  if (asksMsmp && !asksBrf && headingBrf && headingAgentRule) score -= 45;
  if (/\b(?:how (?:do|would|to)|configur|troubleshoot|integrat)\b/i.test(normalizedQuestion)
    && /\b(?:red flags|common interview|hidden expectations|keywords|\d+\s*second interview)\b/i.test(headingText)) {
    score -= 30;
  }
  return score;
}

/**
 * Keep one retrieved procedure block, in its original order. A later paragraph
 * continues that block only when it has no new heading. Sentences inside the
 * block stay even when they name the handoff or the validation check.
 */
function commonIssueMatches(question, rows, raw = "") {
  const text = `${raw}\n${rows.map((row) => row.sentence).join(" ")}`;
  const labeled = text.match(/(?:common issue|root cause|resolution):\s*([^.]+)/gi);
  if (!labeled) return true;
  const generic = new Set(["common", "issue", "cause", "root", "resolution", "user", "users", "access", "role", "data", "system", "still", "appears", "shows", "their", "there", "after", "before", "since", "trigger"]);
  const q = String(question || "").toLowerCase();
  return labeled.some((piece) => {
    const tokens = piece.toLowerCase().match(/[a-z]{5,}/g) || [];
    return tokens.some((token) => !generic.has(token) && q.includes(token));
  });
}

function questionList(rows = []) {
  const questions = rows.filter((row) => String(row.sentence || "").trim().endsWith("?")).length;
  return questions >= 3 && questions >= Math.ceil(rows.length * 0.6);
}

function winningBlock(question, knowledgeText, answerScope = "") {
  const intent = questionProcedureIntent(question, answerScope);
  if (!intent) return [];
  const groups = [];
  for (const block of procedureBlocks(knowledgeText, intent)) {
    if (block.sourceBoundary || block.sectionBoundary) {
      groups.push({ rows: [], intentCount: 0, relevance: 0 });
      continue;
    }
    const intentCount = commonIssueMatches(question, block.rows, block.raw)
      ? block.rows.filter((row) => row.kind === intent).length
      : 0;
    const relevance = blockRelevance(question, block.rows, block.heading);
    const previous = groups[groups.length - 1];
    if (previous && !block.headed && intentCount > 0 && previous.intentCount > 0) {
      previous.rows.push(...block.rows);
      previous.intentCount += intentCount;
      previous.relevance += relevance;
    } else {
      groups.push({ rows: [...block.rows], intentCount, relevance, heading: block.heading || "" });
    }
  }
  const headingTerms = [...new Set((String(question || "").toLowerCase().match(/[a-z0-9]{5,}/g) || [])
    .filter((term) => !COMMON_QUERY_WORDS.has(term)))];
  const headingHits = (heading) => headingTerms.filter((term) => String(heading || "").toLowerCase().includes(term)).length;
  const candidates = groups
    .filter((group) => group.intentCount >= 3 && group.relevance >= 0 && !questionList(group.rows))
    .sort((a, b) => {
      const hitGap = headingHits(b.heading) - headingHits(a.heading);
      if (Math.abs(hitGap) >= 2) return hitGap;
      return (b.intentCount * 10 + b.relevance) - (a.intentCount * 10 + a.relevance);
    });
  for (const best of candidates) {
    const sentences = best.rows
      .filter((row) => row.kind === intent || (intent !== "validate" && row.kind === "general" && STEP_MARK.test(row.sentence)))
      .map((row) => row.sentence)
      .filter((sentence) => !conflictsDeployment(question, sentence));
    if (sentences.length >= 3) return sentences.slice(0, 14);
  }
  return [];
}

export function selectProcedureSteps(question = "", knowledgeText = "", limit = 6, answerScope = "") {
  // Never fall back to the first technically-sounding sentences in the prompt. They may
  // describe a neighboring product, edition, or symptom and turn useful retrieval into
  // confident cross-topic advice.
  const block = winningBlock(question, knowledgeText, answerScope);
  return block.slice(0, limit);
}

export function authoritativeProcedure(question = "", knowledgeText = "", answerScope = "") {
  const intent = questionProcedureIntent(question, answerScope);
  if (!intent) return [];
  if (/\bhave you\b/i.test(question) && !/\bhow\b/i.test(question)) return [];
  if (/\b(?:resource constraints?|change control|bypass(?:ed|ing)?|sponsor|stakeholder priority|vendor delay)\b/i.test(question)) return [];
  return winningBlock(question, knowledgeText, answerScope);
}

const REPORT_HEADING = /^(?:#{1,6}\s*)?(?:\d+\.\s*)?(?:direct answer|technical mechanism(?: and exact artifacts)?|technical explanation|validation and operational boundary|key takeaways|conclusion)\b[:\s-]*$/i;
const ARCHITECT_BULLET = /^\*\s*\*\*(?:Decision|Mechanism|Governance|Validation):\*\*/i;

export function shapeSpokenContract(answer = "") {
  const text = String(answer || "").trim();
  if (!text) return "";
  // Preserve the mandatory Decision → Mechanism → Governance → Validation bullets.
  if (ARCHITECT_BULLET.test(text) || /\*\s*\*\*Decision:\*\*/i.test(text)) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && !REPORT_HEADING.test(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  const spoken = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !REPORT_HEADING.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^\d+\.\s+/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return spoken || text;
}

export function renderSpokenProcedure(question = "", steps = []) {
  if (!Array.isArray(steps) || steps.length === 0) return "";
  const spokenSteps = steps.map((step) => cleanSentence(step)).filter(Boolean);
  if (spokenSteps.length < 3) return "";
  const isChecklist = spokenSteps.every((step) => /^[-*]\s+/.test(step));
  if (isChecklist) {
    const actions = spokenSteps.map((step) => step.replace(/^[-*]\s+/, ""));
    const spokenActions = actions.map((action, index) => {
      const match = action.match(/^([A-Za-z]+)(\s+.*)$/);
      const verb = match ? match[1].toLowerCase() : "";
      const remainder = match ? match[2] : ` ${action}`;
      const lead = index === 0 ? "First," : index === actions.length - 1 ? "Finally," : "Next,";
      const sentence = `${lead} ${verb}${remainder}`.replace(/\s+/g, " ").trim();
      return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
    });
    return `${spokenActions.join(" ")}${/[.!?]$/.test(spokenActions.at(-1)) ? "" : "."}`;
  }
  const directLead = /\bhow did you\b/i.test(question) ? "The documented procedure is: " : "";
  return `${directLead}${spokenSteps.join(" ")}`.trim();
}

const LENGTH_TARGETS = Object.freeze({
  concise: { min: 50, max: 90, prefer: 75 },
  medium: { min: 90, max: 150, prefer: 120 },
  lengthy: { min: 150, max: 250, prefer: 200 }
});

function wordCount(text = "") {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function isMandatorySpokenSentence(sentence = "", question = "") {
  const s = String(sentence || "");
  const q = String(question || "");
  // Slash-prefixed transactions are not word-bounded; do not require \b before /.
  if (/\/IWFND\/ERROR_LOG|\/IWBEP\/ERROR_LOG/i.test(s)) return true;
  if (/GET_INSUFFICIENT_PRIVILEGE_ERROR_DETAILS/i.test(s)
    && /(?:HANA|view|object|privilege)/i.test(q)) return true;
  // Keep affirmative tool/path sentences; skip pure "does not use X" distinctions
  // so they cannot crowd out the actual troubleshooting steps under a tight budget.
  if (/\bdoes not use\b/i.test(s) && !/\b(?:does not make|not proof)\b/i.test(s)) return false;
  if (/\b(?:SU53|STAUTHTRACE|Public Edition|PFCG|business task|Instance Status|Firefighter|does not make|not proof|certification)\b/i.test(s)) return true;
  if (/\b(?:cannot|can't|unable to|fails? to)\b.{0,64}\b(?:view|object|schema|data)\b/i.test(q)
    && /\b(?:object|schema|object type|missing privilege)\b/i.test(s)) return true;
  if (/\bFiori\b/i.test(q) && /\b(?:Maintain Business (?:Users|Roles)|target mapping)\b/i.test(s)) return true;
  if (/\bMSMP\b/i.test(q) && /\b(?:Maintain MSMP Workflows|Approvers of Selected Path|RULE_RESULT)\b/i.test(s)) return true;
  if (/\b(?:BRF|BRFplus)\b/i.test(q) && /\b(?:Agent Rule|decision table|initiator)\b/i.test(s)) return true;
  if (/\baccess requests?\b/i.test(q) && /\bprovision\w*\b/i.test(s)) return true;
  if (/\b(?:IAG|Role Design(?:er)?|build roles?)\b/i.test(q)
    && /\b(?:Role Designer|application-access|Assignment Approver|Content Approver|PFCG role administration)\b/i.test(s)) return true;
  if (/\bFirefighter\b/i.test(q) && /\b(?:GRAC_SPM|repository sync|controller)\b/i.test(s)) return true;
  if (/\brole collection\b/i.test(q) && /\b(?:trust|IdP|sign in again|role template)\b/i.test(s)) return true;
  if (/\bSuccessFactors\b/i.test(q) && /\b(?:target population|permission group|Manage Permission)\b/i.test(s)) return true;
  return false;
}

function sentencePriority(sentence = "", question = "") {
  const s = String(sentence || "");
  const q = String(question || "");
  let score = 1;
  if (STEP_MARK.test(s)) score += 4;
  if (isMandatorySpokenSentence(s, q)) score += 12;
  if (/\b(?:validat|verify|test|confirm|Instance Status|audit log|business task|prove)\b/i.test(s)) score += 3;
  if (/\b(?:troubleshoot|inspect|reproduce|stuck|no approver|root cause)\b/i.test(s) && /\b(?:stuck|troubleshoot|fail|error|no approver)\b/i.test(q)) score += 3;
  if (/\b(?:do not|rather than|not proof|does not make|cannot alone)\b/i.test(s)) score += 2;
  if (/\b(?:Public Edition|on-premise|Private Edition|PFCG|MSMP|BRF|SOX|GDPR|ISO)\b/i.test(s)) score += 2;
  return score;
}

/**
 * Keep a natural spoken procedure inside the selected response-length band.
 * Prefer high-signal technical sentences over truncating the last paragraph.
 */
export function fitSpokenLength(answer = "", responseLength = "medium", question = "") {
  const mode = ["concise", "medium", "lengthy"].includes(String(responseLength || "").toLowerCase())
    ? String(responseLength).toLowerCase()
    : "medium";
  const target = LENGTH_TARGETS[mode];
  const text = shapeSpokenContract(answer);
  if (!text) return "";
  // Four-bullet architect answers keep their structure; do not sentence-trim across bullets.
  if (/\*\s*\*\*Decision:\*\*/i.test(text) && /\*\s*\*\*Validation:\*\*/i.test(text)) {
    return text;
  }
  const protectedCode = [];
  const codeSafeText = text.replace(/`[^`]*`/g, (code) => {
    const token = `\uE200${protectedCode.length}\uE201`;
    protectedCode.push(code);
    return token;
  });
  const decimalSafeText = codeSafeText.replace(/(\d)\.(\d)/g, "$1\uE000$2");
  const sentences = decimalSafeText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((part) => part
      .replace(/\uE000/g, ".")
      .replace(/\uE200(\d+)\uE201/g, (_, index) => protectedCode[Number(index)])
      .trim())
    .filter(Boolean) || [text];
  if (sentences.length <= 1) return text;
  const count = wordCount(text);
  if (mode === "lengthy" && count <= target.max) return text;
  if (mode === "medium" && count >= target.min && count <= target.max) return text;
  if (mode === "concise" && count <= target.max && count >= Math.min(target.min, 40)) return text;

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      // Keep the opening sentence so the spoken answer still addresses the question.
      score: sentencePriority(sentence, question) + (index === 0 ? 20 : 0) + (index === sentences.length - 1 ? 8 : 0)
    }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  const selected = [];
  let words = 0;
  const opening = ranked.find((row) => row.index === 0);
  if (opening) {
    selected.push(opening);
    words += wordCount(opening.sentence);
  }
  // Cap mandatory extras so concise mode can still shorten while preserving
  // the opening sentence and the highest-signal technical distinctions.
  const mandatoryBudget = mode === "concise" ? 5 : mode === "medium" ? 6 : 8;
  let mandatoryKept = 0;
  const mandatoryRows = ranked
    .filter((item) => isMandatorySpokenSentence(item.sentence, question))
    .sort((a, b) => {
      const weight = (sentence) => (
        (/\/IWFND\/ERROR_LOG|\/IWBEP\/ERROR_LOG/i.test(sentence) ? 5 : 0)
        + (/\b(?:SU53|STAUTHTRACE)\b/i.test(sentence) ? 4 : 0)
        + (/\bbusiness task\b/i.test(sentence) ? 3 : 0)
        + (/\bPublic Edition\b/i.test(sentence) ? 2 : 0)
        + (/\bPFCG\b/i.test(sentence) ? 2 : 0)
      );
      return (weight(b.sentence) - weight(a.sentence)) || (b.score - a.score) || (a.index - b.index);
    });
  for (const row of mandatoryRows) {
    if (selected.some((item) => item.index === row.index)) continue;
    if (mandatoryKept >= mandatoryBudget) continue;
    selected.push(row);
    words += wordCount(row.sentence);
    mandatoryKept += 1;
  }
  for (const row of ranked) {
    if (selected.some((item) => item.index === row.index)) continue;
    const next = wordCount(row.sentence);
    if (selected.length >= 3 && words + next > target.prefer + 25 && !isMandatorySpokenSentence(row.sentence, question)) continue;
    if (mode === "concise" && words >= target.max && selected.length >= 3) continue;
    selected.push(row);
    words += next;
    if (words >= target.prefer && selected.length >= 3) break;
    if (mode === "concise" && words >= target.max && selected.length >= 3) break;
  }
  // Always keep original order so the procedure sequence stays correct.
  selected.sort((a, b) => a.index - b.index);
  let fitted = selected.map((row) => row.sentence).join(" ").replace(/\s+/g, " ").trim();
  fitted = fitted.replace(/\uE200(\d+)\uE201/g, (_, index) => protectedCode[Number(index)]);
  if (wordCount(fitted) < Math.min(3, sentences.length) || wordCount(fitted) < 40) return text;
  return fitted;
}
