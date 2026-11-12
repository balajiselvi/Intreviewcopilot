/**
 * Independently authored QuestionReference — IAS vs IPS plane separation.
 */
module.exports = {
  id: "ias-vs-ips",
  question: "What is the difference between IAS and IPS?",
  systemContext: {
    product: "SAP Cloud Identity Services",
    components: ["Identity Authentication (IAS)", "Identity Provisioning (IPS)"],
    notes: "Authentication/federation plane versus provisioning/synchronization plane."
  },
  mandatoryRequirements: [
    {
      id: "ias-authn",
      text: "IAS authenticates (IdP / proxy IdP) — SSO protocols such as SAML 2.0 or OIDC, often MFA.",
      tags: ["mandatory", "architecture", "grounding"],
      matchAny: [/Identity Authentication|\bIAS\b/i, /authenticat/i, /SAML|OIDC|OpenID/i],
      evidenceNote: "IAS plane: authentication and session/token issuance."
    },
    {
      id: "ips-provision",
      text: "IPS provisions/synchronizes identities (read source → transform → write targets).",
      tags: ["mandatory", "architecture", "grounding", "sequence"],
      matchAny: [/Identity Provisioning|\bIPS\b/i, /provision/i, /synchron/i],
      evidenceNote: "IPS plane: lifecycle sync, not login."
    },
    {
      id: "plane-split",
      text: "State the complementarity without collapsing planes (sign-in vs account lifecycle).",
      tags: ["mandatory", "architecture"],
      matchAny: [/complement|distinct|not (?:the )?dedicated|sign in|accounts? and attributes/i],
      evidenceNote: "Core interview trap: IAS≠IPS."
    }
  ],
  optionalRequirements: [
    {
      id: "scim",
      text: "Mention SCIM or transformation jobs as IPS mechanisms.",
      tags: ["optional", "implementation"],
      matchAny: [/\bSCIM\b/i, /transformation/i],
      evidenceNote: "Implementation depth when asked how IPS moves data."
    }
  ],
  acceptableAlternatives: [
    "Emphasizing proxy IdP vs pure IdP modes for IAS without listing every protocol.",
    "Describing IPS source/target examples without naming a specific customer connector."
  ],
  criticalErrors: [
    {
      id: "ias-provisions",
      text: "Claim IAS is the cross-system provisioning engine / runs SoD.",
      matchAny: [
        /\bIAS\b.{0,60}(?:provisions?|provisioning engine)/i,
        /\bIAS\b.{0,40}\bSoD\b/i
      ],
      severity: "critical"
    },
    {
      id: "ips-authenticates",
      text: "Claim IPS authenticates users / issues SSO tokens as its primary role.",
      matchAny: [/\bIPS\b.{0,50}(?:authenticates?|SSO tokens?|IdP for SAML)/i],
      severity: "critical"
    },
    {
      id: "collapse-iag",
      text: "Collapse the answer into IAG governance or Cloud Connector as if they were IAS/IPS.",
      matchAny: [/difference between IAS and IPS.{0,80}\bIAG\b/i, /\bIAS\b.{0,30}\bIPS\b.{0,40}Cloud Connector is the identity provider/i],
      severity: "critical"
    }
  ],
  evidenceSources: [
    {
      type: "repo_prepared_script",
      ref: "eval/lib/expectedAnswers.js#ias-ips",
      note: "Prepared plane-correct comparison used as product baseline text (reference criteria remain independent)."
    },
    {
      type: "repo_knowledge",
      ref: "knowledge/btp/ (IAS/IPS materials)",
      note: "Cloud Identity Services separation of authentication vs provisioning."
    }
  ],
  unverifiableAreas: [
    "Customer-specific IAS tenant topology (IdP vs proxy) and exact IPS job graphs without landscape evidence."
  ]
};
