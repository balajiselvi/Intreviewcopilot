/**
 * Assembles a deferred open fragment with a later utterance.
 *
 * ZERO-DROPPED-TRANSCRIPT POLICY: never hold/DEFER. Always pass the utterance through
 * so admission + generation run immediately. Mid-sentence repair happens in transcriptGuardrails.
 */
const { admitQuestion, DECISIONS } = require("./questionAdmission.js");

const MAX_PARTS = 4;
const deferredOnIncomplete = false;

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
  // Policy: never treat fragments as holdable incomplete speech.
  if (!deferredOnIncomplete) return false;
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

function takeUtterance(pending, raw) {
  const text = clean(raw);
  // Zero-drop: clear any stale pending hold and always pass through.
  if (!deferredOnIncomplete) {
    return {
      action: "pass",
      pending: null,
      text,
      recordText: text,
      disposition: null,
      generates: false,
      deferredOnIncomplete
    };
  }

  const admitted = admitQuestion(text, { priorQuestion: "" });
  if (!pending) {
    if (isOpenFragment(text)) {
      return {
        action: "hold",
        pending: { text, parts: 1 },
        text: "",
        recordText: text,
        disposition: DECISIONS.DEFER,
        generates: false
      };
    }
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false };
  }
  // Legacy multi-part path retained but unreachable while deferredOnIncomplete === false.
  void admitted;
  return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, superseded: true };
}

module.exports = {
  MAX_PARTS,
  deferredOnIncomplete,
  isOpenFragment,
  takeUtterance
};
