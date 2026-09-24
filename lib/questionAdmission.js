/**
 * Question admission. Decides whether a captured utterance should be answered.
 * This is not turn detection. The speech detector still decides when speech stopped.
 */

const DECISIONS = {
  ANSWER: "ANSWER",
  IGNORE: "IGNORE",
  DEFER: "DEFER"
};

const FUNCTION_WORDS = new Set(
  "a an the and or but so to of in on for with at from by as is are was were be been being it this that these those i you we they he she me us them my your our their just yeah yes no ok okay uh um well like mean actually really also then than there here will would can could should may might have has had do does did not dont don't if about into through over after before up down out all any some only very too its it's im i've youre you're thats that's theres there's till now right mean kind bit little yeah yep nope hi hey oh ah".split(/\s+/)
);

const SOCIAL = new Set(
  "morning afternoon evening hello hey hi bye goodbye thanks thank thankyou welcome sure good fine hmm mm mmm mhm huh alright please doing today well yes yeah yep ok okay".split(/\s+/)
);

const MEETING = new Set(
  "round rounds interview interviewing interviewed panel join joining joined wait waiting outcome feedback communicate communicated financials hr attending attended conducted final discussion discussions discuss discussing process thank thanks thankyou time spending".split(/\s+/)
);

const QUESTION_OPERATORS = new Set("what how why when where which who".split(/\s+/));

const LEXICAL_VERBS = new Set(
  "do did done doing work worked working design designed designing build built building lead led leading run ran running configure configured configuring implement implemented implementing explain explained explaining handle handled handling use used using see seen seeing support supported supporting manage managed managing make made making take took taken taking give gave given giving show showed shown showing tell told telling walk walked walking create created creating review reviewed reviewing clear cleared clearing test tested testing define defined defining compare compared comparing deliver delivered delivering own owned owning provision provisioned provisioning troubleshoot troubleshooting demonstrate demonstrated demonstrating".split(/\s+/)
);

