const fs = require("fs");
const path = require("path");
const { chatJSON } = require("./lib/openaiClient");
const { segmentTranscript, extractJudgmentRecordFromSpan } = require("../lib/engineeringMemory/extraction");
const { parseJudgmentRecord } = require("../lib/engineeringMemory/schema");

// The first REAL acquisition session -- three real answers provided by the candidate, run
// through the actual, unmodified extraction pipeline (lib/engineeringMemory/extraction.js).
// No rewriting, no reconstruction -- whatever comes out is what comes out, including nulls.
// Not stored into data/engineeringMemory.json yet -- shown first for review.

const ANSWERS = [
  {
    label: "Example 1: Large-scale GRC implementation",
    text: `In a large-scale SAP GRC implementation, the primary business requirement was to establish a robust access control framework to mitigate segregation of duties (SoD) risks across multiple business units. The solution design involved configuring SAP Access Control to automate SoD risk analysis and implement continuous monitoring. Key decisions included defining risk classification criteria, selecting appropriate rule types for authorization objects, and mapping controls to identified risks. We faced challenges in aligning business processes with technical controls, particularly in complex environments with legacy systems. Alternatives like manual audits were considered but rejected due to scalability issues. The implementation involved configuring ARA for automated risk analysis and ARM for role management. Post go-live, continuous monitoring was established, and periodic access reviews were conducted to ensure compliance. The outcome was a significant reduction in SoD violations and improved audit readiness.`
  },
  {
    label: "Example 2: SoD redesign",
    text: `In a complex Segregation of Duties (SoD) redesign, the challenge was integrating a new business unit into an existing SAP landscape while maintaining compliance. This involved over 200 SoD risks and approximately 500 rules, covering various authorization objects and transaction codes. The difficulty lay in harmonizing diverse business processes and legacy systems with the existing SoD framework. We evaluated options such as creating custom roles versus using standard SAP roles. Custom roles offered tailored access but increased maintenance complexity, while standard roles provided consistency but required significant adjustments to fit business needs. The final design involved a hybrid approach: leveraging standard roles where possible and creating custom roles for unique business requirements. We used SAP Access Control's ARA module to simulate and analyze potential SoD conflicts, ensuring that the new roles did not introduce additional risks. This approach balanced flexibility and compliance, reducing SoD violations and streamlining role management. Continuous monitoring and periodic reviews were implemented to maintain the integrity of the access control framework.`
  },
  {
    label: "Example 3: ARM workflow",
    text: `In implementing an Access Request Management (ARM) workflow for a multinational client, the goal was to streamline user provisioning while ensuring compliance with strict regulatory standards. The workflow was designed using SAP GRC's MSMP Workflow and BRF+ for decision logic, focusing on automating approvals and risk assessments. Key decisions included defining role-based access controls, integrating risk analysis using ARA, and setting up automated notifications for approvers. The workflow was designed to minimize manual intervention, reducing processing time from days to hours. Business objections centered around the perceived rigidity of automated controls, fearing it might slow down urgent access requests. To address these concerns, we incorporated a fast-track approval path for critical roles, balancing compliance with operational needs. This approach maintained security standards while providing flexibility for urgent business requirements. The result was a more efficient, compliant access management process that satisfied both IT and business stakeholders.`
  }
];

// Same escalation-ladder logic as lib/engineeringMemory/questionGenerator.js section 4,
// applied directly to a freshly-extracted record rather than the coverage matrix (no records
// exist in the store yet for these to be compared against) -- same rules, just invoked per
// extracted record instead of per coverage cell.
function followUpsFor(record) {
  const followUps = [];
  if (!record.alternative_rejected) {
    followUps.push(`What made you choose that approach over the alternative(s) you mentioned? What specifically ruled the other one out?`);
  }
  if (!record.lesson_learned) {
    followUps.push(`Looking back, what would you tell someone about to make that same call?`);
  }
  if (!record.outcome) {
    followUps.push(`What actually happened as a result -- any numbers or concrete evidence of the outcome?`);
  }
  return followUps;
}

(async () => {
  const allResults = [];

  for (const { label, text } of ANSWERS) {
    console.log(`\n${"=".repeat(70)}\n${label}\n${"=".repeat(70)}`);
    const spans = await segmentTranscript(text, { chatJSON });
    console.log(`Segmented into ${spans.length} span(s).`);

    for (let i = 0; i < spans.length; i++) {
      const raw = await extractJudgmentRecordFromSpan(spans[i], { chatJSON });
      console.log(`\n--- span ${i + 1} extraction (raw, unedited) ---`);
      console.log(JSON.stringify(raw, null, 2));

      const followUps = followUpsFor(raw);
      console.log(`\nFollow-up questions this record's gaps would generate:`);
      if (followUps.length === 0) {
        console.log("  (none -- this record is complete)");
      } else {
        followUps.forEach(q => console.log(`  - ${q}`));
      }

      allResults.push({ label, span: spans[i], extracted: raw, followUps });
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "results", "first_real_acquisition_session.json"),
    JSON.stringify(allResults, null, 2),
    "utf-8"
  );
  console.log(`\n\nSaved to eval/results/first_real_acquisition_session.json -- NOT written to data/engineeringMemory.json yet.`);
})();
