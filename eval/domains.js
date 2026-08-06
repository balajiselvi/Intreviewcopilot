// Tier-1 SAP Security/GRC domain coverage for the evaluation pipeline.
// One realistic, interviewer-phrased question per domain.
const DOMAINS = [
  { domain: "SAP Security", question: "How do you approach designing a role-based authorization concept for a large SAP landscape from scratch?" },
  { domain: "SAP GRC", question: "Walk me through how Access Risk Analysis and Access Risk Management work together in SAP GRC." },
  { domain: "SAP IDM", question: "How would you design an identity provisioning workflow for a new SAP landscape, including joiner-mover-leaver processes?" },
  { domain: "SAP IAG", question: "What's different about managing access risk in SAP Identity Access Governance compared to on-premise GRC?" },
  { domain: "SAP BTP Security", question: "How do you secure the Cloud Connector and manage trust between BTP subaccounts and on-premise systems?" },
  { domain: "IAS", question: "How does SAP Identity Authentication Service handle authentication for a hybrid landscape with both cloud and on-premise applications?" },
  { domain: "IPS", question: "Walk me through how Identity Provisioning Service synchronizes user data across multiple SAP cloud applications." },
  { domain: "Fiori", question: "How do you approach security for a Fiori launchpad deployment, including tile-level authorization?" },
  { domain: "HANA", question: "How do you design database-level authorization in SAP HANA, including analytic privileges?" },
  { domain: "BW", question: "How do you secure sensitive data at the query and InfoProvider level in SAP BW/4HANA?" },
  { domain: "SAC", question: "How do you approach role and team-based security design in SAP Analytics Cloud?" },
  { domain: "S/4HANA Migration", question: "What security changes should we plan for when migrating from ECC to S/4HANA?" },
  { domain: "Audit", question: "How do you prepare an SAP system for a SOX 404 audit from an authorization perspective?" },
  { domain: "Emergency Access", question: "How do you design and govern an Emergency Access Management (firefighter) process in SAP GRC?" },
  { domain: "Production Support", question: "Walk me through how you'd diagnose and resolve an urgent user access issue in a production SAP system." },
  { domain: "Rollout", question: "How does your security approach change when rolling out a template SAP solution to a new country or business unit?" },
  { domain: "Upgrade", question: "What security-related risks do you assess before and after a major SAP system upgrade?" },
  { domain: "Cloud Security", question: "How do you approach securing SAP cloud services that sit outside the traditional on-premise perimeter?" },
  { domain: "Identity Federation", question: "How do you design identity federation between SAP and external identity providers for a multi-cloud organization?" }
];

module.exports = { DOMAINS };
