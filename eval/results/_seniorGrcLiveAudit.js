/**
 * Live audit of the six priority GRC/compliance questions.
 * Uses /api/chat plus production product-scoped cosine ranking.
 */
process.env.EVAL_APP_BASE_URL = process.env.EVAL_APP_BASE_URL || "http://127.0.0.1:3000";

const fs = require("node:fs");
const path = require("node:path");
const { generateAnswer } = require("../lib/generateAnswer");
const { explicitProductTopics } = require("../../lib/interviewContext");
const { productKnowledgeFolders } = require("../../lib/productKnowledgeScope");
const { generateEmbedding } = require("../../services/embeddingService");

function cosine(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

async function askLive(question, sessionId, responseLength = "medium") {
  const res = await fetch(`${process.env.EVAL_APP_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      question,
      responseLength,
      history: [],
      interviewSessionId: sessionId
    })
  });
  const text = await res.text();
  const events = [];
  for (const block of text.split("\n\n")) {
    const data = block.split("\n").filter((line) => line.startsWith("data: ")).map((line) => line.slice(6)).join("");
    if (!data || data === "[DONE]") continue;
    try { events.push(JSON.parse(data)); } catch { /* ignore */ }
  }
  const admission = events.find((event) => event.route) || {};
  const answer = events.map((event) => event.text || "").join("").trim();
  return {
    status: res.status,
    route: admission.route || null,
    responseLength: admission.responseLength || null,
    intent: admission.intent || null,
    answerScope: admission.answerScope || null,
    topic: admission.topic || null,
    words: words(answer),
    opening: answer.slice(0, 140),
    answer,
    heading: /direct answer|technical mechanism|validation and operational boundary|key takeaways|\bconclusion\b/i.test(answer)
  };
}

const CASES = [
  {
    id: "msmp_config",
    q: "How do you configure an MSMP workflow for access requests?",
    must: [/Maintain MSMP Workflows|GRFNMW_CONFIGURE/i, /initiator|path|stage|RULE_RESULT|route/i, /Instance Status|Request Status/i],
    mustNot: [/RSECADMIN|RSRT|analysis.?authorization|GRCMSMP/i, /Direct Answer|Technical Mechanism/i],
    mustRoute: /RETRIEVED_PROCEDURE|PREPARED_SCRIPT/,
    expectFolders: ["grc"]
  },
  {
    id: "msmp_trouble",
    q: "How do you troubleshoot an MSMP workflow that is stuck?",
    must: [/Instance Status|Request Status/i, /approver|agent|BRF/i],
    mustNot: [/RSECADMIN|RSRT|GRCMSMP/i, /Direct Answer/i],
    mustRoute: /RETRIEVED_PROCEDURE|PREPARED_SCRIPT/,
    expectFolders: ["grc"]
  },
  {
    id: "brf_agent",
    q: "How do you configure BRF+ agent determination and integrate it with MSMP?",
    must: [/agent rule|Agent Rule|decision table/i, /MSMP|Maintain MSMP/i, /Define Workflow-Related MSMP Rules/i],
    mustNot: [/RSECADMIN|RSRT|GRCMSMP/i, /Direct Answer/i],
    mustRoute: /RETRIEVED_PROCEDURE|PREPARED_SCRIPT/,
    expectFolders: ["grc"]
  },
  {
    id: "sox",
    q: "How do you prepare SAP Security for a SOX ITGC audit?",
    must: [/ITGC|Firefighter|access review|SoD|segregation/i, /does not make|Installing GRC does not|not make the organization SOX|auditors test/i],
    mustNot: [/Direct Answer/i],
    expectFolders: ["audit", "compliance", "grc"]
  },
  {
    id: "gdpr",
    q: "How would you design SAP Security controls to support GDPR?",
    must: [/personal data|permission|purpose/i, /not establish legal compliance|Technical controls alone|not invent/i],
    mustNot: [/Direct Answer/i],
    expectFolders: ["audit", "compliance", "grc"]
  },
  {
    id: "iso",
    q: "How does SAP Security support an ISO 27001 ISMS?",
    must: [/ISMS|Statement of Applicability|risk treatment|risk assessment/i, /not proof of ISO|not proof of certification|certification/i],
    mustNot: [/Direct Answer/i],
    expectFolders: ["audit", "compliance", "grc"]
  }
];

(async () => {
  const index = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/knowledgeIndex.json"), "utf8"));
  const failures = [];
  const rows = [];

  for (const item of CASES) {
    const topics = explicitProductTopics(item.q);
    const folders = productKnowledgeFolders(item.q);
    const live = await askLive(item.q, `senior_grc_${item.id}_${Date.now()}`, "medium");
    const scoped = index.chunks.filter((chunk) => folders.length === 0 || folders.includes(String(chunk.sourceFolder || "").toLowerCase()));
    const qv = await generateEmbedding(item.q);
    const ranked = scoped
      .map((chunk) => ({
        file: chunk.sourceFile,
        folder: chunk.sourceFolder,
        heading: chunk.heading,
        score: Number(cosine(qv, chunk.embedding || []).toFixed(4)),
        excerpt: String(chunk.content || "").slice(0, 220)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const row = {
      id: item.id,
      question: item.q,
      topics,
      folders,
      route: live.route,
      responseLength: live.responseLength,
      intent: live.intent,
      answerScope: live.answerScope,
      words: live.words,
      heading: live.heading,
      opening: live.opening,
      answer: live.answer,
      topSources: ranked
    };
    rows.push(row);

    for (const folder of item.expectFolders) {
      if (!folders.includes(folder)) failures.push(`${item.id} missing folder ${folder}; got ${folders.join(",")}`);
    }
    for (const re of item.must) {
      if (!re.test(live.answer)) failures.push(`${item.id} missing ${re}`);
    }
    for (const re of item.mustNot) {
      if (re.test(live.answer)) failures.push(`${item.id} hit forbidden ${re}`);
    }
    if (item.mustRoute && !item.mustRoute.test(String(live.route || ""))) {
      failures.push(`${item.id} unexpected route ${live.route}`);
    }
    if (/^If it does\b/i.test(live.answer.trim())) failures.push(`${item.id} lost opening sentence`);
    if (live.heading) failures.push(`${item.id} report heading`);
    if (/GRCMSMP/i.test(live.answer)) failures.push(`${item.id} fabricated GRCMSMP transaction`);
    if (item.id.startsWith("msmp") || item.id === "brf_agent") {
      const topFiles = ranked.slice(0, 3).map((r) => r.file);
      if (!topFiles.some((f) => /msmp|brf-plus|arm/i.test(f))) {
        failures.push(`${item.id} top retrieval not GRC workflow content: ${topFiles.join(",")}`);
      }
      if (topFiles.some((f) => /bw|rsec|analysis/i.test(f))) {
        failures.push(`${item.id} BW contamination in top sources`);
      }
    }
    console.log(`\n===== ${item.id} route=${live.route} words=${live.words} folders=${folders.join("|")} =====`);
    console.log(live.answer);
    console.log("--- top sources ---");
    for (const src of ranked.slice(0, 5)) {
      console.log(`  ${src.score} ${src.file} | ${src.heading}`);
    }
  }

  const out = path.join(__dirname, "senior-grc-live-audit.json");
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), failures, rows }, null, 2));
  console.log(`\nWrote ${out}`);
  if (failures.length) {
    console.error("\nFAILURES:\n" + failures.join("\n"));
    process.exit(1);
  }
  console.log("seniorGrcLiveAudit: PASS");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
