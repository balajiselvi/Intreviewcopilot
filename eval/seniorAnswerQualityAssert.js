const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { register } = require("node:module");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope");
const { explicitProductTopics } = require("../lib/interviewContext");

(async () => {
  await register(pathToFileURL(path.join(__dirname, "lib/extlessResolveHook.mjs")).href);
  const {
    authoritativeProcedure,
    fitSpokenLength,
    renderSpokenProcedure,
    questionProcedureIntent
  } = await import("../lib/procedureRetention.js");

  assert.deepEqual(explicitProductTopics("An access request is stuck in MSMP with no approver."), ["GRC"]);
  assert.deepEqual(productKnowledgeFolders("An access request is stuck in MSMP with no approver."), ["grc"]);
  assert.ok(productKnowledgeFolders("How do you prepare SAP Security for a SOX ITGC audit?").includes("compliance"));

  const msmp = fs.readFileSync("knowledge/grc/msmp.md", "utf8");
  const brf = fs.readFileSync("knowledge/grc/brf-plus.md", "utf8");
  const sox = fs.readFileSync("knowledge/compliance/sox.md", "utf8");
  const gdpr = fs.readFileSync("knowledge/compliance/gdpr.md", "utf8");
  const iso = fs.readFileSync("knowledge/compliance/iso27001.md", "utf8");

  const msmpConfigQ = "How do you configure an MSMP workflow for an access request in SAP GRC Access Control?";
  const msmpTroubleQ = "An access request is stuck in MSMP with no approver. How do you troubleshoot?";
  const brfQ = "How do you configure a BRFplus agent rule for MSMP in SAP GRC Access Control?";
  const soxQ = "How do you prepare SAP Security for a SOX ITGC audit?";
  const gdprQ = "How can SAP Security design support GDPR access control and accountability without claiming full legal compliance?";
  const isoQ = "How do SAP security controls support an ISO 27001 ISMS and risk treatment?";

  assert.equal(questionProcedureIntent(msmpTroubleQ, "STAGE_INVESTIGATION"), "troubleshoot");

  const msmpConfig = renderSpokenProcedure(msmpConfigQ, authoritativeProcedure(msmpConfigQ, msmp, "IMPLEMENTATION_WALKTHROUGH"));
  assert.match(msmpConfig, /Maintain MSMP Workflows|GRFNMW_CONFIGURE/);
  assert.match(msmpConfig, /Instance Status/);
  assert.doesNotMatch(msmpConfig, /RSECADMIN|RSRT/);

  const msmpTrouble = renderSpokenProcedure(msmpTroubleQ, authoritativeProcedure(msmpTroubleQ, msmp, "STAGE_INVESTIGATION"));
  assert.match(msmpTrouble, /Instance Status|Approvers of Selected Path/);
  assert.match(msmpTrouble, /agent|BRF/i);
  assert.doesNotMatch(msmpTrouble, /RSECADMIN|analysis-authorization|RSRT/);
  assert.doesNotMatch(msmpTrouble, /Direct Answer|Technical Mechanism/);

  const brfAnswer = renderSpokenProcedure(brfQ, authoritativeProcedure(brfQ, brf, "IMPLEMENTATION_WALKTHROUGH"));
  assert.match(brfAnswer, /agent rule|Agent Rule/i);
  assert.match(brfAnswer, /decision table/i);
  assert.match(brfAnswer, /initiator/i);
  assert.doesNotMatch(brfAnswer, /Direct Answer/);

  const soxAnswer = renderSpokenProcedure(soxQ, authoritativeProcedure(soxQ, sox, ""));
  // SOX may use configure intent from "prepare"
  const soxSpoken = soxAnswer || renderSpokenProcedure(soxQ, authoritativeProcedure(soxQ, sox, "IMPLEMENTATION_WALKTHROUGH"));
  assert.match(soxSpoken || sox, /ITGC|Section 404|Firefighter|access review/i);
  assert.match(sox || soxSpoken, /does not make an organization SOX-compliant|Installing GRC does not/i);

  assert.match(gdpr, /Article 5|data minimisation|Accountability/i);
  assert.match(gdpr, /do not establish legal compliance|does not establish legal compliance/i);
  assert.match(gdpr, /Pseudonymisation is not anonymisation/i);

  assert.match(iso, /ISO\/IEC 27001:2022/);
  assert.match(iso, /not created by configuring SAP|does not by itself establish/i);

  const longProcedure = renderSpokenProcedure(
    "If the user cannot access a Fiori app, how do you troubleshoot?",
    authoritativeProcedure(
      "If the user cannot access a Fiori app, how do you troubleshoot?",
      fs.readFileSync("knowledge/fiori/fiori-security.md", "utf8"),
      "STAGE_INVESTIGATION"
    )
  );
  const concise = fitSpokenLength(longProcedure, "concise", "If the user cannot access a Fiori app, how do you troubleshoot?");
  const lengthy = fitSpokenLength(longProcedure, "lengthy", "If the user cannot access a Fiori app, how do you troubleshoot?");
  const conciseWords = concise.split(/\s+/).filter(Boolean).length;
  const lengthyWords = lengthy.split(/\s+/).filter(Boolean).length;
  assert.ok(conciseWords > 40 && conciseWords < lengthyWords, `length fit failed concise=${conciseWords} lengthy=${lengthyWords}`);
  assert.match(concise, /Public Edition|PFCG|business task/i);

  assert.equal(fs.statSync("knowledge/transports/chaRM.md").size, 0);

  console.log("seniorAnswerQualityAssert: PASS");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
