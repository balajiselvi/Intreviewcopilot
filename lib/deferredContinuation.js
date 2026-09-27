/**
 * Assembles a deferred open fragment with a later utterance.
 * Admission still decides whether a single utterance is answerable.
 * This module only decides whether the next utterance finishes an unfinished one.
 */
const { admitQuestion, DECISIONS } = require("./questionAdmission.js");

const MAX_PARTS = 4;

const OPEN_TAIL = new Set(
  "a an the and or but so to of in on for with at from by as about into over your you we they would could should can will do does did how what when where which who if that this".split(/\s+/)
);

function clean(raw) {
  return String(raw || "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function words(raw) {
  return clean(raw).toLowerCase().replace(/[^a-z0-9? ]/g, " ").split(/\s+/).filter(Boolean);
}

function isClosedEllipsis(raw) {
  return /^(why|how)\s*\?$/i.test(clean(raw));
}

const FILLER = new Set("um uh yeah yes yep ok okay hmm mm mmm mhm well like oh ah alright".split(/\s+/));

function contentWords(raw) {
  return words(raw)
    .map((token) => token.replace(/\?+$/, ""))
    .filter((token) => token.length > 2 && !OPEN_TAIL.has(token) && !FILLER.has(token));
}

function isOpenFragment(raw) {
  const text = clean(raw);
  if (!text || isClosedEllipsis(text)) return false;
  if (/[.!]\s*$/.test(text)) return false;
  const tokens = words(text);
  if (!tokens.length) return false;
  const last = tokens[tokens.length - 1].replace(/\?+$/, "");
  const content = contentWords(text);
  if (/\?\s*$/.test(text) && content.length >= 2) return false;
  if (OPEN_TAIL.has(last)) return true;
  if (/\?\s*$/.test(text)) return false;
  if (content.length > 2) return false;
  if (last.length >= 5 && /(?:ate|ure|ise|ize|ing|ed)$/i.test(last)) return true;
  return /^(what|how|and|so)\b/i.test(text) && content.length <= 2;
}

function isFiller(raw) {
  const tokens = words(raw).map((token) => token.replace(/\?+$/, ""));
  return tokens.length > 0 && tokens.every((token) => FILLER.has(token));
}

function startsNewQuestion(raw) {
  const text = clean(raw);
  return /^(what|how|why|when|where|which|who)\b/i.test(text)
    || /^(explain|describe|tell|compare|outline|walk)\b/i.test(text)
    || /^(do|does|did|can|could|would|should|is|are|have|has)\s+you\b/i.test(text);
}

function isIndependentClause(raw) {
  return /^(i|we|they|he|she)\b/i.test(clean(raw));
}

function joinText(left, right) {
  return clean(`${clean(left)} ${clean(right)}`);
}

function hold(pending, disposition, raw) {
  return {
    action: "hold",
    pending,
    text: "",
    recordText: clean(raw),
    disposition,
    generates: false
  };
}

function takeUtterance(pending, raw) {
  const text = clean(raw);
  const admitted = admitQuestion(text, { priorQuestion: "" });
  if (!pending) {
    if (isOpenFragment(text)) return hold({ text, parts: 1 }, DECISIONS.DEFER, text);
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false };
  }
  if (!text || isFiller(text)) {
    return hold(pending, DECISIONS.IGNORE, text);
  }
  if (!isOpenFragment(pending.text) || startsNewQuestion(text) || isIndependentClause(text)) {
    if (admitted.decision === DECISIONS.DEFER && isOpenFragment(text)) {
      return hold({ text, parts: 1 }, DECISIONS.DEFER, text);
    }
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, superseded: true };
  }
  const combined = joinText(pending.text, text);
  const parts = pending.parts + 1;
  if (isOpenFragment(combined) && parts < MAX_PARTS) {
    return hold({ text: combined, parts }, DECISIONS.DEFER, text);
  }
  if (isOpenFragment(combined)) {
    return hold(pending, DECISIONS.DEFER, text);
  }
  const combinedAdmit = admitQuestion(combined, { priorQuestion: "" });
  if (combinedAdmit.decision === DECISIONS.ANSWER || combinedAdmit.decision === DECISIONS.DEFER) {
    return {
      action: "complete",
      pending: null,
      text: combined,
      recordText: combined,
      disposition: null,
      generates: true
    };
  }
  return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, superseded: true };
}

module.exports = {
  MAX_PARTS,
  isOpenFragment,
  takeUtterance
};
