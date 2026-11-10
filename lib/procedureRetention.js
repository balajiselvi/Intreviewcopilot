const STEP_MARK = /\/[A-Z][A-Z0-9_]{2,}|\/UI2\/[A-Z0-9_]+|\b(?:PFCG|SU01|SU10|SU24|SU25|SU53|SUIM|STAUTHTRACE|SICF|SM59|SE38|SLG1|RSECADMIN|GRFNMW_CONFIGURE|RSRT2?|PUR\d{3}|BRF\+|MSMP|SPRO)\b|\b(?:Maintain Business (?:Users|Roles)|Manage Launchpad (?:Spaces|Pages)|Display Authorization Trace|Job Logs|Source Systems|Target Systems|Jobs tab|User Groups|Cloud Connector|communication scenario|Identity Provisioning|RAID|SAP Business Application Studio|SAP Fiori tools|service definition|service binding|CDS DCL|OData)\b/i;

const ACTION = /\b(open|check|confirm|compare|read|run|start|form|download|upload|import|export|edit|select|choose|browse|monitor|process|activate|assign\w*|transport|review\w*|validate|freeze|agree|exit|clos\w*|follow|use|reproduce|inspect|verify|capture|isolate|correct|sign in|log out|scope|maintain|link|map|define|configure|build|deploy|develop|expose|protect|perform\w*|complete|identify|distinguish|restrict|retain|document|trace|prepare|support|generate|attach|declare|regenerate|test|creat\w*|record\w*|schedule\w*|rout\w*)\b/i;
const CONCRETE = /\b(log|logs|trace|failed|failure|error|job|jobs|restart|runbook|rollback|rehearsal|connector|transformation|source system|target system|communication scenario|cloud connector|transaction|catalog|authorization|ruleset|rule set|business function group|workflow template|business rule|role collection|permission|privilege|policy|mapping|configuration|go\/no-go|hypercare|cutover|workflow|process id|initiator|routing|path|stage|approver|agent determination|agent rule|initiator rule|decision table|rule_result|service|application|app|odata|cds|data model|deployment|test plans?|assessment|control owner|issue owner|remediation plan|evidence|test activities?|retest|issue)\b/i;

