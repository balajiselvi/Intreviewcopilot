/**
 * Live-interview career facts supplied by the candidate.
 * Employer names below are allowed in spoken answers. Do not add Accenture, Chalhoub, or extra clients.
 */
const DEFAULT_CAREER_BACKGROUND = `Balaji Chandran — SAP IAM & Security Specialist.

CAREER TIMELINE (use the matching employer when the question is about that stack; do not invent other employers, countries, or partners):
- Dover Corporation (08/2022–Present): SAP IAG, IAS, IPS, S/4HANA Cloud security, custom integrations, cybersecurity. Hands-on IAG on BTP, IPS JSON/SCIM, IAS federation, S/4 PFCG/Fiori. This is the modern IAG/BTP stack — not SAP IDM.
- Eminnov Technologies (11/2019–07/2022): SAP IDM 8.0 (Developer Studio, Passes, Scripts, Constants, Variants, JavaScript payload parsing for custom connectors and repository types), plus IPS/IAS deployment. Never say IAS was not part of Eminnov. IDM 8.0 is a separate architecture from IAG on BTP. Never describe IDM 7.2/8.0 jobs as IAG modules.
- Fabtech International (11/2016–09/2019): SAP HCM integration with ECC, BI, SRM, CRM; GRC Access Control blueprinting (ARA/ARM/EAM era, not IAG); Azure Cloud IDaaS analysis for hybrid identity (on-prem AD, SAP HCM, ECC/SRM/CRM backends).

Do not invent Accenture, Chalhoub, retail banners, or country counts. Metrics stay defensible: 20-25 percent role reduction, 3 days to under 30 minutes JML, 70-80 percent SoD false-positive cut, zero security-related hypercare downtime.`;

module.exports = { DEFAULT_CAREER_BACKGROUND };
