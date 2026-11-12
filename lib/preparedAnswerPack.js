/**
 * Prepared-answer pack loader for interview-day safe mode.
 * Only APPROVED entries are served. NEEDS_REVIEW drafts never enter the live pack.
 */
const fs = require("fs");
const path = require("path");

const PACK_ROOT = path.join(process.cwd(), "data", "prepared-packs");
const DEFAULT_PROFILE_SLUG = "protiviti-senior-manager-sap-security-grc";

const cache = new Map();

function normalizeQuestion(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s+/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(
    normalizeQuestion(text)
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccard(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function productVersionGuard(question = "", entry = {}) {
  const q = String(question || "");
  const product = String(entry.product || "");
  const version = String(entry.version_scope || entry.version || "");
  if (/\bpublic\s+edition\b/i.test(q) && /\bprivate\s+edition\b|\bon[- ]prem/i.test(`${product} ${version} ${entry.answer || ""}`)) {
    if (!/\bpublic\s+edition\b/i.test(entry.answer || "")) return { ok: false, reason: "edition-mismatch" };
  }
  if (/\bIAG\b/i.test(q) && /\bMSMP\b|\bGRC\s*12\b/i.test(entry.answer || "") && !/\bIAG\b/i.test(entry.answer || "")) {
    return { ok: false, reason: "product-mismatch" };
  }
  return { ok: true, reason: "ok" };
}

function loadPack(profileSlug = DEFAULT_PROFILE_SLUG) {
  const slug = String(profileSlug || DEFAULT_PROFILE_SLUG).trim() || DEFAULT_PROFILE_SLUG;
  if (cache.has(slug)) return cache.get(slug);
  const packPath = path.join(PACK_ROOT, slug, "pack.json");
  let pack = {
    profileSlug: slug,
    status: "missing",
    entries: [],
    approvedEntries: [],
    path: packPath
  };
  try {
    if (fs.existsSync(packPath)) {
      const raw = JSON.parse(fs.readFileSync(packPath, "utf8"));
      const entries = Array.isArray(raw.entries) ? raw.entries : [];
      pack = {
        profileSlug: slug,
        status: raw.status || "loaded",
        title: raw.title || slug,
        generated_on: raw.generated_on || null,
        entries,
        approvedEntries: entries.filter((e) => String(e.approval_status || "").toUpperCase() === "APPROVED"),
        path: packPath
      };
    }
  } catch (error) {
    pack.status = "error";
    pack.error = error.message;
  }
  cache.set(slug, pack);
  return pack;
}

function resetPreparedPackCache() {
  cache.clear();
}

/**
 * High-confidence match against APPROVED entries only.
 */
function matchPreparedAnswer(question, {
  profileSlug = DEFAULT_PROFILE_SLUG,
  minScore = 0.55
} = {}) {
  const pack = loadPack(profileSlug);
  const approved = pack.approvedEntries || [];
  if (!approved.length) {
    return { hit: false, reason: "no-approved-entries", packStatus: pack.status };
  }
  let best = null;
  let bestScore = 0;
  for (const entry of approved) {
    const score = Math.max(
      jaccard(question, entry.question),
      ...(Array.isArray(entry.paraphrases) ? entry.paraphrases.map((p) => jaccard(question, p)) : [])
    );
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (!best || bestScore < minScore) {
    return { hit: false, reason: "low-confidence", score: bestScore, packStatus: pack.status };
  }
  const guard = productVersionGuard(question, best);
  if (!guard.ok) {
    return { hit: false, reason: guard.reason, score: bestScore, entryId: best.id };
  }
  return {
    hit: true,
    score: bestScore,
    entry: best,
    answer: String(best.spoken_answer || best.answer || "").trim(),
    headline: String(best.headline || "").trim(),
    route: "PREPARED_PACK",
    packStatus: pack.status
  };
}

function listNeedsReview(profileSlug = DEFAULT_PROFILE_SLUG) {
  const pack = loadPack(profileSlug);
  return (pack.entries || []).filter((e) => String(e.approval_status || "NEEDS_REVIEW").toUpperCase() !== "APPROVED");
}

module.exports = {
  PACK_ROOT,
  DEFAULT_PROFILE_SLUG,
  loadPack,
  matchPreparedAnswer,
  listNeedsReview,
  resetPreparedPackCache,
  productVersionGuard,
  normalizeQuestion
};