export function questionProcedureIntent(question = "", answerScope = "") {
  const q = String(question || "");
  // Reuse the already-resolved interview scope. This covers natural phrasings such as
  // "the tile is visible but does nothing" without growing a product/symptom keyword list.
  if (answerScope === "STAGE_INVESTIGATION") return "troubleshoot";
  if (/\b(troubleshoot|investigat|diagnos|failed|failure|error|not working|stuck|no approver|incorrectly routed|rule[\s-]*result mapping|what do you check|what do you look at|diagnostic steps)\b/i.test(q)) return "troubleshoot";
  // Firefighter / EAM log generation failures are troubleshooting even when phrased as Why/What if.
  if (/\bfirefighter\b/i.test(q) && /\blogs?\b/i.test(q) && /\b(?:not generated|missing|not created|why are|what if)\b/i.test(q)) {
    return "troubleshoot";
  }
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
  // "Why do organizations implement X?" is conceptual motivation — not a configure procedure.
  if (/\bwhy\b/i.test(q) && /\b(?:implement|use|need|exist|matter)\b/i.test(q) && !/\bhow\b/i.test(q)) {
    return "";
  }
  // "Explain how do you use X?" / "How do you use X?" / "How do you work in X?" are usage/procedure asks.
  if (/\b(?:explain\s+)?how\b/i.test(q) && /\b(?:do you use|would you use|to use|is .+ used|do you (?:typically )?work (?:in|with)|would you work (?:in|with))\b/i.test(q)) {
    return "configure";
  }
  // "Explain the identity provisioning lifecycle" is an operational lifecycle ask, not a one-line definition.
  if (/\bexplain\b/i.test(q) && /\blifecycle\b/i.test(q) && /\b(?:provision|identity|JML|joiner|IPS)\b/i.test(q)) {
    return "configure";
  }
  if (/\b(configur(?:e|ation|ing)?|implement(?:ed|ation|ing)?|integrat(?:e|ion|ing)|administ(?:er|ered|ration)|set up|setup|upload|import|export|maintain|creat(?:e|ing)|assign|attach|link|enable|activate)\b/i.test(q)) return "configure";
  if (/\bhow (?:do|did|would|to)\b/i.test(q) && /\b(?:provision|synchron|mapping|connector|authoriz\w*|use|using)\b/i.test(q)) return "configure";
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
  // Launchpad / Spaces/Pages configure asks must not lose to custom RAP/BAS develop
  // procedures or to "verify missing app" troubleshooting capsules.
  const asksLaunchpadContent = /\b(?:launchpad|catalog|tile|spaces?|pages?|target mapping|flpcm)\b/i.test(normalizedQuestion)
    && !/\b(?:custom\s+app|RAP|BAS|Business Application Studio|develop(?:er|ment)?)\b/i.test(normalizedQuestion);
  const asksLaunchpadConfigure = asksLaunchpadContent
    && /\b(?:configur\w*|set\s*up|setup|how\s+(?:to|do|would))\b/i.test(normalizedQuestion);
  if (asksLaunchpadContent) {
    if (/\b(?:spaces?\s+and\s+pages?|launchpad\s+spaces?|flpcm|catalogs?|target mapping)\b/i.test(headingText)) score += 42;
    if (asksLaunchpadConfigure && /^configure\b/i.test(String(heading || "").trim())
      && /\b(?:launchpad|spaces?|pages?)\b/i.test(headingText)) {
      score += 60;
    }
    if (asksLaunchpadConfigure && /\b(?:verify|missing|troubleshoot|cannot see)\b/i.test(headingText)) score -= 35;
    if (/\b(?:custom\s+(?:SAP\s+)?Fiori\s+app|RAP service|Business Application Studio|service binding|ADT|on[- ]stack developer)\b/i.test(`${headingText} ${evidence}`)) {
      score -= 55;
    }
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

// Short theme-only activity inventories (e.g. old s4hana-fiori "Implementation Activities")
// become "First, maintain OData service authorization..." as RETRIEVED_PROCEDURE. Reject those
// without a concrete procedure anchor. Keep substantive Implementation Activities (IPS joiner).
// Bare words like "OData" alone are not enough — require a transaction, admin app, or named mechanism.
const PROCEDURE_ANCHOR = /\/[A-Z0-9_]+|\b(?:PFCG|SU\d{2,}|STAUTHTRACE|SICF|SM\d{2}|GRFNMW|Maintain Business|Manage Launchpad|Display Authorization Trace|Job Logs|Identity Provisioning|Cloud Connector|BRF\+?|MSMP|RSECADMIN|SAP Business Application Studio|service binding|CDS DCL|authoritative source|transformation rules|source-to-target|\/IWFND\/|\/UI2\/)\b/i;

function isShallowActivityChecklist(sentences = []) {
  const rows = (Array.isArray(sentences) ? sentences : []).map((sentence) => String(sentence || "").trim()).filter(Boolean);
  if (rows.length < 3) return false;
  if (rows.some((sentence) => PROCEDURE_ANCHOR.test(sentence))) return false;
  return rows.every((sentence) => {
    const text = sentence.replace(/^[-*•]\s+/, "");
    return text.split(/\s+/).filter(Boolean).length <= 18;
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
    let relevance = blockRelevance(question, block.rows, block.heading);
    // Soft-demote tool-less short checklists under activity inventory headings so a richer
    // neighboring procedure can win, without discarding substantive Implementation Activities.
    if (/^(?:implementation|configuration|migration|rollout|production support)\s+activities?\b/i.test(String(block.heading || "").trim())
      && isShallowActivityChecklist(block.rows.map((row) => row.sentence))) {
      relevance -= 40;
    }
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
    // Only reject shallow configure inventories. Diagnostic procedures are often short
    // evidence sentences without a slash T-code and must remain speakable.
    if (sentences.length >= 3 && !(intent === "configure" && isShallowActivityChecklist(sentences))) {
      return sentences.slice(0, 14);
    }
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

/**
 * Product/edition alignment before preferring a retrieved procedure.
 * Rejects Public-Edition asks backed only by private/on-prem admin surfaces (and the reverse).
 * Does not hard-code a product catalog beyond edition plane signals already used elsewhere.
 */
export function procedureEditionAligned(question = "", knowledgeText = "") {
  try {
    const q = String(question || "");
    const k = String(knowledgeText || "");
    if (!q.trim() || !k.trim()) return { aligned: true, reason: "insufficient-signal" };

    const asksPublic = /\bpublic\s+(?:cloud\s+)?edition\b|\bpublic\s+cloud\b/i.test(q);
    const asksPrivate = /\bprivate\s+(?:cloud\s+)?edition\b|\bprivate\s+cloud\b|\bon[- ]premise\b/i.test(q);
    const privateSurfaces = /\b(?:PFCG|SU01|SU24|SU25|SU53|STAUTHTRACE|SICF)\b|\/IWFND\/|\/UI2\//i.test(k);
    const publicSurfaces = /Maintain Business (?:Users|Roles)|Manage Launchpad (?:Spaces|Pages)|Display Authorization Trace|business catalog|restriction value/i.test(k);
    const namesPublicInKnowledge = /\bPublic Edition\b|\bpublic cloud\b/i.test(k);
    const namesPrivateInKnowledge = /\bPrivate Edition\b|\bon[- ]premise\b/i.test(k);

    if (asksPublic && !asksPrivate) {
      if (privateSurfaces && !publicSurfaces && !namesPublicInKnowledge) {
        return { aligned: false, reason: "public-ask-private-procedure" };
      }
    }
    if ((asksPrivate) && !asksPublic) {
      if (publicSurfaces && !privateSurfaces && !namesPrivateInKnowledge) {
        return { aligned: false, reason: "private-ask-public-procedure" };
      }
    }
    return { aligned: true, reason: "ok" };
  } catch {
    return { aligned: true, reason: "alignment-check-error-pass" };
  }
}

/** Headings that are interview fluff rather than an implementation procedure. */
const DEMOTE_PROCEDURE_HEADING =
  /\b(?:overview|interview summary|\d+\s*second interview answer|architecture|runtime flow|migration activities|rollout activities|production support activities)\b/i;

/** Headings that usually carry ordered configure / troubleshoot steps. */
const BOOST_PROCEDURE_HEADING =
  /\b(?:configur\w*|implement\w*|set\s*up|setup|how to|agent rule|initiator rule|maintain msmp|workflow|spaces?\b|pages?\b|role collections?|xsuaa|launchpad content|troubleshoot\w*|diagnos\w*)\b/i;

const CITATION_ONLY_CHUNK = /^(?:#{1,6}\s*)?(?:source checked\b|https?:\/\/)/i;
const HEADING_ONLY_CHUNK = /^#{1,6}\s+\S[\s\S]{0,120}$/;

/**
 * True for bare MSMP / BRF+ / BTP security / Fiori configure asks that must not
 * fall through to free textbook generation when any procedure text is available.
 */
export function isWorkflowBackboneAsk(question = "") {
  const q = String(question || "");
  if (!/\b(?:configur\w*|set\s*up|setup|how\s+(?:do|to|would)|implement\w*|activat\w*|authoriz\w*|troubleshoot\w*)\b/i.test(q)
    && !/\bpillars?\b/i.test(q)) {
    return false;
  }
  // BRF+ ends with non-word '+'; do not require a trailing \b after the plus.
  return /\bMSMP\b|\bBRF(?:\+|plus)|\bGRFNMW_CONFIGURE\b|\bBTP\b|\bXSUAA\b|\brole collections?\b|\bFiori\b|\blaunchpad\b|\/UI2\/|\bSpaces?\b|\bPages?\b/i.test(q);
}

/** Normalize heading/section labels for sibling matching. */
export function normalizeProcedureHeading(heading = "") {
  return String(heading || "")
    .replace(/^#+\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Citation-only / heading-only / empty chunks cannot ground a procedure alone. */
export function isThinProcedureChunk(content = "") {
  const text = String(content || "").trim();
  if (!text) return true;
  if (text.length < 120) return true;
  if (CITATION_ONLY_CHUNK.test(text)) return true;
  if (HEADING_ONLY_CHUNK.test(text) && text.length < 100) return true;
  // Source-footer lines that appear as standalone chunks under a Configure heading.
  if (/^source checked\b/i.test(text) && text.length < 400) return true;
  return false;
}

/**
 * Merge same-sourceFile + same normalized heading siblings ordered by chunkIndex.
 * Does not cross files, headings, or invent missing body text.
 */
export function mergeSameHeadingChunks(seedChunk, pool = []) {
  const seed = seedChunk && typeof seedChunk === "object" ? seedChunk : null;
  if (!seed) {
    return {
      text: "",
      merged: false,
      siblingCount: 0,
      sourceFile: "",
      heading: "",
      chunkIds: [],
      gap: "missing-seed"
    };
  }
  const sourceFile = String(seed.sourceFile || seed.fileName || "").trim();
  const heading = String(seed.heading || seed.section || "").trim();
  const headingKey = normalizeProcedureHeading(heading);
  const seedContent = String(seed.content || seed.text || "").trim();
  if (!sourceFile || !headingKey) {
    return {
      text: seedContent,
      merged: false,
      siblingCount: 1,
      sourceFile,
      heading,
      chunkIds: [String(seed.id || seed.chunkId || "")].filter(Boolean),
      gap: "missing-source-or-heading"
    };
  }

  const list = Array.isArray(pool) ? pool : [];
  const siblings = list
    .filter((chunk) => {
      if (!chunk) return false;
      const file = String(chunk.sourceFile || chunk.fileName || "").trim();
      if (file !== sourceFile) return false;
      return normalizeProcedureHeading(chunk.heading || chunk.section || "") === headingKey;
    })
    .sort((a, b) => (Number(a.chunkIndex) || 0) - (Number(b.chunkIndex) || 0));

  const rows = siblings.length ? siblings : [seed];
  const seen = new Set();
  const parts = [];
  const chunkIds = [];
  for (const row of rows) {
    const body = String(row.content || row.text || "").trim();
    if (!body) continue;
    const key = body.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(body);
    const id = String(row.id || row.chunkId || "").trim();
    if (id) chunkIds.push(id);
  }

  const text = parts.join("\n\n").trim();
  const hasBodySibling = parts.some((part) => !isThinProcedureChunk(part));
  return {
    text,
    merged: siblings.length > 1,
    siblingCount: rows.length,
    sourceFile,
    heading,
    chunkIds,
    gap: hasBodySibling || !isThinProcedureChunk(text) ? null : "retrieval-gap-no-body-sibling"
  };
}

/**
 * Question asks for GRC Access Control MSMP-linked BRF (agent/initiator/path), not bare BRFplus.
 */
export function asksMsmpScopedBrf(question = "") {
  const q = String(question || "");
  // BRF+ ends with a non-word char; trailing \b after "+" does not match.
  if (!/\bBRF(?:\+|plus)(?!\w)/i.test(q)) return false;
  return /\b(?:MSMP|GRC|Access Control|GRFNMW|agent rule|initiator rule|Access Request|RULE_RESULT|approver determination)\b/i.test(q);
}

/**
 * Knowledge/procedure body is MSMP / Access Control agent-rule scoped.
 */
export function knowledgeIsMsmpScopedBrf(text = "") {
  const body = String(text || "");
  return /\b(?:MSMP|GRFNMW_CONFIGURE|Define Workflow-Related MSMP Rules|SAP_GRAC_ACCESS_REQUEST|Maintain MSMP Workflows|Approvers of Selected Path|agent rule|initiator rule)\b/i.test(body);
}

/**
 * Runtime Flow / overview narrative is not a complete MSMP configure procedure.
 * Only true when Runtime Flow is the dominant section heading of this evidence —
 * a buried "Runtime Flow" phrase inside IPS/IAS/MSMP configure docs must not trip this.
 */
export function isRuntimeFlowOverviewKnowledge(text = "") {
  const body = String(text || "").trim();
  if (!body) return false;
  const primaryWindow = body.slice(0, 280);
  const runtimeIsPrimary =
    /^#{0,6}\s*Runtime Flow\b/im.test(primaryWindow)
    || /^Runtime Flow\b/im.test(primaryWindow);
  if (!runtimeIsPrimary) return false;
  // Configure / maintain machinery means this is not overview-only evidence.
  if (/\b(?:GRFNMW_CONFIGURE|Maintain MSMP Workflows|Generate Version|Define Workflow-Related MSMP Rules|Maintain Rules|Route Mapping)\b/i.test(body)) {
    return false;
  }
  return true;
}

/**
 * Task-fit gate for retrieved procedure text. Does not mint VERIFIED_WORKFLOW.
 */
export function procedureTaskFit(question = "", knowledgeText = "") {
  const q = String(question || "");
  const knowledge = String(knowledgeText || "");
  if (!q.trim() || !knowledge.trim()) {
    return { ok: false, reason: "missing-input" };
  }
  if (isRuntimeFlowOverviewKnowledge(knowledge) && /\bMSMP\b/i.test(q) && /\bconfigur/i.test(q)) {
    return { ok: false, reason: "runtime-flow-not-configure-procedure" };
  }
  // Generic BRF+ must not consume an MSMP-only agent-rule procedure.
  if (/\bBRF(?:\+|plus)(?!\w)/i.test(q) && !asksMsmpScopedBrf(q) && knowledgeIsMsmpScopedBrf(knowledge)) {
    return { ok: false, reason: "task-fit-msmp-scoped-brf" };
  }
  // MSMP/BRF agent-rule procedure must not be preferred for a clear foreign product plane.
  if (knowledgeIsMsmpScopedBrf(knowledge)) {
    const namesForeignPlane =
      /\b(?:IAS|IPS|IAG|Fiori|XSUAA|SuccessFactors|IDM|Identity Authentication|Identity Provisioning)\b/i.test(q);
    const namesMsmpOrBrfPlane =
      /\b(?:MSMP|BRF(?:\+|plus)(?!\w)|GRC|Access Control|GRFNMW)\b/i.test(q);
    if (namesForeignPlane && !namesMsmpOrBrfPlane) {
      return { ok: false, reason: "task-fit-cross-product" };
    }
  }
  // Restricting ABAP debug access is PFCG / S_DEVELOP — never serve IAS/IPS authn troubleshooting.
  const asksDebugAccessRestrict =
    /\b(?:restrict|disable|remove|revoke|control|limit)\w*\s+debug(?:ging)?\b|\bdebug(?:ging)?\s+access\b|\bS_DEVELOP\b/i.test(q);
  const knowledgeIsIdentityAuthnTroubleshoot =
    /\b(?:IAS|Identity Authentication|IPS|Identity Provisioning|NameID)\b/i.test(knowledge)
    && /\b(?:authentication|provisioning|SAML|SSO)\b/i.test(knowledge)
    && !/\b(?:S_DEVELOP|SE38|SE80|debug(?:ging)?\s+access)\b/i.test(knowledge);
  if (asksDebugAccessRestrict && knowledgeIsIdentityAuthnTroubleshoot) {
    return { ok: false, reason: "task-fit-debug-access-vs-identity" };
  }
  // Central vs decentral EAM / central-GRC failover: reject GRAC_SPM day-to-day ops,
  // repository sync, or connector-group prose that never explains the deploy model.
  const asksEamDeploy = (
    /\b(?:central(?:ized)?|decentral(?:ized)?)\b/i.test(q)
    && /\b(?:eam|firefighter|ff\s*ids?|emergency access)\b/i.test(q)
  ) || (
    /\b(?:unavailable|offline|outage|failover)\b/i.test(q)
    && /\b(?:(?:central\s+)?grc|eam|firefighter|ff\s*ids?)\b/i.test(q)
  );
  if (asksEamDeploy) {
    const hasDeployExplain = /\b(?:central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam|failover|central vs\.?\s*decentral)\b/i.test(knowledge);
    const opsOnly = /\b(?:GRAC_SPM|repository sync|connector groups?)\b/i.test(knowledge) && !hasDeployExplain;
    if (opsOnly) {
      return { ok: false, reason: "task-fit-eam-ops-not-deploy" };
    }
  }
  return { ok: true, reason: "ok" };
}

/**
 * Expand a candidate pool so same-heading siblings from a wider scoped set are present.
 * Used when topK selected a citation-only chunk but the body sibling lives nearby in productScoped.
 */
export function expandPoolWithHeadingSiblings(selectedChunks = [], scopedChunks = []) {
  const selected = Array.isArray(selectedChunks) ? selectedChunks.filter(Boolean) : [];
  const scoped = Array.isArray(scopedChunks) ? scopedChunks.filter(Boolean) : [];
  if (!selected.length) return scoped.slice(0, 24);
  const out = [];
  const seen = new Set();
  const push = (chunk) => {
    if (!chunk) return;
    const id = String(chunk.id || chunk.chunkId || `${chunk.sourceFile}:${chunk.heading}:${String(chunk.content || "").slice(0, 40)}`);
    if (seen.has(id)) return;
    seen.add(id);
    out.push(chunk);
  };
  for (const seed of selected) {
    push(seed);
    const sourceFile = String(seed.sourceFile || seed.fileName || "").trim();
    const headingKey = normalizeProcedureHeading(seed.heading || seed.section || "");
    if (!sourceFile || !headingKey) continue;
    for (const candidate of scoped) {
      if (String(candidate.sourceFile || candidate.fileName || "").trim() !== sourceFile) continue;
      if (normalizeProcedureHeading(candidate.heading || candidate.section || "") !== headingKey) continue;
      push(candidate);
    }
  }
  // Keep remaining scoped chunks for ranking fallbacks (cap).
  for (const candidate of scoped) {
    if (out.length >= 36) break;
    push(candidate);
  }
  return out;
}

/**
 * Enrich procedure knowledge: if seed/top evidence is thin, merge same-heading siblings from pool.
 */
export function enrichProcedureKnowledgeFromPool({
  question = "",
  knowledgeText = "",
  procedurePool = [],
  seedChunks = []
} = {}) {
  const primary = String(knowledgeText || "").trim();
  const pool = Array.isArray(procedurePool) ? procedurePool : [];
  const seeds = (Array.isArray(seedChunks) && seedChunks.length
    ? seedChunks
    : pool.slice(0, 3)
  ).filter(Boolean);

  const attempts = [];
  for (const seed of seeds) {
    const merged = mergeSameHeadingChunks(seed, pool);
    attempts.push(merged);
    if (!merged.text) continue;
    const fit = procedureTaskFit(question, merged.text);
    if (!fit.ok) {
      merged.taskFit = fit;
      continue;
    }
    // Prefer merged body over thin primary citation text.
    if (merged.gap) continue;
    if (!isThinProcedureChunk(merged.text) || merged.merged) {
      return {
        text: merged.heading ? `## ${merged.heading}\n${merged.text}` : merged.text,
        enriched: Boolean(merged.merged),
        gap: null,
        sourceFile: merged.sourceFile,
        heading: merged.heading,
        chunkIds: merged.chunkIds,
        taskFit: fit,
        reason: merged.merged ? "merged-same-heading-siblings" : "seed-body-sufficient"
      };
    }
  }

  const thinPrimary = isThinProcedureChunk(primary) || !primary;
  const gapAttempt = attempts.find((row) => row.gap) || attempts[0] || null;
  return {
    text: primary,
    enriched: false,
    gap: thinPrimary ? (gapAttempt?.gap || "retrieval-gap-thin-primary") : null,
    sourceFile: gapAttempt?.sourceFile || "",
    heading: gapAttempt?.heading || "",
    chunkIds: gapAttempt?.chunkIds || [],
    taskFit: primary ? procedureTaskFit(question, primary) : { ok: false, reason: "missing-input" },
    reason: thinPrimary ? "retain-original-thin-evidence" : "primary-unchanged"
  };
}

/**
 * Rank retrieved chunks so Configure / MSMP / BRF / Spaces procedure sections beat
 * Overview and N-second interview summaries (root cause of live stepCount=0).
 */
export function prioritizeProcedureChunks(question = "", chunks = []) {
  const list = Array.isArray(chunks) ? chunks.filter((chunk) => chunk && (chunk.content || chunk.text)) : [];
  if (!list.length) return [];
  const q = String(question || "").toLowerCase();
  const terms = [...new Set((q.match(/[a-z0-9]{3,}/g) || []).filter((t) => t.length >= 3))];
  const asksLifecycle = /\blifecycle\b|\bjoiner\b|\bmover\b|\bleaver\b/.test(q);
  const asksTroubleshoot = /\btroubleshoot|diagnos|failing|why (?:is|are|does|do)\b/.test(q);
  const scored = list.map((chunk, index) => {
    const heading = String(chunk.heading || chunk.section || "");
    const source = String(chunk.sourceFile || chunk.fileName || "");
    const body = String(chunk.content || chunk.text || "").trim();
    let score = 0;
    if (BOOST_PROCEDURE_HEADING.test(heading)) score += 8;
    if (DEMOTE_PROCEDURE_HEADING.test(heading)) score -= 6;
    if (/\b(?:msmp|brf-plus|spaces-pages|btp-security|catalogs|launchpad|arm)\.md\b/i.test(source)) score += 3;
    for (const term of terms) {
      if (heading.toLowerCase().includes(term)) score += 1;
    }
    if (/^configure\b/i.test(heading.trim())) score += 4;
    // Lifecycle asks need overview/provisioning prose, not failure-triage sections.
    if (asksLifecycle && /\b(?:lifecycle|overview|joiner|mover|leaver|provisioning)\b/i.test(heading)) score += 8;
    if (asksLifecycle && !asksTroubleshoot && /\btroubleshoot|failing|failures?\b/i.test(heading)) score -= 10;
    if (/^related topics$/i.test(heading.trim())) score -= 12;
    // Heading-only / title stubs are not usable procedure evidence.
    if (body.length < 80 || /^#+\s+\S[\s\S]{0,80}$/.test(body)) score -= 8;
    return { chunk, score, index };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((row) => row.chunk);
}

/** Build markdown knowledge text from a ranked procedure pool. */
export function knowledgeFromProcedurePool(question = "", chunks = [], limit = 8) {
  const ranked = prioritizeProcedureChunks(question, chunks).slice(0, Math.max(1, limit));
  return ranked
    .map((chunk) => {
      const heading = String(chunk.heading || chunk.section || "").trim();
      let body = String(chunk.content || chunk.text || "").trim();
      if (!body) return "";
      // Avoid double-heading when the chunk body already starts with the same ATX heading.
      const headingLine = heading ? `## ${heading.replace(/^#+\s*/, "")}` : "";
      if (headingLine && body.startsWith(headingLine)) return body;
      if (heading && new RegExp(`^#{1,6}\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(body.split("\n")[0] || "")) {
        return body;
      }
      // Interview-bank bodies already embed "## Qn: …"; do not wrap again.
      if (/^#{1,6}\s*Q\d+\s*:/i.test(body)) return body;
      return heading ? `## ${heading}\n${body}` : body;
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * I1 — Prefer a retrieved procedure when the ask is configure/how-to/troubleshoot/delivery
 * and SUPPORTING KNOWLEDGE yields a speakable ≥3-step sequence.
 * Amendment (a): refuse prefer when edition plane of knowledge conflicts with the question.
 * Amendment (c): overview-thin primary → retry ranked procedurePool.
 * Amendment (d): Fix 1 — merge same-source/same-heading siblings before eligibility when the
 * selected chunk is citation/heading-only (live BRF chunk_05062f25 failure mode).
 */
export function shouldPreferRetrievedProcedure({
  question = "",
  knowledgeText = "",
  answerScope = "",
  seniority = "",
  procedurePool = null,
  seedChunks = null
} = {}) {
  try {
    const q = String(question || "").trim();
    if (!q) {
      return { prefer: false, route: "GENERATION", reason: "missing-input" };
    }
    if (/\b(?:have you|did you|your experience|tell me about a time|walk me through a time)\b/i.test(q)) {
      return { prefer: false, route: "GENERATION", reason: "experience-ask" };
    }
    const intent = questionProcedureIntent(q, answerScope);
    if (!intent) {
      return { prefer: false, route: "GENERATION", reason: "no-procedure-intent" };
    }

    const pool = Array.isArray(procedurePool) ? procedurePool : [];
    const enrichment = enrichProcedureKnowledgeFromPool({
      question: q,
      knowledgeText,
      procedurePool: pool,
      seedChunks: Array.isArray(seedChunks) ? seedChunks : null
    });
    let knowledge = String(enrichment.text || knowledgeText || "");

    const enrichmentSnapshot = () => ({
      enriched: Boolean(enrichment.enriched),
      gap: enrichment.gap || null,
      sourceFile: enrichment.sourceFile || "",
      heading: enrichment.heading || "",
      chunkIds: Array.isArray(enrichment.chunkIds) ? enrichment.chunkIds.slice(0, 8) : [],
      reason: enrichment.reason || null
    });
    const evaluate = (text, sourceTag) => {
      const body = String(text || "");
      if (!body.trim()) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: "missing-input",
          intent,
          stepCount: 0,
          sourceTag,
          enrichment: enrichmentSnapshot()
        };
      }
      const alignment = procedureEditionAligned(q, body);
      if (!alignment.aligned) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: alignment.reason,
          intent,
          sourceTag,
          alignment,
          enrichment: enrichmentSnapshot()
        };
      }
      const taskFit = procedureTaskFit(q, body);
      if (!taskFit.ok) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: taskFit.reason,
          intent,
          stepCount: 0,
          sourceTag,
          taskFit,
          alignment,
          enrichment: enrichmentSnapshot()
        };
      }
      // MSMP Runtime Flow overview alone must not pass merely because it has ≥3 sentences.
      if (isRuntimeFlowOverviewKnowledge(body)) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: "runtime-flow-not-configure-procedure",
          intent,
          stepCount: 0,
          sourceTag,
          taskFit,
          enrichment: enrichmentSnapshot()
        };
      }
      const steps = authoritativeProcedure(q, body, answerScope) || [];
      if (steps.length < 3) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: "insufficient-steps",
          intent,
          stepCount: steps.length,
          sourceTag
        };
      }
      // Reject citation/heading-only fragments. Do not use isThinProcedureChunk on steps —
      // that helper's length gate is for retrieval chunks, not legitimate short steps.
      const actionable = steps.filter((step) => {
        const s = String(step || "").trim();
        if (!s || /^source checked\b/i.test(s)) return false;
        if (CITATION_ONLY_CHUNK.test(s)) return false;
        if (HEADING_ONLY_CHUNK.test(s) && s.length < 100) return false;
        return true;
      });
      if (actionable.length < 3) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: "insufficient-actionable-steps",
          intent,
          stepCount: steps.length,
          sourceTag,
          taskFit,
          alignment,
          enrichment: enrichmentSnapshot()
        };
      }
      const spoken = renderSpokenProcedure(q, steps);
      if (!spoken) {
        return {
          prefer: false,
          route: "GENERATION",
          reason: "unspeakable-procedure",
          intent,
          stepCount: steps.length,
          sourceTag,
          taskFit,
          alignment,
          enrichment: enrichmentSnapshot()
        };
      }
      const senior = /\b(senior|manager|director|principal)\b/i.test(String(seniority || ""));
      // Configure / how-to asks must deliver the retrieved procedure directly.
      // Demoting to senior-backbone forced GENERATION; mock/live wrap then replaced a
      // coherent PFCG/procedure answer with inability or unrelated prose.
      const wrapMode = (senior && intent !== "configure") ? "senior-backbone" : "direct";
      return {
        prefer: true,
        route: "RETRIEVED_PROCEDURE",
        reason: sourceTag === "sibling-merge"
          ? "coherent-source-procedure-from-siblings"
          : sourceTag === "procedure-pool"
            ? "coherent-source-procedure-from-pool"
            : "coherent-source-procedure",
        intent,
        stepCount: steps.length,
        steps,
        spoken,
        wrapMode,
        alignment,
        taskFit,
        sourceTag,
        enrichment: {
          enriched: enrichment.enriched,
          gap: enrichment.gap,
          sourceFile: enrichment.sourceFile,
          heading: enrichment.heading,
          chunkIds: enrichment.chunkIds,
          reason: enrichment.reason
        }
      };
    };

    // Prefer sibling-enriched text first when enrichment recovered a body.
    let decision = evaluate(
      knowledge,
      enrichment.enriched ? "sibling-merge" : "primary"
    );
    if (!decision.prefer && enrichment.gap) {
      decision = {
        ...decision,
        retrievalGap: enrichment.gap,
        enrichment: {
          enriched: false,
          gap: enrichment.gap,
          sourceFile: enrichment.sourceFile,
          heading: enrichment.heading,
          chunkIds: enrichment.chunkIds,
          reason: enrichment.reason
        }
      };
    }
    if (!decision.prefer && pool.length) {
      const poolText = knowledgeFromProcedurePool(q, pool);
      if (poolText.trim()) {
        const fromPool = evaluate(poolText, "procedure-pool");
        if (fromPool.prefer) return fromPool;
        if ((fromPool.stepCount || 0) > (decision.stepCount || 0)) decision = fromPool;
      }
    }
    if (!decision.prefer && isWorkflowBackboneAsk(q)) {
      return {
        ...decision,
        reason: decision.reason || "insufficient-steps",
        workflowBackboneAsk: true
      };
    }
    return decision;
  } catch {
    return { prefer: false, route: "GENERATION", reason: "procedure-prefer-error" };
  }
}

const REPORT_HEADING = /^(?:#{1,6}\s*)?(?:\d+\.\s*)?(?:direct answer|technical mechanism(?: and exact artifacts)?|technical explanation|validation and operational boundary|key takeaways|conclusion)\b[:\s-]*$/i;
const DMGV_HEADING =
  /(?:^|\n)\s*[-*•]?\s*(?:\*\*\s*)?(?:Decision|Mechanism|Governance|Validation)\s*:/im;

/** Flatten banned Decision/Mechanism/Governance/Validation headings into fluent prose. */
function flattenDmgvHeadings(text = "") {
  let out = String(text || "");
  if (!out || !DMGV_HEADING.test(out) && !/\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:/i.test(out)) {
    return out;
  }
  return out
    .replace(/(?:^|\n)\s*[-*•]\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, "\n")
    .replace(/(?:^|\n)\s*[-*•]\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/(?:^|\n)\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*/gi, "\n")
    .replace(/\*\*\s*(?:Decision|Mechanism|Governance|Validation)\s*:\s*\*\*\s*/gi, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function shapeSpokenContract(answer = "") {
  const text = flattenDmgvHeadings(String(answer || "").trim());
  if (!text) return "";
  // Fluent spoken prose only — never preserve Decision/Mechanism/Governance/Validation bullets.
  // Preserve intentional paragraph breaks (e.g. 3-paragraph architect comparisons).
  const shapePara = (para) =>
    String(para || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && !REPORT_HEADING.test(line))
      .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^\d+\.\s+/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) {
    const shaped = paragraphs.map(shapePara).filter(Boolean);
    return shaped.length ? shaped.join("\n\n") : text;
  }
  return shapePara(text) || text;
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
    const body = `${spokenActions.join(" ")}${/[.!?]$/.test(spokenActions.at(-1)) ? "" : "."}`;
    // Checklist steps become spoken First/Next/Finally prose only — no canned architect wrap.
    return body;
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
  // Genuine Firefighter configure / log-review keeps GRAC_SPM ops mandatory.
  // Central vs decentral / failover asks must not lock onto GRAC_SPM ops sentences.
  const asksEamDeploySpoken = (
    /\b(?:central(?:ized)?|decentral(?:ized)?)\b/i.test(q)
    && /\b(?:eam|firefighter|ff\s*ids?|emergency access)\b/i.test(q)
  ) || (
    /\b(?:unavailable|offline|outage|failover)\b/i.test(q)
    && /\b(?:(?:central\s+)?grc|eam|firefighter|ff\s*ids?)\b/i.test(q)
  );
  if (/\bFirefighter\b/i.test(q) && /\b(?:GRAC_SPM|repository sync|controller)\b/i.test(s) && !asksEamDeploySpoken) return true;
  if (asksEamDeploySpoken && /\b(?:central(?:ized)?\s+eam|decentral(?:ized)?\s+eam|grc hub|local eam|failover|GRAC_SPM_LOG_SYNC)\b/i.test(s)) return true;
  if (/\brole collection\b/i.test(q) && /\b(?:trust|IdP|sign in again|role template)\b/i.test(s)) return true;
  if (/\b(?:SuccessFactors|MDF|Metadata Framework|RBP)\b/i.test(q)
    && /\b(?:target population|permission group|Manage Permission|MDF|field[- ]level|Miscellaneous Permissions|object definition)\b/i.test(s)) return true;
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
 * Spoken-length shaper.
 * Selects complete sentences while prioritizing mandatory technical details.
 * Retains source order and avoids cutting off procedures mid-sentence.
 */
export function fitSpokenLength(answer = "", responseLength = "medium", question = "") {
  const shaped = shapeSpokenContract(answer);
  if (!shaped) return "";

  const targets = LENGTH_TARGETS[responseLength] || LENGTH_TARGETS.medium;
  const totalWords = wordCount(shaped);

  // A lengthy response should retain the full answer when it already fits.
  if (responseLength === "lengthy" && totalWords <= targets.max) {
    return shaped;
  }

  const sentences = shaped
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((text, index) => ({
      text: text.trim(),
      index,
      words: wordCount(text),
      mandatory: isMandatorySpokenSentence(text, question),
      priority: sentencePriority(text, question)
    }))
    .filter((item) => item.text);

  if (sentences.length <= 1 || totalWords <= targets.min) {
    return shaped;
  }

  const selected = new Set();
  let selectedWords = 0;

  // Preserve mandatory technical details first, even when they exceed the target.
  for (const item of sentences) {
    if (item.mandatory) {
      selected.add(item.index);
      selectedWords += item.words;
    }
  }

  // Add the most valuable remaining sentences without exceeding the preferred
  // budget, where possible. Sentence order is restored before returning.
  const ranked = sentences
    .filter((item) => !selected.has(item.index))
    .sort((a, b) => b.priority - a.priority || a.index - b.index);

  for (const item of ranked) {
    if (selectedWords >= targets.prefer) break;
    if (selectedWords + item.words <= targets.max) {
      selected.add(item.index);
      selectedWords += item.words;
    }
  }

  // Avoid answers that are too short to be useful. Add complete sentences until
  // the minimum is reached, even if a single sentence crosses the preferred limit.
  if (selectedWords < targets.min) {
    for (const item of ranked) {
      if (selected.has(item.index)) continue;
      selected.add(item.index);
      selectedWords += item.words;
      if (selectedWords >= targets.min) break;
    }
  }

  // If mandatory content alone exceeds the budget, retain it rather than
  // silently dropping important SAP transactions, checks, or boundaries.
  const result = sentences
    .filter((item) => selected.has(item.index))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.text)
    .join(" ")
    .trim();

  return result || shaped;
}
