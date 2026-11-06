/**
 * Fast in-memory lexical retrieval with gold-module + master-boundary pinning.
 * No remote embedding calls. Right-sized context for low TTFT.
 */

import fs from "fs";
import path from "path";

const DEFAULT_TOP_K = 6;
const MAX_CHARS_PER_DOC = 1600;
const MAX_TOTAL_CHARS = 8500;

const MASTER_BOUNDARIES = "00_master_architect_boundaries.md";
const GOLD_FILE_RE = /(?:^|\/)\d{2}_[^/]+\.md$/i;

/** High-collision + procedural anchors that must pin the master boundaries doc. */
const MASTER_TRIGGER =
  /\b(?:critical actions?|critical permissions?|SoD|segregation|xs-security|XSUAA|role collections?|BTP|IAG|Public Edition|Maintain Business Roles|RSECADMIN|analysis authorizations?|RBP|SuccessFactors|SAC|Data Access Control|missing tile|ST03N|AGR_USERS|PFCG|SU24|SU25|USOBT_C|USOBX_C|PFUD|SUPC|Expert Mode|org(?:anizational)? levels?|build(?:ing)?(?:\s+\w+){0,3}\s+roles?|role(?:\s+\w+){0,2}\s+build|cutover|hypercare|CCM|KRI|Process Control|Enterprise Risk|Mitigating Control)\b/i;

function knowledgeRoot() {
  return path.resolve(process.env.KNOWLEDGE_SOURCE_DIR || path.join(process.cwd(), "knowledge"));
}

function walkMarkdown(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".claude-flow") continue;
      walkMarkdown(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function getGlobalStore() {
  if (!globalThis.__kbCache) {
    globalThis.__kbCache = { corpus: null, loadedAt: null, root: null };
  }
  return globalThis.__kbCache;
}

function loadCorpus() {
  const store = getGlobalStore();
  const root = knowledgeRoot();
  if (store.corpus && store.root === root) return store.corpus;

  const started = Date.now();
  const files = walkMarkdown(root);
  const corpus = files.map((filePath) => {
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    const text = fs.readFileSync(filePath, "utf8");
    return {
      id: rel,
      path: filePath,
      text,
      norm: text.toLowerCase(),
      isGold: GOLD_FILE_RE.test(rel) || rel === MASTER_BOUNDARIES,
      isMaster: rel === MASTER_BOUNDARIES
    };
  });

  store.corpus = corpus;
  store.root = root;
  store.loadedAt = new Date().toISOString();
  store.loadMs = Date.now() - started;
  store.size = corpus.length;
  return corpus;
}

/** Allow tests / rebuilds to refresh after KB edits. */
export function invalidateKnowledgeCache() {
  const store = getGlobalStore();
  store.corpus = null;
  store.loadedAt = null;
  store.root = null;
}

/** Eager warm for first /api/chat hit. */
export function warmKnowledgeCache() {
  const corpus = loadCorpus();
  return {
    size: corpus.length,
    loadMs: getGlobalStore().loadMs || 0,
    loadedAt: getGlobalStore().loadedAt
  };
}

const STOP = new Set([
  "how", "you", "the", "and", "for", "with", "what", "when", "where", "why",
  "does", "did", "are", "was", "can", "into", "from", "that", "this", "your",
  "our", "them", "they", "have", "has", "will", "would", "could", "should",
  "about", "walk", "through", "tell", "explain", "describe", "please",
  "during", "using", "into", "onto"
]);

function tokenize(q) {
  return String(q || "")
    .toLowerCase()
    .split(/[^a-z0-9_/+-]+/i)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function scoreDoc(doc, tokens, domain = "", question = "") {
  let score = 0;
  const idLower = doc.id.toLowerCase();
  for (const t of tokens) {
    if (doc.norm.includes(t)) score += 1;
    if (idLower.includes(t)) score += 2;
  }
  if (domain && idLower.includes(String(domain).split("-")[0])) score += 0.5;

  // Prefer relevant gold modules (path overlap) and always prefer master when triggered.
  if (doc.isMaster && MASTER_TRIGGER.test(question)) score += 14;
  else if (doc.isGold) {
    const stem = idLower.replace(/\.md$/i, "");
    const overlap = tokens.some((t) => t.length >= 4 && stem.includes(t));
    score += overlap ? 8 : 1;
  }

  // Soft preference for concise procedural KB over mega interview banks.
  if (/architect-bank/i.test(doc.id)) score -= 1.5;
  return score;
}

function excerpt(text, tokens, maxChars) {
  if (text.length <= maxChars) return text;
  const lower = text.toLowerCase();
  let bestIdx = 0;
  // Prefer PFCG / SU24 / SU25 section headers when present.
  const sectionHints = ["core pfcg role build", "su25", "cutover", "pfcg", "su24", "menu tab"];
  for (const hint of sectionHints) {
    const idx = lower.indexOf(hint);
    if (idx >= 0) {
      bestIdx = Math.max(0, idx - 120);
      break;
    }
  }
  if (bestIdx === 0) {
    for (const t of tokens.slice(0, 10)) {
      const idx = lower.indexOf(t);
      if (idx >= 0) {
        bestIdx = Math.max(0, idx - 200);
        break;
      }
    }
  }
  return text.slice(bestIdx, bestIdx + maxChars);
}

/**
 * @param {string} question
 * @param {{ domain?: string, topK?: number }} [opts]
 */
export function retrieveKnowledge(question, opts = {}) {
  const topK = Number(opts.topK) > 0 ? Number(opts.topK) : DEFAULT_TOP_K;
  const tokens = tokenize(question);
  const t0 = Date.now();
  const corpus = loadCorpus();
  const loadMs = getGlobalStore().loadMs || 0;

  const ranked = corpus
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens, opts.domain || "", question) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Ensure master boundaries is present when triggered (even if barely outside topK).
  if (MASTER_TRIGGER.test(question)) {
    const hasMaster = ranked.some((r) => r.doc.isMaster);
    if (!hasMaster) {
      const master = corpus.find((d) => d.isMaster);
      if (master) {
        ranked.unshift({
          doc: master,
          score: scoreDoc(master, tokens, opts.domain || "", question)
        });
        ranked.sort((a, b) => b.score - a.score);
        while (ranked.length > topK) ranked.pop();
      }
    }
  }

  const parts = [];
  let used = 0;
  const hits = [];
  for (const { doc, score } of ranked) {
    if (used >= MAX_TOTAL_CHARS) break;
    const budget = Math.min(MAX_CHARS_PER_DOC, MAX_TOTAL_CHARS - used);
    const body = excerpt(doc.text, tokens, budget);
    parts.push(`### Source: ${doc.id} (score=${score.toFixed(2)})\n${body}`);
    used += body.length;
    hits.push({ id: doc.id, score, chars: body.length, gold: Boolean(doc.isGold) });
  }

  return {
    knowledgeBlock: parts.join("\n\n"),
    hits,
    corpusSize: corpus.length,
    totalChars: used,
    retrievalMs: Date.now() - t0,
    cacheLoadMs: loadMs,
    cacheWarm: Boolean(getGlobalStore().loadedAt)
  };
}
