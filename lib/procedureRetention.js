const STEP_MARK = /\/[A-Z][A-Z0-9_]{2,}|\/UI2\/[A-Z0-9_]+|\b(?:PFCG|SU01|SU10|SU24|SU25|SU53|SUIM|STAUTHTRACE|SICF|SM59|SE38|SLG1|RSECADMIN|GRFNMW_CONFIGURE|RSRT2?|PUR\d{3}|BRF\+|MSMP|SPRO)\b|\b(?:Maintain Business (?:Users|Roles)|Manage Launchpad (?:Spaces|Pages)|Display Authorization Trace|Job Logs|Source Systems|Target Systems|Jobs tab|User Groups|Cloud Connector|communication scenario|Identity Provisioning|RAID|SAP Business Application Studio|SAP Fiori tools|service definition|service binding|CDS DCL|OData)\b/i;

const ACTION = /\b(open|check|confirm|compare|read|run|start|fix|download|upload|import|export|edit|select|choose|browse|monitor|process|activate|assign|transport|review|validate|freeze|agree|exit|close|follow|use|reproduce|inspect|verify|capture|isolate|correct|sign in|log out|scope|maintain|link|map|define|configure|build|deploy|develop|expose|protect)\b/i;
const CONCRETE = /\b(log|logs|trace|failed|failure|error|job|jobs|restart|runbook|rollback|rehearsal|connector|transformation|source system|target system|communication scenario|cloud connector|transaction|catalog|authorization|ruleset|rule set|business function group|workflow template|business rule|role collection|permission|privilege|policy|mapping|configuration|go\/no-go|hypercare|cutover|workflow|process id|initiator|routing|path|stage|approver|agent determination|rule_result|service|application|app|odata|cds|data model|deployment)\b/i;

export function questionProcedureIntent(question = "", answerScope = "") {
  const q = String(question || "");
  // Reuse the already-resolved interview scope. This covers natural phrasings such as
  // "the tile is visible but does nothing" without growing a product/symptom keyword list.
  if (answerScope === "STAGE_INVESTIGATION") return "troubleshoot";
  if (/\b(troubleshoot|investigat|diagnos|failed|failure|error|not working|what do you check|what do you look at|diagnostic steps)\b/i.test(q)) return "troubleshoot";
  if (/\bwhat do you do during\b/i.test(q) && /\b(cutover|hypercare|go-live|go live)\b/i.test(q)) return "delivery";
  if (/\b(cutover and hypercare|hypercare and cutover|cutover runbook)\b/i.test(q)) return "delivery";
  if (/\b(configur(?:e|ation|ing)?|implement(?:ed|ation|ing)?|integrat(?:e|ion|ing)|set up|setup|upload|import|export|maintain|create|assign|enable|activate)\b/i.test(q)) return "configure";
  if (/\bhow (?:do|did|would|to)\b/i.test(q) && /\b(provision|synchron|mapping|connector)\b/i.test(q)) return "configure";
  return "";
}