function normalize(raw) {
  return String(raw || "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function tokenize(raw) {
  return normalize(raw)
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function contentTokens(toks) {
  return toks.filter((token) => {
    const bare = token.replace(/\?+$/, "");
    return bare.length > 2 && !FUNCTION_WORDS.has(bare) && !SOCIAL.has(bare);
  });
}

function repeatStats(toks, includeFunction) {
  const counts = {};
  let considered = 0;
  for (const token of toks) {
    const bare = token.replace(/\?+$/, "");
    if (bare.length < 3) continue;
    if (!includeFunction && (FUNCTION_WORDS.has(bare) || SOCIAL.has(bare))) continue;
    considered += 1;
    counts[bare] = (counts[bare] || 0) + 1;
  }
  let max = 0;
  let word = "";
  for (const [key, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      word = key;
    }
  }
  return {
    word,
    count: max,
    ratio: considered ? max / considered : 0
  };
}

function hasWellnessCheck(text) {
  return /\bhow\s+are\s+you\b/i.test(text) && !/\b(project|role|experience|sap|client|work|grc|security)\b/i.test(text);
}

function hasFullRequest(text) {
  return (
    /\b(tell|walk|run|explain|describe|give|show)\s+(me|us)\b/i.test(text) ||
    /^(?:please\s+)?(?:explain|describe|tell|walk|compare|outline|give|show)\b/i.test(text) ||
    /^(?:is|are|was|were|do|does|did|can|could|would|should)\b/i.test(text) ||
    /\b(can|could|would|will)\s+you\b/i.test(text) ||
    /\b(do|does|did|have|has|are|is|was|were)\s+you\b/i.test(text) ||
    /\bwhat(?:'s| is| are| do| does| did| was| were| kind| about|\s+\w{4,})\b/i.test(text) ||
    /\bhow\s+(?:do|did|would|should|long|many|much|does|is|are|can)\b/i.test(text) ||
    /\bwhy\b/i.test(text) ||
    /\bwhich\s+(?!we\b|i\b|you\b|they\b)/i.test(text) ||
    /\b(when|where)\s+(?:do|did|would|is|are|was|were|should|can)\b/i.test(text) ||
    /\bwho\s+(?:do|did|would|is|are|was|were|should|approves|owns|decides)\b/i.test(text) ||
    /\bdoes (?:this|that) mean\b/i.test(text)
  );
}

function isElliptical(text, professional) {
  const compact = normalize(text);
  if (/^(why|how)\s*\??$/i.test(compact)) return true;
  if (/^what about\b/i.test(compact) && professional.length >= 1) return true;
  if (/^(and|so)\b/i.test(compact) && !hasFullRequest(compact) && /\?\s*$/.test(compact) && professional.some((token) => token.length >= 4)) {
    return true;
  }
  return false;
}

function looksVerbal(token) {
  if (LEXICAL_VERBS.has(token)) return true;
  return token.length >= 5 && /(?:ed|ing)$/.test(token);
}

function invertedAuxCoherent(text) {
  const match = String(text || "").match(/\b(?:do|does|did|have|has)\s+you\b\s*([\s\S]*)$/i);
  if (!match) return true;
  const residue = match[1];
  const residueTokens = tokenize(residue).filter((token) => !FUNCTION_WORDS.has(token) && !SOCIAL.has(token) && token.length > 2);
  if (residueTokens.some(looksVerbal)) return true;
  if (/\b(experience|background|exposure)\b/i.test(residue)) return true;
  return false;
}

function declarativeCandidateAsk(text, professional) {
  return /\byou\s+(?:have|had|did|do|worked|built|led|designed|configured|implemented|ran)\b/i.test(text)
    && professional.length >= 1
    && /\?\s*$/.test(text);
}

function isIncomplete(text, repeat) {
  const compact = normalize(text).toLowerCase();
  if (/\b(or|and|uh|um)\s*\??$/.test(compact)) return true;
  if (/\bmay i ask\s*\??$/.test(compact)) return true;
  if (repeat.count >= 3) return true;
  return false;
}

function decision(code, reason, features) {
  return { decision: code, reason, features };
}

function admitQuestion(raw, context = {}) {
  const text = normalize(raw);
  const priorQuestion = normalize(context.priorQuestion || "");
  const toks = tokenize(text);
  const content = contentTokens(toks);
  const meetingHits = content.filter((token) => MEETING.has(token.replace(/\?+$/, "")));
  const professional = content.filter((token) => !MEETING.has(token) && !QUESTION_OPERATORS.has(token));
  const repeat = repeatStats(toks, true);
  const contentRepeat = repeatStats(toks, false);
  const features = {
    tokens: toks.length,
    content: content.slice(0, 12),
    professional: professional.slice(0, 12),
    meetingHits: meetingHits.length,
    repeatRatio: Number(repeat.ratio.toFixed(2)),
    repeatWord: repeat.word,
    hasPrior: Boolean(priorQuestion)
  };

  if (!text) return decision(DECISIONS.IGNORE, "empty", features);
  if (repeat.count >= 6 || (repeat.count >= 4 && repeat.ratio >= 0.25)) {
    return decision(DECISIONS.IGNORE, "repetition", features);
  }
  if (hasWellnessCheck(text)) return decision(DECISIONS.IGNORE, "wellness", features);
  if (!hasFullRequest(text) && professional.length <= 1 && toks.some((token) => SOCIAL.has(token))) {
    return decision(DECISIONS.IGNORE, "not-a-question", features);
  }

  const meetingHeavy = !hasFullRequest(text) && meetingHits.length >= 2;
  const scheduling = !hasFullRequest(text) && meetingHits.length >= 1 && /\b(wait|waiting|join|joining|thank)\b/i.test(text);
  if (meetingHeavy || scheduling) {
    return decision(DECISIONS.IGNORE, "logistics", features);
  }

  const full = hasFullRequest(text);
  const elliptical = isElliptical(text, professional);
  const incomplete = isIncomplete(text, contentRepeat);

  if (/\bmay i ask\b/i.test(text)) return decision(DECISIONS.DEFER, "incomplete", features);
  if (/\bare you\b/i.test(text) && !/^(?:are you)\b/i.test(text) && !/\b(what|how|why|which|can|could|would)\b/i.test(text)) {
    return decision(DECISIONS.DEFER, "incomplete", features);
  }

  if (full && !invertedAuxCoherent(text)) {
    return decision(DECISIONS.DEFER, "incoherent-request", features);
  }
  if (full && professional.length >= 1 && !incomplete) {
    return decision(DECISIONS.ANSWER, "request", features);
  }
  if (declarativeCandidateAsk(text, professional) && !incomplete) {
    return decision(DECISIONS.ANSWER, "request", features);
  }
  if (priorQuestion && !incomplete && professional.length >= 2 && /\b(any other|anything else)\b/i.test(text) && !/\b(don't|do not|\bno\b|\bnot\b)\b/i.test(text)) {
    return decision(DECISIONS.ANSWER, "follow-up", features);
  }

  if (elliptical) {
    return priorQuestion
      ? decision(DECISIONS.ANSWER, "follow-up", features)
      : decision(DECISIONS.DEFER, "follow-up-without-context", features);
  }

  if (incomplete && (full || professional.length >= 1)) {
    return decision(DECISIONS.DEFER, "incomplete", features);
  }
  if (full && professional.length === 0) {
    return decision(DECISIONS.DEFER, "request-without-topic", features);
  }
  const workTopic = professional.some((token) => /sap|grc|sod|role|secur|project|access|user|fiori|auth|demo|workflow|catalog|control|presale|ident|hyper|cutover|rule|fire|priv|pfcg|ias|ips|iag|arm|ara|eam|brm|su24|msmp|network|implement|sell|provision|audit|govern/.test(token));
  if (!full && !/\?\s*$/.test(text) && !workTopic) {
    return decision(DECISIONS.IGNORE, "not-a-question", features);
  }
  if (!full && professional.length >= 1 && toks.length <= 6) {
    return decision(DECISIONS.DEFER, "fragment", features);
  }
  if (!full && professional.length >= 2 && toks.length <= 14) {
    return decision(DECISIONS.DEFER, "fragment", features);
  }
  if (!full && professional.length >= 2) {
    return decision(DECISIONS.DEFER, "statement", features);
  }
  if (/\?$/.test(text) && professional.length >= 1 && priorQuestion) {
    return decision(DECISIONS.ANSWER, "follow-up", features);
  }
  if (/\?$/.test(text) && professional.length >= 1) {
    return decision(DECISIONS.DEFER, "unclear-question", features);
  }
  return decision(DECISIONS.IGNORE, "not-a-question", features);
}

function priorAnchor(history = []) {
  const items = Array.isArray(history) ? history : [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (!item || item.disposition === DECISIONS.IGNORE || item.disposition === DECISIONS.DEFER) continue;
    const role = item.role || item.type;
    if (role === "assistant" || role === "response") continue;
    const content = item.content || item.text || item.question || "";
    if (!String(content).trim()) continue;
    const admitted = admitQuestion(content, { priorQuestion: "" });
    if (admitted.decision === DECISIONS.ANSWER) return String(content);
  }
  return "";
}

module.exports = {
  DECISIONS,
  admitQuestion,
  priorAnchor
};
