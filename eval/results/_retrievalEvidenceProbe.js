process.env.EVAL_APP_BASE_URL = process.env.EVAL_APP_BASE_URL || "http://127.0.0.1:3000";
const { explicitProductTopics } = require("../../lib/interviewContext");
const { productKnowledgeFolders } = require("../../lib/productKnowledgeScope");
const { generateAnswer } = require("../lib/generateAnswer");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");
const fs = require("node:fs");

const CASES = [
  {
    id: "msmp_config",
    q: "How do you configure an MSMP workflow for an access request in SAP GRC Access Control?",
    must: [/Maintain MSMP Workflows|GRFNMW_CONFIGURE/i, /Instance Status|RULE_RESULT/i],
    mustNot: [/RSECADMIN|RSRT/i, /Direct Answer|Technical Mechanism/i]
  },
  {
    id: "msmp_trouble",
    q: "An access request is stuck in MSMP with no approver. How do you troubleshoot?",
    must: [/Instance Status|Approvers of Selected Path/i, /agent|BRF/i],
    mustNot: [/RSECADMIN|RSRT|analysis-authorization/i]
  },
  {
    id: "brf_agent",
    q: "How do you configure a BRFplus agent rule for MSMP in SAP GRC Access Control?",
    must: [/Agent Rule|agent rule/i, /decision table/i],
    mustNot: [/RSECADMIN|RSRT/i]
  },
  {
    id: "sox",
    q: "How do you prepare SAP Security for a SOX ITGC audit?",
    must: [/ITGC|Firefighter|access review/i, /does not make|Installing GRC does not|not make the organization SOX/i],
    mustNot: [/Direct Answer/i]
  },
  {
    id: "gdpr",
    q: "How can SAP Security design support GDPR access control and accountability without claiming full legal compliance?",
    must: [/personal data|permission|Security Audit Log/i, /not establish legal compliance|Technical controls alone|not invent/i],
    mustNot: [/Direct Answer/i]
  },
  {
    id: "iso",
    q: "How do SAP security controls support an ISO 27001 ISMS and risk treatment?",
    must: [/ISMS|Statement of Applicability|risk treatment/i, /not proof of ISO|not proof of certification|certification/i],
    mustNot: [/Direct Answer/i]
  }
];

(async () => {
  await register(pathToFileURL("eval/lib/extlessResolveHook.mjs").href);
  const { authoritativeProcedure, renderSpokenProcedure, fitSpokenLength } = await import("../../lib/procedureRetention.js");
  const index = JSON.parse(fs.readFileSync("data/knowledgeIndex.json", "utf8"));
  const failures = [];

  for (const item of CASES) {
    const topics = explicitProductTopics(item.q);
    const folders = productKnowledgeFolders(item.q);
    const live = await generateAnswer(item.q, {
      interviewSessionId: `evidence_${item.id}_${Date.now()}`,
      history: [],
      responseLength: "medium"
    });
    const answer = live.answer || "";
    const scoped = index.chunks.filter((chunk) => folders.length === 0 || folders.includes(chunk.sourceFolder));
    const localPool = scoped
      .filter((chunk) => /MSMP|BRF|SOX|GDPR|ISO|ITGC|Firefighter|agent|stuck|ISMS|personal data|access request/i.test(`${chunk.heading}\n${chunk.content}`))
      .slice(0, 20)
      .map((chunk) => `## ${chunk.heading}\n${chunk.content}`)
      .join("\n\n");
    const steps = authoritativeProcedure(item.q, localPool || scoped.slice(0, 12).map((c) => `## ${c.heading}\n${c.content}`).join("\n\n"), "");
    const localSpoken = fitSpokenLength(renderSpokenProcedure(item.q, steps), "medium", item.q);
    const row = {
      id: item.id,
      topics,
      folders,
      words: answer.split(/\s+/).filter(Boolean).length,
      opening: answer.slice(0, 90),
      localOpening: localSpoken.slice(0, 90),
      localSteps: steps.length,
      selectedHeadings: [...new Set(scoped.filter((chunk) => steps.some((step) => chunk.content.includes(step.slice(0, 40)))).map((chunk) => `${chunk.sourceFile} | ${chunk.heading}`))].slice(0, 5),
      livePreview: answer.slice(0, 280)
    };
    for (const re of item.must) {
      if (!re.test(answer)) failures.push(`${item.id} missing ${re}`);
    }
    for (const re of item.mustNot) {
      if (re.test(answer)) failures.push(`${item.id} hit forbidden ${re}`);
    }
    if (/^If it does\b/i.test(answer.trim())) failures.push(`${item.id} lost opening sentence`);
    if (item.id === "msmp_config" && !/^I would first check\b/i.test(answer.trim())) {
      failures.push(`${item.id} missing direct opening check`);
    }
    console.log(JSON.stringify(row, null, 2));
  }

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("retrievalEvidenceProbe: PASS");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