function sentenceClass(sentence, intent = "") {
  // Configuration answers should retain their explicit validation step even when
  // it asks the reader to inspect an audit or execution log.
  if (intent === "configure"
    && /\b(test|verify|validat(?:e|ion|ing))\b/i.test(sentence)
    && /\b(stage|path|mapping|rules?|ruleset|role|service|account|catalog|configuration|approver|result|risk)\b/i.test(sentence)) {
    return "configure";
  }
  if (/\b(log|logs|failed|failure|error text|trace|restart|source path|job execution|jobs tab|full read|delta read|diagnos)\b/i.test(sentence)) return "troubleshoot";
  if (/\b(runbook|rollback|rehearsal|hypercare|go-live|go\/no-go|cutover)\b/i.test(sentence)) return "delivery";
  if (intent !== "troubleshoot" && /\b(communication scenario|connector|transformation|source system|target system|cloud connector|jobs tab)\b/i.test(sentence)) return "configure";
  if (intent === "troubleshoot"
    && ACTION.test(sentence)
    && /\b(user|group|permission|authorization|role|service|request|workflow|job|query|data|filter|result|entity|target|source|account|requisition|realm|guid|procedure|privilege|object|schema)\b/i.test(sentence)) {
    return "troubleshoot";
  }
  if (intent === "configure" && ACTION.test(sentence) && CONCRETE.test(sentence)) return "configure";
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
  const asksPublic = /public edition|public cloud/i.test(q);
  const asksPrivate = /private edition/i.test(q);
  const asksGateway = /on-premise|on premise|\bgateway\b/i.test(q);
  const namesPrivateTool = /\b(PFCG|\/UI2\/FLPCM|STAUTHTRACE|SU53)\b/.test(s);
  const namesPublicApp = /Maintain Business (?:Users|Roles)|Manage Launchpad Spaces/i.test(s);
  if (/do not|not diagnosed|only\b/i.test(s)) return false;
  if (asksPublic && !asksPrivate && namesPrivateTool) return true;
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
  if (!text) return [];
  const rows = [];
  const seen = new Set();
  // Version decimals (for example, 12.0 and 10.1) are part of SAP release names,
  // not sentence boundaries. Keep them intact so the associated setup step survives.
  for (const raw of text.split(/(?<=\.)(?=\s|$)/)) {
    // Headings carry useful retrieval metadata, but are not spoken procedure steps.
    if (/^\s*#{1,6}\s+/.test(raw)) continue;
    const sentence = cleanSentence(raw);
    // Provenance remains attached to the source chunk for grounding, but it is
    // not part of a spoken interview answer. Avoid reading URLs and audit dates.
    if (/^(?:sources? checked|content verified|verified against|source:|references?:)\b/i.test(sentence)) continue;
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
  "about", "after", "also", "are", "does", "first", "from", "have", "help", "how", "into", "just",
  "more", "most", "only", "should", "that", "them", "then", "there", "this", "through", "what",
  "when", "where", "which", "while", "with", "would", "your"
]);

function blockRelevance(question, rows, heading = "") {
  const normalizedQuestion = String(question || "")
    .replace(/\b(?:can't|cannot|unable to)\s+(?:see|find|locate)\b/gi, "missing")
    .replace(/\bnot visible\b/gi, "missing")
    .replace(/\b(?:tile|app)\s+(?:does not|doesn't)\s+appear\b/gi, "missing");
  const terms = normalizedQuestion.toLowerCase().match(/[a-z0-9_/.-]{3,}/g) || [];
  const queryTerms = [...new Set(terms.filter((term) => !COMMON_QUERY_WORDS.has(term)))];
  if (!queryTerms.length) return 0;
  const evidence = rows.map((row) => row.sentence).join(" ").toLowerCase();
  const headingText = String(heading || "").toLowerCase();
  const absenceQuestion = /\b(missing|no tile|not found|unavailable)\b/i.test(normalizedQuestion);
  const runtimeQuestion = /\b(app opens|opens? but|launches? but|http\s*\d{3}|odata|runtime|authorization fails?|access denied)\b/i.test(normalizedQuestion);
  const absenceHeading = /\b(missing|no tile|not found|app is missing)\b/i.test(headingText);
  const runtimeHeading = /\b(opens?|launches?|request fails?|odata|runtime|authorization|service not active)\b/i.test(headingText);
  if ((absenceQuestion && runtimeHeading && !absenceHeading)
    || (runtimeQuestion && absenceHeading && !runtimeHeading)) return -100;
  return queryTerms.reduce((score, term) => score + (headingText.includes(term) ? 4 : 0) + (evidence.includes(term) ? 1 : 0), 0);
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
  const candidates = groups.filter((group) => group.intentCount >= 3);
  const best = candidates.sort((a, b) => (b.intentCount * 10 + b.relevance) - (a.intentCount * 10 + a.relevance))[0];
  if (!best) return [];
  const sentences = best.rows
    .filter((row) => row.kind === intent || (row.kind === "general" && STEP_MARK.test(row.sentence)))
    .map((row) => row.sentence)
    .filter((sentence) => !conflictsDeployment(question, sentence));
  return sentences.length >= 3 ? sentences.slice(0, 14) : [];
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
  return winningBlock(question, knowledgeText, answerScope);
}

export function shapeSpokenContract(answer = "") {
  const text = String(answer || "").trim();
  if (!text) return "";
  const headings = ["### 1. Direct Answer", "### 2. Technical Mechanism and Exact Artifacts", "### 3. Validation and Operational Boundary"];
  if (headings.every((heading) => text.includes(heading))) return text;
  const sentences = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((sentence) => sentence.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  if (!sentences.length) return text;
  const direct = sentences[0];
  const mechanism = sentences.length > 2 ? sentences.slice(1, -1).join(" ") : (sentences[1] || direct);
  const validation = sentences.length > 1 ? sentences[sentences.length - 1] : "Confirm that statement on the product and edition the interviewer named before using it as a step.";
  return `${headings[0]}\n${direct}\n\n${headings[1]}\n${mechanism}\n\n${headings[2]}\n${validation}`;
}

export function renderSpokenProcedure(question = "", steps = []) {
  if (!Array.isArray(steps) || steps.length === 0) return "";
  const spokenSteps = steps.map((step) => cleanSentence(step)).filter(Boolean);
  if (spokenSteps.length < 3) return "";
  const directAnswer = spokenSteps[0];
  const validationIndex = spokenSteps.findLastIndex((step) => /\b(test|verify|validate|confirm|inspect|review|reconcile)\b/i.test(step));
  const splitAt = validationIndex > 1 ? validationIndex : spokenSteps.length;
  const mechanismSteps = spokenSteps.slice(1, splitAt);
  const validationSteps = spokenSteps.slice(splitAt);
  const mechanism = (mechanismSteps.length ? mechanismSteps : spokenSteps.slice(1)).join(" ");
  const validation = (validationSteps.length ? validationSteps : ["Confirm that check on the product and edition named in the question before treating it as the fix."]).join(" ");
  const directLead = /\bhow did you\b/i.test(question) ? "The documented procedure is: " : "";
  return `### 1. Direct Answer\n${directLead}${directAnswer}\n\n### 2. Technical Mechanism and Exact Artifacts\n${mechanism}\n\n### 3. Validation and Operational Boundary\n${validation}`;
}
