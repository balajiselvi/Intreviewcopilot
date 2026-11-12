/**
 * Independently authored QuestionReference — centralized vs decentralized Firefighter / EAM.
 * Grounded on Q109-class EAM deploy knowledge; not paraphrased from a live candidate answer.
 */
module.exports = {
  id: "firefighter-central-decentral",
  question: "What is the difference between centralized and decentralized Firefighter ID in SAP GRC?",
  systemContext: {
    product: "SAP GRC Access Control — Emergency Access Management (EAM / Firefighter)",
    typicalRelease: "GRC AC with EAM (central vs decentral deployment options)",
    notes: "Comparison is about Firefighter ID / EAM component placement and failover — not GRC vs threat detection."
  },
  mandatoryRequirements: [
    {
      id: "central-hub",
      text: "Centralized EAM hosts Firefighter IDs/roles/config on the GRC hub; access launches to targets (commonly via RFC).",
      tags: ["mandatory", "architecture", "grounding"],
      matchAny: [/central(?:ized)?\s+eam/i, /GRC hub/i, /hosts Firefighter/i, /Firefighter IDs?.{0,40}GRC/i],
      evidenceNote: "Q109 / Deloitte USI gap-filler central EAM description."
    },
    {
      id: "decentral-local",
      text: "Decentralized EAM installs local EAM components on the target system.",
      tags: ["mandatory", "architecture", "grounding"],
      matchAny: [/decentral(?:ized)?\s+eam/i, /local EAM/i, /on (?:the )?target systems?/i],
      evidenceNote: "Q109 decentral EAM local components."
    },
    {
      id: "failover",
      text: "Explain the practical implication: decentral supports emergency access if central GRC/network is unavailable.",
      tags: ["mandatory", "architecture", "validation"],
      matchAny: [/unavailable|offline|outage|failover|network/i],
      evidenceNote: "Primary business reason for decentral as backup/failover."
    },
    {
      id: "log-governance",
      text: "Note log sync / controller review when connectivity returns (e.g. GRAC_SPM_LOG_SYNC theme).",
      tags: ["mandatory", "validation", "grounding"],
      matchAny: [/GRAC_SPM_LOG_SYNC/i, /log sync/i, /log review/i, /controller/i],
      evidenceNote: "Governance after decentral use still returns evidence to the hub."
    }
  ],
  optionalRequirements: [
    {
      id: "id-vs-role",
      text: "Optionally distinguish Firefighter ID vs Firefighter Role models if relevant.",
      tags: ["optional"],
      matchAny: [/Firefighter (?:ID|Role)/i, /ID-based|role-based/i],
      evidenceNote: "Useful depth; not required to answer central vs decentral deployment."
    }
  ],
  acceptableAlternatives: [
    "Saying 'central GRC system' instead of 'GRC hub' if the same hosting model is clear.",
    "Describing RFC/plugin connectivity without naming a specific RFC destination ID."
  ],
  criticalErrors: [
    {
      id: "grc-vs-detection",
      text: "Answer as GRC versus threat detection / vulnerability management instead of EAM deploy models.",
      matchAny: [
        /Threat detection asks what is happening/i,
        /Vulnerability management asks whether the system/i,
        /GRC asks who should have access and whether that access creates risk\. Threat detection/i
      ],
      severity: "critical"
    },
    {
      id: "s4-vs-bw",
      text: "Answer as S/4HANA PFCG versus BW Analysis Authorizations comparison.",
      matchAny: [/Analysis Authorizations/i, /RSECADMIN/i, /BW\/?4HANA is not the same model/i],
      severity: "critical"
    },
    {
      id: "ops-only-grac-spm",
      text: "Replace the architecture comparison with only day-to-day GRAC_SPM assignment clicks and no deploy model.",
      matchAny: [/support engineer sees the firefighter/i, /30 second interview answer/i],
      severity: "critical"
    }
  ],
  evidenceSources: [
    {
      type: "repo_knowledge",
      ref: "knowledge/grc/deloitte-usi-specific-gap-fillers.md#Q109",
      note: "Central vs decentralized Emergency Access Management decision/mechanism/governance/validation."
    },
    {
      type: "qualification",
      ref: "customer-landscape",
      note: "Exact plugin versions and whether both models coexist are landscape-specific."
    }
  ],
  unverifiableAreas: [
    "Customer-specific naming of Firefighter IDs, owners, and controllers.",
    "Whether a given landscape runs only central, only decentral, or dual with documented failover drills."
  ]
};
