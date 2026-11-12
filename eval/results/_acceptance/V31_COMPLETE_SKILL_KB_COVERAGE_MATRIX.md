# V3.1 Complete Skill ↔ KB Coverage Matrix

**Inventory source (verified read):** `c:\Users\balaj\OneDrive\Desktop\Core SAP Security & Authorizatio.txt`  
**KB root:** `D:\My Projects\InterviewCopilot\knowledge\` (~166 markdown files enumerated)  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Rule:** Keyword presence ≠ `Complete`. Coverage requires enough accurate technical depth to support a strong interview answer.  
**Application/KB freeze:** Read-only audit — no KB writes.

### Column definitions

| Column | Meaning |
|---|---|
| Source Quality | Verified = deep accurate content inspected; Partial = useful but thin/uneven; Unverified = not deep-read this pass / stub |
| Coverage | Complete / Partial / Missing relative to inventory subtopic |
| Retrieval Readiness | Ready / Fragile / Not ready (empty file, wrong product plane, or too thin to retrieve useful grounding) |

---

## Coverage matrix

| Domain | Subtopic | Inventory Evidence | KB Document | Source Quality (Verified/Partial/Unverified) | Coverage (Complete/Partial/Missing) | Retrieval Readiness | Gap (Exact Missing Knowledge) | Priority (High/Medium/Low) |
|---|---|---|---|---|---|---|---|---|
| Core SAP Security & Authorizations | ECC/S/4 authorization concepts | Inventory §1 foundation | `knowledge/security/sap-security.md`, `core-sap-security-authorizations-architect-bank.md` | Verified | Complete | Ready | Public Edition IAM-app model still thinner than Private/on-prem PFCG | High |
| Core SAP Security & Authorizations | User admin SU01 / types / locks / groups | Inventory §1 | `knowledge/security/user-administration.md` | Verified | Complete | Ready | Mass SU10 edge cases / reference-user patterns lightly covered | High |
| Core SAP Security & Authorizations | PFCG single/composite/derived/master | Inventory §1 | `knowledge/security/pfcg.md`, `composite-roles.md`, `derived-roles.md`, architect bank | Verified | Complete | Ready | Cross-system role compare tooling depth | High |
| Core SAP Security & Authorizations | Auth objects / fields / org levels | Inventory §1 | `knowledge/security/authorization-objects.md`, role-design.md | Verified | Complete | Ready | Industry-specific object catalogs not exhaustive | High |
| Core SAP Security & Authorizations | SU24 proposals | Inventory §1 | `knowledge/security/su24.md`, architect bank Q3 | Verified | Complete | Ready | Fiori/OData proposal maintenance examples could deepen | High |
| Core SAP Security & Authorizations | SU25 upgrade | Inventory §1 | `knowledge/security/su25.md`, architect bank Q3 | Verified | Complete | Ready | Step 2a/2b/2c worked examples with USOBT_C evidence | High |
| Core SAP Security & Authorizations | SU53 / STAUTHTRACE / ST01 / SUIM troubleshooting | Inventory §1 | `knowledge/troubleshooting/authorization-errors.md`, architect bank Q4 | Partial | Partial | Fragile | ST01 legacy vs STAUTHTRACE decision tree; Fiori dual-stack trace cookbook | High |
| Core SAP Security & Authorizations | Profiles / generate / user comparison | Inventory §1 | `pfcg.md`, architect bank | Verified | Complete | Ready | PFUD / RHAUTUPD_NEW scheduling specifics | Medium |
| Core SAP Security & Authorizations | Critical txns / privileged access | Inventory §1 | architect bank Q5; GRC EAM crossover | Verified | Partial | Ready | Consolidated critical-object catalog with ACTVT patterns | High |
| Core SAP Security & Authorizations | RFC / communication / technical users | Inventory §1 | architect bank Q6; integration bank | Verified | Partial | Ready | Trusted-RFC SMT1/SMT2 failure modes cookbook | High |
| Core SAP Security & Authorizations | Least privilege / naming / redesign / remediation | Inventory §1 | `role-design.md`, `role-rationalization.md`, architect bank Q7 | Verified | Partial | Ready | Data-quality anomaly→remediation playbooks | High |
| Core SAP Security & Authorizations | Transport of roles/security | Inventory §1 | `knowledge/transports/transport-management.md`; `chaRM.md` **0 bytes**; `release-process.md` **0 bytes** | Partial | Partial | Fragile | ChaRM/security transport coupling empty; CTS role+profile sequence | High |
| Core SAP Security & Authorizations | Access testing / prod support defects | Inventory §1 | architect bank Q8–Q9; hypercare bank | Partial | Partial | Fragile | Negative-test evidence templates | High |
| Core SAP Security & Authorizations | ST03N/STAD usage mining (export used T-codes) | Interview high-frequency; rationalization docs | `role-rationalization.md`, deloitte gap-filler Q110; **no dedicated ST03N procedure module** | Partial | Partial | Fragile | Exact ST03N navigation/export steps; assignment≠usage spoken contract as first-class KB | High |
| Core SAP Security & Authorizations | Security Audit Log SM19/SM20/SM18 | Architect bank Q11–Q12 | `core-sap-security-authorizations-architect-bank.md` | Verified | Complete | Ready | Release-specific RSAU_* matrix per Basis version | Medium |
| GRC Access Control | ARA rulesets / SoD / critical actions & permissions | Inventory §2 | `knowledge/grc/ara.md`, `risk-analysis.md`, `rulesets.md`, principal bank | Verified | Complete | Ready | Ruleset false-positive remediation patterns by LOB | High |
| GRC Access Control | ARM requests / provisioning / troubleshooting | Inventory §2 | `knowledge/grc/arm.md` | Verified | Complete | Ready | Request-type customizing deep dives | High |
| GRC Access Control | MSMP stages/paths/agents/escalation | Inventory §2 | `knowledge/grc/msmp.md` (Multi-Stage Multi-Path verified) | Verified | Complete | Ready | Path condition BRF+ examples | High |
| GRC Access Control | BRF+ agent determination | Inventory §2 | `knowledge/grc/brf-plus.md` | Verified | Complete | Ready | Transport/versioning of BRF+ apps | Medium |
| GRC Access Control | BRM business roles / lifecycle / owners | Inventory §2 | `knowledge/grc/brm.md` | Verified | Complete | Ready | BRM↔PFCG sync failure taxonomy | High |
| GRC Access Control | EAM / Firefighter | Inventory §2 | `knowledge/grc/eam.md`, `firefighter.md` | Verified | Complete | Ready | Log sync job failure runbook | High |
| GRC Access Control | UAR / certification | Inventory §2 | `knowledge/grc/` + compliance/audit | Partial | Partial | Fragile | Campaign configuration step-depth | Medium |
| GRC Access Control | Mitigating controls / owners | Inventory §2 | `knowledge/grc/mitigation.md` | Verified | Partial | Ready | Control effectiveness testing evidence | High |
| GRC Access Control | Connectors / repository sync | Inventory §2 | `connectors.md`, `repository-sync.md`, `user-sync.md`, `authorization-sync.md` | Verified | Complete | Ready | Version-specific connector prerequisites matrix | Medium |
| GRC Access Control | Jobs / transports / upgrades / prod support | Inventory §2 | grc-overview, scenarios banks | Partial | Partial | Ready | GRC 10→12 upgrade security checklist depth | Medium |
| GRC Access Control | HA / performance / audit architecture | Inventory §2 | principal bank / overview | Partial | Partial | Fragile | Sizing/perf interview depth | Low |
| SAP IAG | Access Analysis Service | Inventory §3.1 | `knowledge/iag/iag-access-analysis.md`, architect bank | Verified | Partial | Ready | Investigation→remediation end-to-end evidence pack | High |
| SAP IAG | Access Request Service | Inventory §3.2 | `iag-access-request.md` | Verified | Partial | Ready | Risk simulation + provisioning integration failures | High |
| SAP IAG | Certification Review Service | Inventory §3.3 | architect bank + overview | Partial | Partial | Fragile | Campaign reviewer UX + remediation loops | High |
| SAP IAG | Role Design Service | Inventory §3.4 | `iag-rules-and-roles.md` + architect bank | Partial | Partial | Fragile | Optimization algorithms vs BRM bridge semantics | Medium |
| SAP IAG | Privileged Access Management | Inventory §3.5 | `knowledge/iag/iag-pam.md` | Verified | Complete | Ready | Public Cloud vs on-prem launch-pad differences already noted; expand failure modes | High |
| SAP IAG | Architecture / tenant / services | Inventory §3.6 | `iag-overview.md`, `iag-implementation.md`, architect bank | Verified | Partial | Ready | Tenant setup checklist with SCI jobs | High |
| SAP IAG | S/4 & on-prem integration | Inventory §3.7 | overview/implementation | Partial | Partial | Fragile | Supported system matrix + connector errors | High |
| SAP IAG | IAG Bridge / GRC AC coexistence | Inventory §3.8 | architect bank (partial) | Partial | Partial | Fragile | Explicit Bridge scenario playbooks | High |
| SAP IAG | Identity/role sync troubleshooting | Inventory §3.9 | implementation notes | Partial | Partial | Fragile | Job History failure catalog | High |
| SAP IAG | Migration / operating model interviews | Inventory §3.10 | implementation | Partial | Partial | Fragile | GRC→IAG migration decision trees | High |
| SAP IDM | IDM 7.2/8.0 architecture | Inventory §4 | `sap-idm-identity-management-architect-bank.md`, `idm-architecture.md`, `idm-overview.md` | Verified | Partial | Fragile | LIVE answers currently drift to IPS; deepen Identity Center/runtime evidence | High |
| SAP IDM | Identity Center / Studio / Runtime | Inventory §4 | architect bank | Verified | Partial | Ready | Dispatcher monitoring / package transport | High |
| SAP IDM | Repositories / entry types / attributes | Inventory §4 | architect bank Q1 | Verified | Partial | Ready | Attribute dictionary examples | High |
| SAP IDM | Provisioning framework / connectors | Inventory §4 | `idm-provisioning.md`, architect bank Q3 | Partial | Partial | Fragile | REST/SOAP/JS connector worked examples | High |
| SAP IDM | Jobs / tasks / event tasks / workflows | Inventory §4 | architect bank Q2 | Verified | Partial | Ready | Ordered job-chain patterns for JML | High |
| SAP IDM | LDAP/AD / VDS | Inventory §4 | architect bank Q4 | Partial | Partial | Fragile | OU placement / group SoD controls | Medium |
| SAP IDM | JML / rehire / orphans | Inventory §4 | architect bank; `successfactors-iam.md` | Partial | Partial | Fragile | Orphan reconcile runbooks | High |
| SAP IDM | SF/HR-driven provisioning | Inventory §4 | `idm/successfactors-iam.md` | Partial | Partial | Fragile | EC→IDM attribute contracts | Medium |
| SAP IDM | Migration to IPS/IAG/SailPoint | Inventory §4 | architect bank boundaries | Partial | Partial | Fragile | Cutover comparative architecture | Medium |
| IAS / IPS | IAS authN / SSO / IdP / MFA | Inventory §5 | `knowledge/btp/ias.md`, `ias-ips-cloud-identity-services-architect-bank.md` | Verified | Complete | Ready | Conditional auth / risk-based MFA depth | High |
| IAS / IPS | IPS sync / transformations | Inventory §5 | `knowledge/btp/ips.md`, architect bank | Verified | Complete | Ready | Proxy-system edge cases | High |
| IAS / IPS | Source/target/proxy connectors | Inventory §5 | ips.md | Verified | Partial | Ready | Full connector capability matrix | Medium |
| IAS / IPS | SAML / OAuth / OIDC / SCIM | Inventory §5 | `knowledge/cloud/saml.md`, `oauth.md`, ias/ips | Verified | Partial | Ready | OIDC claim→role collection mapping cookbook | High |
| IAS / IPS | Federation / corporate IdP trust | Inventory §5 | `cloud/identity-federation.md`, ias.md | Partial | Partial | Fragile | Multi-IdP routing pitfalls | High |
| IAS / IPS | Certs / secrets / connection troubleshooting | Inventory §5 | ias/ips troubleshooting sections | Partial | Partial | Fragile | Certificate expiry incident playbook | Medium |
| BTP Security | Global/directory/subaccount model | Inventory §6 | `btp-overview.md`, `btp-security.md`, architect bank | Verified | Partial | Ready | Entitlement/quota security implications | Medium |
| BTP Security | Role templates / collections / mappings | Inventory §6 | btp-security-architect-bank, btp-security.md | Verified | Complete | Ready | Group mapping failure diagnostics | High |
| BTP Security | XSUAA / xs-security.json / scopes | Inventory §6 | architect bank | Verified | Complete | Ready | Multi-approuter patterns | High |
| BTP Security | CF app identities / destinations / OAuth | Inventory §6 | cloud-connector.md, destinations in banks | Verified | Partial | Ready | Principal propagation deep failure modes (partially in deepdive) | High |
| BTP Security | Build / Work Zone access | Inventory §6 | thin mentions | Partial | Partial | Fragile | Work Zone role collection model | Medium |
| BTP Security | IAS/IPS integration | Inventory §6 | cloud-identity.md, ias/ips | Verified | Complete | Ready | Trust bootstrap sequence diagrams | Medium |
| ECC / S/4 ERP Security | ECC legacy design | Inventory §7 | s4hana-security.md, s4hana-erp bank | Verified | Partial | Ready | ECC-only obsolete object guidance | Medium |
| ECC / S/4 ERP Security | On-prem vs Private vs Public security models | Inventory §7 | `s4hana-erp-security-architect-bank.md`, s4hana-security.md | Verified | Partial | Ready | Public Edition IAM apps / business catalogs depth | High |
| ECC / S/4 ERP Security | LOB authorization concepts (FI/MM/SD/PP) | Inventory §7 | scattered; not dedicated LOB auth modules | Partial | Partial | Fragile | Process-object maps per LOB | Medium |
| ECC / S/4 ERP Security | Simplification / custom txn security | Inventory §7 | s4hana-migration.md | Partial | Partial | Ready | Custom auth object design patterns | Medium |
| ECC / S/4 ERP Security | Fiori catalogs / spaces / pages auth | Inventory §7–8 | `s4hana-fiori.md`, fiori/* | Verified | Partial | Ready | Missing-tile vs auth-failure decision tree | High |
| Fiori Front-End Security | Launchpad / catalogs / spaces/pages | Inventory §8 | `fiori-security.md`, `fiori-frontend-security-architect-bank.md`, spaces-pages.md | Verified | Partial | Fragile | `spaces-pages.md` thinner; catalog vs space ownership | High |
| Fiori Front-End Security | OData/ICF / FE vs BE roles | Inventory §8 | fiori-security.md | Verified | Partial | Ready | Gateway error-log paired with STAUTHTRACE cookbook | High |
| Fiori Front-End Security | GRC Fiori apps / SSO | Inventory §8 | scattered | Partial | Partial | Fragile | App-specific auth prerequisites | Medium |
| BW / BW/4 Security | Standard vs analysis authorizations | Inventory §9 | `bw-security.md`, `analysis-authorizations.md`, `bw4hana-analysis-authorizations-architect-bank.md` | Verified | Partial | Ready | `analysis-authorizations.md` thin vs bank; `infoproviders.md` **empty** | High |
| BW / BW/4 Security | RSECADMIN design / char relevant | Inventory §9 | architect bank | Verified | Complete | Ready | Hierarchy auth & generation pitfalls | High |
| BW / BW/4 Security | Admin/dev/modeller vs business user | Inventory §9 | bw-security.md | Partial | Partial | Fragile | Role split templates | Medium |
| BW / BW/4 Security | Login OK but no data troubleshooting | Inventory §9 | bank + bw-security | Partial | Partial | Fragile | Stepwise RSECADMIN trace playbook | High |
| SAC Security | Users/teams/roles | Inventory §10 | `sac-security.md`, `sac-security-architect-bank.md` | Verified | Partial | Ready | Admin role separation scenarios | Medium |
| SAC Security | Model DAC / dimension restrictions | Inventory §10 | sac banks | Partial | Partial | Fragile | Privilege override vs DAC interactions | Medium |
| SAC Security | Planning vs analytics; live vs acquired | Inventory §10 | sac banks | Partial | Partial | Fragile | Connection-type security matrix | Medium |
| SAC Security | IdP/SSO / BW-S/4 integration | Inventory §10 | sac + ias | Partial | Partial | Fragile | Troubleshoot story/model access | Medium |
| SuccessFactors | RBP roles/groups/target populations | Inventory §11 | `successfactors-rbp-security-architect-bank.md` | Verified | Partial | Ready | Module-specific RBP (RCM/ONB/Comp) depth | High |
| SuccessFactors | EC data security / MDF | Inventory §11 | SF bank | Partial | Partial | Fragile | Sensitive field / DP policies | High |
| SuccessFactors | GRC/IAM integrations / API users | Inventory §11 | SF bank + idm/sf notes | Partial | Partial | Fragile | Termination revocation evidence | High |
| Ariba | Groups / admin / sourcing / contracts | Inventory §12 | `lob/ariba-security.md`, `ariba-security-architect-bank.md` | Partial | Partial | Fragile | Project/document ACL vs group permissions worked examples | Medium |
| Ariba | Supplier / procurement SoD / CIS provisioning | Inventory §12 | ariba bank | Partial | Partial | Fragile | Leaver + access review evidence | Medium |
| SRM/SCM/IBP/MM | Supply-chain app security | Inventory §13 | `lob/scm-srp-ibp-supply-chain-security-architect-bank.md` | Partial | Partial | Fragile | App-by-app auth models; SRM legacy depth | Medium |
| MDG | Master data roles / CR workflows / SoD | Inventory §14 | `mdg/mdg-master-data-governance-security-architect-bank.md` | Partial | Partial | Fragile | Domain-specific (customer/supplier/material) auth | Medium |
| CRM / CX / Commerce | Sales/service/commerce security | Inventory §15 | `lob/crm-cx-sales-service-security-architect-bank.md` | Partial | Partial | Fragile | Cloud CX permission models | Low |
| HANA DB Security | Users/roles/privileges/schema | Inventory §16 | `hana-authorization.md`, `hana-database-security-architect-bank.md` | Verified | Partial | Ready | Analytic privilege vs _SYS_REPO patterns | Medium |
| HANA DB Security | Audit/encryption/tech users | Inventory §16 | hana banks | Partial | Partial | Fragile | DB-layer failure vs app-layer triage | Medium |
| Integration / Cross-App | RFC/OData/SOAP/REST / hybrid path | Inventory §17 | `integration/sap-integration-cross-app-security-architect-bank.md`, cloud oauth/saml | Verified | Partial | Ready | End-to-end access-path case studies | High |
| Integration / Cross-App | Integration Suite / API security | Inventory §17 | thin | Partial | Partial | Fragile | CPI security artifact depth | Medium |
| GRC / Audit / Controls | SoD / ITGC / SOX / PC | Inventory §18 | `compliance/*`, `audit/*`, `grc/process-control.md` | Verified | Partial | Ready | PC/RM interview depth thinner than AC | Medium |
| Cybersecurity Architecture | Identity-centric / assessments / secrets | Inventory §19 | `security/sap-cybersecurity-cloud-iam-bank.md`, cyberark bank | Partial | Partial | Fragile | Assessment checklist + shared-responsibility RISE | Medium |
| Implementation / Migration | Green/brown/selective; ECC→S/4 security | Inventory §20 | `project-types/*`, `implementation-upgrade-migration-security-architect-bank.md`, s4hana-migration | Verified | Partial | Ready | Security workstream WBS with evidence artifacts | High |
| SAP Activate | Discover→Run security activities | Inventory §21 | `project-management/sap-activate.md`, activate architect bank | Verified | Partial | Ready | Security deliverables per phase checklist | High |
| RISE with SAP | Responsibilities / clean core / quality gates | Inventory §22 | `rise/*`, rise transformation bank | Verified | Partial | Ready | Customer vs SAP vs partner RACI security | High |
| Project Management | Scope/RAID/RACI/steering | Inventory §23 | `project-management/*` | Verified | Partial | Ready | Budget/commercial interview depth | Medium |
| Security Workstream E2E | 12-step workstream | Inventory §24 | `project-types/security-workstream-e2e-architect-bank.md`, security-workstream.md | Verified | Partial | Ready | Artifact templates per step | High |
| Testing / Ops / ITSM | SIT/UAT/neg tests / incident/problem | Inventory §25 | `hypercare/testing-service-ops-security-architect-bank.md`; hypercare stubs thin | Partial | Partial | Fragile | Cutover rehearsal security scripts | High |
| Leadership / Consulting | Workshops / STAR / trade-offs | Inventory §26 | `behavioral/*`, consulting leadership bank; `leadership/*` **empty stubs** | Partial | Partial | Fragile | Empty leadership/*.md files | Medium |
| Interview Copilot Engineering | Classification/retrieval/QA/audio | Inventory §27 | docs + eval (not KB interview content) | Partial | Partial | N/A (product) | Audio untested per inventory §28 | High (product) |
| CyberArk PAM | Privileged vaulting (adjacent) | Not primary inventory but present | `cyberark/cyberark-pam-architect-bank.md` | Verified | Partial | Ready | Distinguish CyberArk vs GRC EAM vs IAG PAM | Medium |
| Datasphere | Data platform security | Adjacent | `datasphere/datasphere-security.md` | Partial | Partial | Fragile | Thin module | Low |

---

## Prioritized missing / weak knowledge areas

1. **Dedicated ST03N/STAD usage-export procedure** with assignment≠usage contract (High)  
2. **Empty stubs:** transports ChaRM/release-process; troubleshooting debugging/jobs/perf; leadership/*; bw/infoproviders (High/Medium)  
3. **SAP IDM depth vs IPS plane separation** in retrieval/generation grounding (High)  
4. **IAG Bridge + Certification + sync failure** playbooks (High)  
5. **S/4 Public Edition IAM-app / business-role model** vs PFCG Private (High)  
6. **Fiori missing-tile vs authorization-failure** diagnostic tree (High)  
7. **BW “can log in / no data”** + empty InfoProviders stub (High)  
8. **SuccessFactors module RBP** beyond core EC patterns (High)  
9. **Ariba project/document ACL** worked examples (Medium)  
10. **SAC DAC vs privilege overrides** (Medium)  
11. **Supply-chain / MDG / CRM** deeper product mechanics (Medium/Low)  
12. **Integration Suite API security** depth (Medium)

---

## Inventory §28 status cross-check (independent)

| Inventory claim | This audit |
|---|---|
| Security/GRC technical bank integrated | **Supported** — deep GRC + core security files exist |
| IAG needs explicit auditing | **Confirmed** — Partial across services |
| IDM depth needs auditing | **Confirmed** — Partial + LIVE IPS drift |
| BW/BW4 depth not confirmed | **Confirmed Partial** |
| SF / Ariba / SAC dedicated coverage | **Partial banks exist; not Complete** |
| BTP / Cloud Identity completeness | **Stronger than inventory note; still Partial on edge cases** |
| RISE/Activate need auditing | **Content rich in rise/*; Activate bank Partial** |
| Microphone/audio untested | **Accepted as product gap** (out of KB scope) |
