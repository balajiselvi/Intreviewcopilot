/**
 * Assembles only plausible open-question fragments. It ignores filler without
 * discarding a valid pending fragment, joins continuation parts, and passes
 * independent turns through without merging them.
 */
const { DECISIONS } = require("./questionAdmission.js");
const { isNoiseOnly } = require("./transcriptGuardrails.js");

const MAX_PARTS = 4;
const deferredOnIncomplete = true;

const OPEN_TAIL = new Set(
  "a an the and or but so to of in on for with at from by as about into over your you we they would could should can will do does did how what when where which who if that this".split(/\s+/)
);

function clean(raw) {
  return String(raw || "").replace(/[â€™â€˜]/g, "'").replace(/\s+/g, " ").trim();
}

function words(raw) {
  return clean(raw).toLowerCase().replace(/[^a-z0-9?+ ]/g, " ").split(/\s+/).filter(Boolean);
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
  if (!deferredOnIncomplete || !text || isClosedEllipsis(text)) return false;
  if (/[.!]\s*$/.test(text)) return false;

  const tokens = words(text);
  if (!tokens.length) return false;
  const last = tokens[tokens.length - 1].replace(/\?+$/, "");
  const content = contentWords(text);

  if (/\?\s*$/.test(text) && content.length >= 2) return false;
  if (OPEN_TAIL.has(last)) return true;
  if (/\?\s*$/.test(text)) return false;
  if (content.length > 2) return false;
  return /^(what|how|and|so|or|which|where|who)\b/i.test(text) && content.length <= 2;
}

function isIndependentTurn(raw) {
  const text = clean(raw);
  if (!text || isNoiseOnly(text)) return false;
  return /^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|have|has|tell|explain|describe|compare|walk me through|give me|connect|trace|configure|design|we\b|i\b|the meeting\b|the panel\b|the hr conversation\b|the final discussion\b|the next interviewer\b|my name is\b|thanks\b|please\b|let'?s\b|nice to meet\b)/i.test(text);
}

function makeHold(pending, recordText, disposition = DECISIONS.DEFER) {
  return {
    action: "hold",
    pending,
    text: "",
    recordText: clean(recordText),
    disposition,
    generates: false,
    deferredOnIncomplete
  };
}

function takeUtterance(pending, raw) {
  const text = clean(raw);

  if (!text) {
    if (pending) return makeHold(pending, "", DECISIONS.IGNORE);
    return { action: "pass", pending: null, text: "", recordText: "", disposition: DECISIONS.IGNORE, generates: false, deferredOnIncomplete };
  }

  if (isNoiseOnly(text)) {
    if (pending) return makeHold(pending, text, DECISIONS.IGNORE);
    return { action: "pass", pending: null, text, recordText: text, disposition: DECISIONS.IGNORE, generates: false, deferredOnIncomplete };
  }

  if (!pending || !clean(pending.text)) {
    if (isOpenFragment(text)) {
      return makeHold({ text, parts: 1 }, text, DECISIONS.DEFER);
    }
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, deferredOnIncomplete };
  }

  // A separately framed question or complete independent statement starts a new turn.
  if (isIndependentTurn(text)) {
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, superseded: true, deferredOnIncomplete };
  }

  const combined = clean(`${pending.text} ${text}`);
  const parts = Math.max(1, Number(pending.parts) || 1) + 1;

  if (parts < MAX_PARTS && isOpenFragment(combined)) {
    return makeHold({ text: combined, parts }, combined, DECISIONS.DEFER);
  }

  return {
    action: "complete",
    pending: null,
    text: combined,
    recordText: combined,
    disposition: DECISIONS.ANSWER,
    generates: true,
    deferredOnIncomplete
  };
}

module.exports = {
  MAX_PARTS,
  deferredOnIncomplete,
  isOpenFragment,
  takeUtterance
};