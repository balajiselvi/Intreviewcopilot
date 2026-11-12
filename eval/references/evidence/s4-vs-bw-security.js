/**
 * Independently authored QuestionReference — S/4HANA vs BW/4HANA security / role design.
 */
module.exports = {
  id: "s4-vs-bw-security",
  question: "What is the difference between S/4HANA and BW/4HANA role design?",
  systemContext: {
    products: ["S/4HANA (On-Premise / Private Edition contrast with Public Edition)", "BW/4HANA"],
    notes: "Transactional/PFCG object-org model versus Analysis Authorizations for query row filtering."
  },
  mandatoryRequirements: [
    {
      id: "s4-pfcg",
      text: "S/4 (On-Prem/Private) role design centers on PFCG (transactions, authorization objects, org fields).",
      tags: ["mandatory", "architecture", "implementation", "grounding"],
      matchAny: [/\bPFCG\b/i, /authorization objects?/i],
      evidenceNote: "S/4 ABAP security backbone for classic/private landscapes."
    },
    {
      id: "bw-analysis-auth",
      text: "BW/4HANA uses Analysis Authorizations (RSECADMIN) on authorization-relevant characteristics for data filtering.",
      tags: ["mandatory", "architecture", "implementation", "grounding"],
      matchAny: [/Analysis Authorizations?/i, /\bRSECADMIN\b/i],
      evidenceNote: "BW row/characteristic security is not the same as S/4 execute objects."
    },
    {
      id: "plane-distinction",
      text: "State that PFCG/S_RS_* start rights are not a substitute for Analysis Authorization value filters.",
      tags: ["mandatory", "architecture"],
      matchAny: [/S_RS_/i, /not (?:the )?same model/i, /never inject|not a substitute|row-level|characteristic/i],
      evidenceNote: "Core trap: confusing query-start authority with data-slice filters."
    }
  ],
  optionalRequirements: [
    {
      id: "public-edition-contrast",
      text: "Optionally contrast S/4 Public Edition business roles / restrictions as a different surface.",
      tags: ["optional", "version"],
      matchAny: [/Public (?:Edition|Cloud)/i, /business roles?/i, /Maintain Business Roles/i],
      evidenceNote: "Version/edition accuracy when Public Edition is in scope."
    },
    {
      id: "su24-su25",
      text: "Optionally mention SU24/SU25 discipline for S/4 upgrades.",
      tags: ["optional", "version", "validation"],
      matchAny: [/\bSU24\b/i, /\bSU25\b/i],
      evidenceNote: "Useful for upgrade-oriented follow-ups."
    }
  ],
  acceptableAlternatives: [
    "Focusing on BW Analysis Authorizations vs S/4 PFCG without enumerating AGR_* tables.",
    "Naming authorization-relevant InfoObjects instead of a specific characteristic example."
  ],
  criticalErrors: [
    {
      id: "bw-is-pfcg-only",
      text: "Claim BW data authorization is solved only with ordinary PFCG transactional roles.",
      matchAny: [
        /BW.{0,40}(?:only|just) PFCG/i,
        /Analysis Authorizations?.{0,30}(?:not needed|unnecessary)/i
      ],
      severity: "critical"
    },
    {
      id: "firefighter-hijack",
      text: "Answer an S/4 vs BW role-design question as Firefighter central/decentral EAM.",
      matchAny: [/central(?:ized)?\s+eam|decentral(?:ized)?\s+Firefighter/i],
      severity: "critical"
    }
  ],
  evidenceSources: [
    {
      type: "repo_workflow",
      ref: "lib/verifiedWorkflow.js#s4-vs-bw-role-design",
      note: "Verified workflow contrast for S/4 PFCG vs BW Analysis Authorizations."
    },
    {
      type: "qualification",
      ref: "edition",
      note: "Public Edition IAM apps must not be forced onto On-Prem/Private answers."
    }
  ],
  unverifiableAreas: [
    "Customer-specific authorization-relevant characteristic lists and query naming conventions."
  ]
};
