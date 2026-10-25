# SAP CRM, Sales, Service & Customer Experience Security Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** Classic **SAP CRM** (ABAP) uses PFCG/org models; **Sales Cloud / Service Cloud** use cloud role/permission models with IAS; **Commerce Cloud** has its own Backoffice/user groups. Customer personal data elevates privacy controls. Not interchangeable with S/4 OTC alone—though processes integrate.

**Anti-surface rule:** Prefer business-partner auth, territory/org restrictions, cloud role catalogs, and API user scopes over “CRM roles.”

## Q1: How do you authorize classic SAP CRM business-partner and organizational access?

- **Decision:** Restrict BP display/change by sales org/service org and BP role categories; separate marketing/sales/service personas.
- **Mechanism:** PFCG roles with CRM authorization objects (e.g., partner, transaction types—release-specific); organizational model assignments; UI profiles. Align with underlying ERP customer auth if hub scenario.
- **Governance:** Who changes BP bank/tax data classified sensitive. Cross-org BP access attested.
- **Validation:** User sees BP in org only; change denied for foreign org; `STAUTHTRACE` evidences.

## Q2: How do you secure Sales Cloud / Service Cloud roles with IAS?

- **Decision:** Cloud CX roles/permissions assign capabilities; IAS authenticates; IPS provisions users/groups—PFCG thinking does not apply.
- **Mechanism:** Maintain business roles in Sales/Service Cloud; map to IAS groups; configure SSO; restrict admin vs sales rep vs service agent. Territory management constraints where licensed.
- **Governance:** Admin role certified quarterly. API users separated from interactive agents.
- **Validation:** Rep without role cannot open work center; SSO alone insufficient; territory deny proven.

## Q3: How do you protect customer-data confidentiality (PII) across CX and ERP?

- **Decision:** Need-to-know field access + logging + export control; GDPR lawful basis is business-owned—security implements technical enforcement.
- **Mechanism:** Field-level auth / business roles; mask sensitive fields where product supports; restrict mass export; Integration users least data scope; retention via ILM/policies as designed.
- **Governance:** DPIA for new interfaces. Breach runbook includes CX systems.
- **Validation:** Agent without clearance cannot view restricted fields; export blocked; interface payload scoped.

## Q4: How do you design Sales-process SoD (quote/order/discount vs approve)?

- **Decision:** Create quote/order ≠ approve discount/credit; enforce in CRM/Sales Cloud workflows and in S/4 if documents post there.
- **Mechanism:** Separate roles; approval workflows; GRC functions for CRM/S/4 TCodes/apps; mitigate only with owner.
- **Governance:** High-discount approval thresholds documented. Temporary combined access Firefighter-only.
- **Validation:** Single user blocked on approve; dual path works; risk simulation flags combo.

## Q5: How do you secure Commerce Cloud Backoffice and storefront identities?

- **Decision:** Backoffice employee groups ≠ customer storefront accounts; integrate employee SSO via IAS; customers via CIAM patterns per program.
- **Mechanism:** Backoffice user groups/permissions; restrict impex/groovy to admins; storefront B2B roles separate; secrets for OCC APIs vaulted.
- **Governance:** Production Groovy/Impex privileges break-glass. Partner agency access time-bound.
- **Validation:** Merchandiser cannot run admin scripts; API token scoped; customer cannot access Backoffice.

## Q6: How do you govern API and integration users for CX ↔ S/4 / marketing?

- **Decision:** Dedicated integration clients per flow (BP replication, order, ticket)—no shared human service account.
- **Mechanism:** OAuth clients / technical users; least scopes; CPI iFlows; monitor failures; rotate secrets.
- **Governance:** CMDB ownership; PII interface inventory.
- **Validation:** Call succeeds; excess scope denied; rotation reconnect; human password absent.

## Q7: How do you provision joiners/leavers for sales/service agents?

- **Decision:** HR job → IPS → IAS + CX roles + S/4 OTC roles as needed; leaver removes CX and ERP in one SLA.
- **Mechanism:** JobCode maps to CX business role + ERP composite; terminate disables IAS and targets; mover updates territory/org.
- **Governance:** Same-day leaver for agents with customer PII access. Certification of sales managers.
- **Validation:** Joiner gets both planes; leaver blocked SSO and API; mover territory updates.

## Q8: How do you troubleshoot “agent logs in but cannot see account / ticket”?

- **Decision:** Distinguish SSO identity, role missing, territory/org restriction, and data ownership/assignment rules.
- **Mechanism:** Check IAS subject; CX role assignment; territory; account team; integration lag for BP replication.
- **Governance:** No global “view all accounts” grants for convenience.
- **Validation:** Fix at correct layer; control agent still denied; ticket evidence screenshots.

## Q9: How do you align CX security with clean-core S/4 transformations?

- **Decision:** Prefer standard replication and released APIs; custom CX extensions get their own authz review; avoid duplicating master maintenance outside MDG/S/4 when clean-core mandates.
- **Mechanism:** Document system of record for customer master; authorize maintenance only there; CX consumes.
- **Governance:** Extension ADR with security sign-off.
- **Validation:** Master change in SoR reflects in CX; unauthorized CX master edit blocked if policy requires.

## Q10: What audit evidence is required for CX security?

- **Decision:** Role matrices, admin rosters, PII interface list, SoD tests, leaver samples, and API client inventory.
- **Mechanism:** Exports from CX admin + IAS + GRC; sample deny tests; DPIA references.
- **Governance:** Deploy gate for new CX module includes PII and SoD checks.
- **Validation:** Walkthrough agent least privilege; admin separation; leaver; API scope deny.
