/**
 * Independently authored QuestionReference — MSMP configuration.
 * Not derived from a candidate-generated answer.
 */
module.exports = {
  id: "msmp-configuration",
  question: "How do you configure an MSMP workflow for access requests?",
  systemContext: {
    product: "SAP GRC Access Control",
    process: "SAP_GRAC_ACCESS_REQUEST",
    typicalRelease: "Access Control 12.0 / on-premise GRC (customer release must be confirmed)",
    notes: "MSMP is the multi-stage approval framework; BRF+ often supplies initiator/agent rules."
  },
  mandatoryRequirements: [
    {
      id: "entry-surface",
      text: "Name the MSMP administration entry (GRFNMW_CONFIGURE / Maintain MSMP Workflows).",
      tags: ["mandatory", "implementation", "grounding"],
      matchAny: [/GRFNMW_CONFIGURE/i, /Maintain MSMP Workflows/i],
      evidenceNote: "Standard Access Control MSMP maintenance transaction/cockpit."
    },
    {
      id: "process-scope",
      text: "Scope the configuration to the Access Request process (SAP_GRAC_ACCESS_REQUEST).",
      tags: ["mandatory", "implementation"],
      matchAny: [/SAP_GRAC_ACCESS_REQUEST/i, /Access Request process/i, /access request/i],
      evidenceNote: "MSMP is process-specific; Access Request is the common interview process."
    },
    {
      id: "stages-paths",
      text: "Describe stages/paths (or equivalent MSMP path structure) for approval routing.",
      tags: ["mandatory", "implementation", "sequence"],
      matchAny: [/\bstages?\b/i, /\bpaths?\b/i, /route mapping/i],
      evidenceNote: "MSMP path/stage model is core to Access Request workflow design."
    },
    {
      id: "rules-layer",
      text: "Distinguish or include initiator/agent (BRF+) rule attachment to MSMP.",
      tags: ["mandatory", "implementation", "sequence"],
      matchAny: [/BRF\+?/i, /initiator rule/i, /agent rule/i, /Maintain Rules/i],
      evidenceNote: "Agent/initiator determination is commonly BRF+ flat rules linked in MSMP."
    },
    {
      id: "version-generate",
      text: "Include MSMP version generation / activation before runtime use.",
      tags: ["mandatory", "sequence", "implementation"],
      matchAny: [/generat(?:e|ion|ing).{0,40}version/i, /MSMP version/i, /activate.{0,30}version/i],
      evidenceNote: "Unreleased MSMP versions do not drive runtime routing."
    },
    {
      id: "validation",
      text: "Validate with a test request and Instance Status (or equivalent path proof).",
      tags: ["mandatory", "validation"],
      matchAny: [/Instance Status/i, /test request/i, /submit.{0,40}request/i, /validate/i],
      evidenceNote: "Operational proof that the path and agents resolve as designed."
    }
  ],
  optionalRequirements: [
    {
      id: "escape-path",
      text: "Mention escape/exception path or no-approver handling.",
      tags: ["optional"],
      matchAny: [/escape/i, /no approver/i, /exception path/i],
      evidenceNote: "Useful operational depth; not always required for a short spoken answer."
    }
  ],
  acceptableAlternatives: [
    "Naming NWBC/Fiori GRC cockpit navigation instead of the GUI T-code, if the same Maintain MSMP Workflows app is identified.",
    "Focusing on initiator-rule-only change when the question is narrowly about path selection, while still naming MSMP version generation."
  ],
  criticalErrors: [
    {
      id: "confuse-iag-msmp",
      text: "Treat Cloud IAG Access Request rules as on-prem MSMP/GRFNMW configuration interchangeably.",
      matchAny: [
        /IAG.{0,60}GRFNMW_CONFIGURE/i,
        /configure MSMP.{0,40}IAG/i,
        /IAG.{0,40}Maintain MSMP Workflows/i
      ],
      severity: "critical"
    },
    {
      id: "invent-tcode",
      text: "Invent a non-existent MSMP transaction as the primary entry (e.g. GRFCP2).",
      matchAny: [/\bGRFCP2\b/i],
      severity: "critical"
    },
    {
      id: "authn-as-workflow",
      text: "Answer MSMP configuration as IAS authentication / SSO setup.",
      matchAny: [/configure MSMP.{0,80}(?:IAS|SAML|OIDC)/i, /MSMP.{0,40}Identity Authentication/i],
      severity: "critical"
    }
  ],
  evidenceSources: [
    {
      type: "repo_knowledge",
      ref: "knowledge/grc/brf-plus.md",
      note: "MSMP vs BRF+ plane; Define Workflow-Related MSMP Rules; GRFNMW_CONFIGURE linkage."
    },
    {
      type: "repo_workflow",
      ref: "lib/verifiedWorkflow.js#grc-msmp-access-request-config",
      note: "Verified spoken MSMP Access Request configuration backbone used by the product."
    },
    {
      type: "qualification",
      ref: "customer-release",
      note: "Exact Fiori app labels and result structures are release-sensitive; qualify when uncertain."
    }
  ],
  unverifiableAreas: [
    "Customer-specific stage names, custom initiator RULE_RESULT values, and exact NWBC role menus without landscape evidence.",
    "Whether a given customer uses BRF+ flat rules vs other agent determination methods for every stage."
  ]
};
