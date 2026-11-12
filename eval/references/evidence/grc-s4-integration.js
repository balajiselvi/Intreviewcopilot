/**
 * Independently authored QuestionReference — GRC Access Control integration with S/4HANA.
 * Distinct from a generic "what is GRC" overview.
 */
module.exports = {
  id: "grc-s4-integration",
  question: "Explain how SAP GRC integrates with S/4HANA?",
  systemContext: {
    products: ["SAP GRC Access Control", "SAP S/4HANA"],
    notes: "Integration architecture: connectors, repository sync, risk analysis against S/4 roles/users, provisioning/Firefighter paths — not an ARA/ARM/EAM/BRM product brochure alone."
  },
  mandatoryRequirements: [
    {
      id: "connector-plane",
      text: "Describe technical connectivity from GRC to S/4 (connector / plugin / RFC-style integration).",
      tags: ["mandatory", "architecture", "implementation", "grounding"],
      matchAny: [/connector/i, /\bRFC\b/i, /plugin/i, /repository sync/i],
      evidenceNote: "GRC AC integrates to ABAP targets through configured connectors and sync."
    },
    {
      id: "governance-over-s4",
      text: "Explain GRC as governance over S/4 access (risk/request/emergency) while S/4 still enforces authorizations.",
      tags: ["mandatory", "architecture"],
      matchAny: [/enforc/i, /PFCG|authorizations?/i, /S\/?4/i],
      evidenceNote: "Plane split: GRC governs; S/4 enforces."
    },
    {
      id: "capability-to-integration",
      text: "Tie at least one AC capability to the S/4 integration path (ARA analysis, ARM provisioning, or EAM sessions).",
      tags: ["mandatory", "implementation"],
      matchAny: [/\bARA\b|Access Risk Analysis|SoD/i, /\bARM\b|Access Request|provision/i, /\bEAM\b|Firefighter/i],
      evidenceNote: "Integration is how those capabilities operate on S/4 users/roles."
    },
    {
      id: "sync-or-prov",
      text: "Mention repository sync and/or provisioning back to S/4 user/role assignments.",
      tags: ["mandatory", "sequence", "implementation"],
      matchAny: [/repository sync/i, /provision/i, /user.?role|role assignment/i, /SU01|PFCG/i],
      evidenceNote: "Without sync/provisioning, GRC cannot stay aligned with S/4."
    }
  ],
  optionalRequirements: [
    {
      id: "iag-contrast",
      text: "Optionally contrast on-prem GRC AC vs Cloud IAG for S/4 cloud editions.",
      tags: ["optional", "version"],
      matchAny: [/\bIAG\b/i, /Public Edition/i, /Cloud IAG/i],
      evidenceNote: "Edition-sensitive; only when the question implies cloud."
    }
  ],
  acceptableAlternatives: [
    "Leading with connector + repository sync + risk analysis + access request provisioning without listing all four AC modules.",
    "Naming plugin installation on S/4 without a specific SP level when unknown."
  ],
  criticalErrors: [
    {
      id: "what-is-grc-overview-only",
      text: "Serve only the generic Access Control overview opener without integration mechanics.",
      matchAny: [
        /^I explain SAP GRC Access Control as the governance layer over SAP access\./i
      ],
      severity: "critical"
    },
    {
      id: "grc-replaces-pfcg",
      text: "Claim GRC replaces S/4 PFCG authorization enforcement.",
      matchAny: [
        /GRC replaces PFCG/i,
        /S\/?4 does not (?:need|use) (?:PFCG|authorization objects)/i
      ],
      severity: "critical"
    },
    {
      id: "ias-as-grc-integration",
      text: "Answer GRC↔S/4 integration as IAS-only federation.",
      matchAny: [
        /GRC integrates with S\/?4.{0,60}\bIAS\b.{0,40}(?:only|sole)/i,
        /explain how SAP GRC integrates.{0,40}Identity Authentication/i
      ],
      severity: "critical"
    }
  ],
  evidenceSources: [
    {
      type: "repo_knowledge",
      ref: "knowledge/grc/ (Access Control connector / EAM / ARM materials)",
      note: "GRC AC target-system integration patterns for ABAP/S/4."
    },
    {
      type: "qualification",
      ref: "landscape",
      note: "Exact connector types, plugin versions, and hybrid IAG bridge setups are customer-specific."
    }
  ],
  unverifiableAreas: [
    "Customer connector group design, exact sync job schedules, and whether Firefighter is central or decentral in that landscape."
  ]
};
