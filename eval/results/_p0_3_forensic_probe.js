/* READ-ONLY forensic probe for P0.3 — do not import into production. */
const fs = require("fs");
const path = require("path");

const SESSION = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "interview-sessions",
  "live_mvt4dz46_5fcq9n4o.json"
);

const s = JSON.parse(fs.readFileSync(SESSION, "utf8"));
const out = {
  sessionPath: SESSION,
  topKeys: Object.keys(s),
  sessionId: s.sessionId || s.id || s.interviewSessionId || null,
  updatedAt: s.updatedAt || s.lastUpdated || s.modifiedAt || null,
  createdAt: s.createdAt || null
};

const qas = s.qa || s.qas || s.turns || s.history || s.messages || s.entries || s.liveQas || [];
out.qaCount = Array.isArray(qas) ? qas.length : typeof qas;
out.qaContainer = Array.isArray(s.qa)
  ? "qa"
  : Array.isArray(s.qas)
    ? "qas"
    : Array.isArray(s.turns)
      ? "turns"
      : Array.isArray(s.history)
        ? "history"
        : "unknown";
out.startedAt = s.startedAt || null;
out.endedAt = s.endedAt || null;
out.jobLabel = s.jobLabel || null;
out.company = s.company || null;
out.model = s.model || null;
out.source = s.source || null;

if (!Array.isArray(qas)) {
  out.sample = JSON.stringify(s).slice(0, 800);
  fs.writeFileSync(path.join(__dirname, "_p0_3_forensic_probe_out.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

function textOf(qa) {
  return {
    question: String(qa.question || ""),
    questionRaw: String(qa.questionRaw || ""),
    questionResolved: String(qa.questionResolved || qa.questionResolvedText || ""),
    answer: String(qa.answerShown || qa.answer || qa.finalAnswer || ""),
    route: qa.route || qa.disposition || qa.source || null,
    scriptId: qa.scriptId || qa.usage?.scriptId || qa.meta?.scriptId || null,
    model: qa.model || null,
    evidenceMode: qa.evidenceMode || null,
    status: qa.status || null,
    turnId: qa.turnId || qa.id || null,
    timestamp: qa.timestamp || qa.ts || qa.createdAt || qa.at || null,
    provenance: qa.provenance || qa.answerProvenance || qa.usage || null
  };
}

const hits = [];
qas.forEach((qa, i) => {
  const t = textOf(qa);
  const blob = `${t.question}\n${t.questionRaw}\n${t.questionResolved}\n${t.answer}`;
  if (
    /integrates with S\/?4|Firefighter ID|centralized and decentralized|I explain SAP GRC Access Control|GRC asks who should have access|threat detection asks what is happening/i.test(
      blob
    )
  ) {
    hits.push({ index: i, ...t, answerFull: t.answer, answerHead: t.answer.slice(0, 280) });
  }
});

out.hits = hits.map((h) => ({
  index: h.index,
  turnId: h.turnId,
  timestamp: h.timestamp,
  route: h.route,
  scriptId: h.scriptId,
  model: h.model,
  evidenceMode: h.evidenceMode,
  status: h.status,
  question: h.question,
  questionRaw: h.questionRaw,
  questionResolved: h.questionResolved,
  answerHead: h.answerHead,
  answerLen: h.answerFull.length,
  provenanceKeys: h.provenance && typeof h.provenance === "object" ? Object.keys(h.provenance) : null
}));

out.last20 = qas.slice(-20).map((qa, idx) => {
  const t = textOf(qa);
  return {
    index: qas.length - 20 + idx,
    turnId: t.turnId,
    timestamp: t.timestamp,
    route: t.route,
    scriptId: t.scriptId,
    model: t.model,
    question: (t.questionRaw || t.question).slice(0, 140),
    answerHead: t.answer.slice(0, 120)
  };
});

// Full dump of hit turns for the report
out.hitDetails = hits.map((h) => {
  const raw = qas[h.index];
  return {
    index: h.index,
    turnId: h.turnId,
    timestamp: h.timestamp,
    question: h.question,
    questionRaw: h.questionRaw,
    questionResolved: h.questionResolved,
    answer: h.answerFull,
    route: h.route,
    scriptId: h.scriptId,
    model: h.model,
    evidenceMode: h.evidenceMode,
    status: h.status,
    provenance: h.provenance,
    interviewContext: raw.interviewContext || raw.context || null,
    previousQuestion: qas[h.index - 1]
      ? String(qas[h.index - 1].questionRaw || qas[h.index - 1].question || "").slice(0, 200)
      : null,
    previousAnswerHead: qas[h.index - 1]
      ? String(qas[h.index - 1].answerShown || qas[h.index - 1].answer || "").slice(0, 200)
      : null,
    rawKeys: Object.keys(raw)
  };
});

fs.writeFileSync(path.join(__dirname, "_p0_3_forensic_probe_out.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  sessionId: out.sessionId,
  updatedAt: out.updatedAt,
  qaCount: out.qaCount,
  hitCount: out.hits.length,
  hits: out.hits,
  last20: out.last20
}, null, 2));
