/**
 * Lightweight intent & domain router — no admission maze, no safe-mode short-circuits.
 */

const DOMAIN_RULES = [
  { domain: "grc-ara", re: /\b(?:ARA|critical actions?|critical permissions?|SoD|ruleset|access risk)\b/i },
  { domain: "grc-msmp", re: /\bMSMP\b|\bBRF\+?\b/i },
  { domain: "grc-brm", re: /\bBRM\b|business role management/i },
  { domain: "grc-eam", re: /\bEAM\b|firefighter/i },
  { domain: "pfcg-security", re: /\bPFCG\b|\bSU24\b|\bSU25\b|\bSU01\b|authorization object|derived role/i },
  { domain: "usage-st03n", re: /\bST03N?\b|\bSTAD\b|t-?codes used|workload|usage (?:data|mining)/i },
  { domain: "bw-analysis-auth", re: /\banalysis authorizations?\b|\bRSECADMIN\b|\bBW\/?4\b/i },
  { domain: "idm", re: /\bSAP IDM\b|\bIdentity (?:Management|Center)\b|\bMX_PERSON\b/i },
  { domain: "ips", re: /\bIPS\b|identity provisioning|SCIM/i },
  { domain: "ias", re: /\bIAS\b|Identity Authentication|OIDC|SAML/i },
  { domain: "iag", re: /\bIAG\b|Identity Access Governance/i },
  { domain: "btp", re: /\bBTP\b|\bXSUAA\b|xs-security|role collections?/i },
  { domain: "s4hana", re: /\bS\/?4HANA\b|\bPublic Edition\b|\bPrivate Edition\b|Fiori catalog/i },
  { domain: "oauth", re: /\bOAuth\b|authorization code flow/i }
];

export function routeQuestion(question = "") {
  const q = String(question || "");
  let domain = "sap-security-general";
  for (const rule of DOMAIN_RULES) {
    if (rule.re.test(q)) {
      domain = rule.domain;
      break;
    }
  }

  let intent = "conceptual";
  if (/\b(?:how do you|how would you|configure|implement|export|troubleshoot|steps)\b/i.test(q)) intent = "how-to";
  if (/\b(?:difference|versus|\bvs\.?\b|compare)\b/i.test(q)) intent = "comparison";
  if (/\b(?:architecture|design|landscape)\b/i.test(q)) intent = "architecture";
  if (/\b(?:your role|you personally|your experience|describe your)\b/i.test(q)) intent = "experience";
  if (/\b(?:why do organizations|why would)\b/i.test(q)) intent = "rationale";

  return { domain, intent, question: q.trim() };
}
