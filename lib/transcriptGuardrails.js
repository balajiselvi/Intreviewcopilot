/**
 * Live-transcript guardrails for the interview copilot.
 * Layer 1: noise → IGNORE_NOISE
 * Layer 2: phonetic / phrasal repair into SAP terms
 * Layer 3: incomplete / mid-sentence reconstruction
 */

const IGNORE_NOISE_TOKEN = "[IGNORE_NOISE]";

const NOISE_EXACT = new Set([
  "okay",
  "ok",
  "ok ok",
  "okay okay",
  "hmm",
  "hmmm",
  "mm",
  "mmm",
  "mhm",
  "uh huh",
  "go ahead",
  "yes",
  "yes yes",
  "yeah",
  "yep",
  "sure",
  "sure sure",
  "hello",
  "hi",
  "hey",
  "thank you",
  "thanks",
  "thanks a lot",
  "lets start",
  "let's start",
  "are you ready",
  "are you ready?",
  "next question",
  "next",
  "can you hear me",
  "can you hear me?",
  "please continue",
  "continue",
  "got it",
  "understood",
  "right",
  "alright",
  "all right"
]);

const NOISE_PATTERNS = [
  /^(?:okay|ok|yes|yeah|sure)(?:\s+(?:okay|ok|yes|yeah|sure)){0,4}[.!?]*$/i,
  /^(?:hmm+|m+h+m*|uh+\s*huh+)[.!?]*$/i,
  /^(?:go\s+ahead|next(?:\s+question)?|let'?s\s+start|please\s+continue)[.!?]*$/i,
  /^(?:can\s+you\s+hear\s+me|are\s+you\s+ready)\??$/i,
  /^(?:hi|hello|hey)(?:\s+\w+){0,2}[.!?]*$/i,
  /^(?:thank(?:s| you)|thanks(?:\s+a\s+lot)?)[.!?]*$/i,
  /^my\s+name\s+is\b/i,
  /^(?:good\s+)?(?:morning|afternoon|evening)(?:\s+everyone)?[.!?]*$/i
];

const PHONETIC_REPLACEMENTS = [
  [/\bsplitation\s+of\s+duties\b/gi, "Segregation of Duties (SoD)"],
  [/\bseparation\s+of\s+duties\b/gi, "Segregation of Duties (SoD)"],
  [/\bsegregation\s+of\s+duty\b/gi, "Segregation of Duties (SoD)"],
  [/\bfee[- ]?ori\b/gi, "SAP Fiori"],
  [/\bfury\b(?=\s+(?:launchpad|tile|app|role|catalog|security))/gi, "SAP Fiori"],
  [/\bm[- ]?s[- ]?m[- ]?p\b/gi, "MSMP Workflow"],
  [/\bmsm\s*p\b/gi, "MSMP Workflow"],
  [/\bmsmp\s+workflow\b/gi, "MSMP Workflow"],
  [/\bbrf\s*plus\b/gi, "BRF+"],
  [/\bb[- ]?r[- ]?f\b(?!\+)/gi, "BRF+"],
  [/\bbrfplus\b/gi, "BRF+"],
  [/\bsu\s*twenty[- ]?four\b/gi, "SU24"],
  [/\bs\s*u\s*24\b/gi, "SU24"],
  [/\bsu\s*twenty[- ]?five\b/gi, "SU25"],
  [/\bs\s*u\s*25\b/gi, "SU25"],
  [/\bsu\s*fifty[- ]?three\b/gi, "SU53"],
  [/\bs\s*u\s*53\b/gi, "SU53"],
  [/\bst[- ]?auth[- ]?trace\b/gi, "STAUTHTRACE"],
  [/\bst\s*auth\s*trace\b/gi, "STAUTHTRACE"],
  [/\bi[- ]?a[- ]?g\b/gi, "SAP Cloud IAG"],
  [/\bay[- ]?ay[- ]?gee\b/gi, "SAP Cloud IAG"],
  [/\bias\s*\/\s*ips\b/gi, "SAP Cloud Identity Services (IAS/IPS)"],
  [/\bias\s+and\s+ips\b/gi, "SAP Cloud Identity Services (IAS/IPS)"],
  [/\bx[- ]?s[- ]?u[- ]?a[- ]?a\b/gi, "XSUAA"],
  [/\bxsua\b/gi, "XSUAA"],
  [/\bcert[- ]?rule\b/gi, "CERTRULE"],
  [/\bcertrule\b/gi, "CERTRULE"],
  [/\bp[- ]?f[- ]?c[- ]?g\b/gi, "PFCG"],
  [/\bpfcg\b/gi, "PFCG"]
];

function compactNoiseKey(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\w\s'?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoiseOnly(raw) {
  const text = String(raw || "").trim();
  if (!text) return true;
  const key = compactNoiseKey(text);
  if (!key) return true;
  if (NOISE_EXACT.has(key)) return true;
  if (NOISE_PATTERNS.some((pattern) => pattern.test(text.trim()))) return true;
  // Pure social with no technical residue
  const tokens = key.split(/\s+/).filter(Boolean);
  if (tokens.length <= 6 && tokens.every((token) => NOISE_EXACT.has(token) || ["please", "everyone", "for", "asking", "me", "a", "lot"].includes(token))) {
    return true;
  }
  return false;
}

function normalizePhonetics(raw) {
  let text = String(raw || "");
  if (!text.trim()) return text;
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

function looksTechnicalProcedureFragment(raw) {
  const text = String(raw || "").trim();
  if (!text || text.length < 24) return false;
  if (/^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|explain|describe|tell|walk|compare|outline)\b/i.test(text)) {
    return false;
  }
  return /\b(?:SU24|SU25|SU53|PFCG|MSMP|BRF\+|IAG|IAS|IPS|XSUAA|CERTRULE|STAUTHTRACE|Fiori|SoD|authorization|role|proposal|workflow|ruleset|Firefighter|GRC)\b/i.test(text)
    && /\b(?:handle|maintain|configure|design|troubleshoot|implement|remediat|validat|propos|modif|integrat|provision|approv|trace|assign)\w*\b/i.test(text);
}

function reconstructIncompleteAsk(raw) {
  const text = String(raw || "").trim();
  if (!text) return text;
  if (/^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|explain|describe|tell|walk|compare|outline|have|did you)\b/i.test(text)) {
    return text;
  }
  if (!looksTechnicalProcedureFragment(text)) return text;
  const trimmed = text.replace(/^[.,;:\s]+/, "");
  const body = /[.?!]$/.test(trimmed) ? trimmed : `${trimmed}?`;
  return `How do you ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
}

function prepareLiveTranscript(raw) {
  const original = String(raw || "");
  if (isNoiseOnly(original)) {
    return {
      original,
      normalized: original.trim(),
      ignoreNoise: true,
      reconstructed: false,
      ignoreToken: IGNORE_NOISE_TOKEN
    };
  }
  const phonetic = normalizePhonetics(original);
  const reconstructedText = reconstructIncompleteAsk(phonetic);
  return {
    original,
    normalized: reconstructedText,
    ignoreNoise: false,
    reconstructed: reconstructedText !== phonetic,
    ignoreToken: null
  };
}

module.exports = {
  IGNORE_NOISE_TOKEN,
  isNoiseOnly,
  normalizePhonetics,
  reconstructIncompleteAsk,
  looksTechnicalProcedureFragment,
  prepareLiveTranscript
};
