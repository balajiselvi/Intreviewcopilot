const assert = require("assert");
const { recallExperience } = require("./lib/expertiseCards");

const CASES = [
  ["Q1 redesign", "Walk us through how you approached role redesign during your S/4HANA migration.", "rationalize-ecc-s4"],
  ["Q2 dump", "How do you handle Fiori authorization errors when a user gets an access dump or blank tile?", "fiori-auth-dump"],
  ["Q3 clean core", "How do you maintain a Clean Core and avoid security role bloat long-term?", "clean-core-su24"],
  ["Q4 JML", "How do you integrate SuccessFactors with SAP Cloud Identity Services to automate Joiners, Movers, and Leavers?", "iag-ias-ips-sf"],
  ["Q5 overlap", "How do IAS, IPS, and IAG work together? Don't their features overlap?", "identity-planes"],
  ["Q6 Joule", "Have you worked with Joule in SAP IAG or RISE environments?", "joule"],
  ["Q7 SoD FP", "How do you reduce high false-positive rates in IAG or GRC SoD risk analysis?", "sod-audit"],
  ["Q8 residual", "What do you do when an SoD conflict is business-critical and cannot be removed?", "mitigating-controls"],
  ["Q9 FF", "How do you manage Privileged Access Management (PAM / Firefighter) in production?", "firefighter-pam"],
  ["Q10 IPS", "Describe a complex technical troubleshooting issue you solved during hypercare.", "ips-sync-hypercare"],
  ["Q11 data", "How do you ensure data quality when managing thousands of user roles across parallel workstreams?", "data-quality"],
  ["Q12 federation", "How did you set up IAS federation with Azure AD or Okta?", "ias-federation"],
  ["Q13 IDM", "Walk me through SAP IDM 8.0 Developer Studio jobs versus IPS.", "idm80-eminov"],
  ["Q14 Azure IDaaS", "What did you do with Azure Cloud IDaaS and HCM integration at Fabtech?", "azure-idaas-fabtech"],
  ["Q15 provision S4", "How did you handle user identity provisioning during your S/4HANA cloud migration?", "iag-ias-ips-sf"],
  ["Q16 SAC", "Tell me about your SAP Analytics Cloud security experience.", "sac-security"],
  ["Q17 DSP", "Tell me about your SAP Datasphere security experience.", "datasphere-security"],
  ["Q18 Ariba", "What is your SAP Ariba security and JML experience?", "ariba-iam"],
  ["Q19 CAR", "Tell me about your SAP CAR security experience.", "car-blueprint"],
  ["Q20 five", "How do S/4, SuccessFactors, IAG, IAS, IPS and SAC work together?", "five-tier"],
  ["Q21 mover", "What happens if a user changes from Finance to Retail?", "mover-cross-app"],
  ["Q22 IAS trap", "Can IAS authorize access to SAC, Datasphere and Ariba?", "ias-not-authz"],
  ["Q23 IPS trap", "Can IPS assign the business roles?", "ips-not-gov"],
  ["Q24 explosion", "How do you prevent role explosion across these applications?", "five-tier"]
];

for (const [name, q, expected] of CASES) {
  const { strongest } = recallExperience(q);
  assert.ok(strongest, name + " missed all cards");
  assert.strictEqual(strongest.id, expected, name + " got " + (strongest && strongest.id));
}

console.log("masterQaRecall: PASS");
