# V3.1 Knowledge Completion Roadmap

**Purpose:** Prioritized, domain-wise plan to close inventory↔KB gaps identified in `V31_COMPLETE_SKILL_KB_COVERAGE_MATRIX.md`.  
**Architecture constraint:** Production answers = **Knowledge Base + LLM Generation**. Static Q&A pairs remain **evaluation/regression fixtures only**. Do **not** fill gaps with unverified LLM filler.  
**SME rule:** Facts marked “Requires SME/doc verification” must be checked against SAP Help / Learning / product docs before KB publish.  
**Freeze note:** This roadmap is documentation only — **no KB writes in this audit**.

---

## Priority ordering (mandated tracks)

| Track | Focus |
|---|---|
| **P1** | Frequently asked interview topics |
| **P2** | Core SAP Security and GRC |
| **P3** | Deep technical configuration and troubleshooting |
| **P4** | SAP IDM and IAM (IAS/IPS/IAG boundaries) |
| **P5** | S/4HANA and BTP Security |
| **P6** | Broader architecture and open-world competencies |

---

## P1 — Frequently asked interview topics

### P1.1 ST03N / usage mining (“export T-codes used by a user”)

| Field | Plan |
|---|---|
| Missing concepts | Exact ST03N workload navigation; user/time filters; export; STAD/SWNC alternatives; **assignment (AGR_*) ≠ execution (ST03N/STAD)** spoken contract; when SUIM is insufficient |
| KB action | **Expand** `knowledge/security/role-rationalization.md` **and/or create** `knowledge/security/st03n-usage-analysis.md` (prefer new focused module) |
| Do not | Paste static Q&A bank answers into production KB as sole content |
| Benchmark questions | (1) How do you export all T-codes used by a user? (2) How do you prove a role is unused before remediation? (3) Why can’t AGR_USERS prove execution? |
| SME verification | ST03N UI paths by Basis release; SWNC table naming; STAT26 where still valid |

### P1.2 PFCG use vs configure (regression retention)

| Field | Plan |
|---|---|
| Missing concepts | None critical post-fix; retain AGR_USERS/AGR_1251 sentences with grounding |
| KB action | **Preserve** `knowledge/security/pfcg.md` procedure text; do not “simplify” table names |
| Benchmark questions | Explain how you use PFCG; How do you configure PFCG? |
| SME verification | N/A beyond existing verified procedure |

### P1.3 SU24 vs SU25; MSMP; Critical Action vs SoD vs Critical Permission

| Field | Plan |
|---|---|
| Missing concepts | Worked SU25 2a/2b/2c evidence; Critical Action false-positive eval hygiene (product side separate) |
| KB action | **Expand** `su25.md` with delta examples; keep `msmp.md` Multi-Stage wording; tighten ARA critical-action examples in `ara.md`/`rulesets.md` |
| Benchmark questions | Difference SU24/SU25; Explain MSMP architecture; Explain critical actions and significance |
| SME verification | USOBT_C/USOBX_C merge semantics per release |

### P1.4 Analysis authorizations (BW)

| Field | Plan |
|---|---|
| Missing concepts | Login-OK/no-data triage; hierarchy; `0BI_ALL`; InfoProvider auth intersection |
| KB action | **Expand** `bw/analysis-authorizations.md`; **populate empty** `bw/infoproviders.md`; keep architect bank as deep layer |
| Benchmark questions | Explain analysis authorizations; User can execute query but sees no data — how do you troubleshoot? |
| SME verification | BW/4 vs BW classic RSECADMIN differences |

---

## P2 — Core SAP Security and GRC

### P2.1 Privileged / critical access catalog

| Field | Plan |
|---|---|
| Missing concepts | Consolidated critical T-code/object list with ACTVT patterns; admin SoD splits (S_USER_GRP vs S_USER_AGR) |
| KB action | Expand architect bank Q5 section **or** new `knowledge/security/privileged-access.md` |
| Benchmark | How do you govern security-admin vs developer access in Production? |
| SME | Landscape-specific critical lists — mark examples as illustrative |

### P2.2 GRC UAR / mitigating control effectiveness

| Field | Plan |
|---|---|
| Missing concepts | Campaign setup; reviewer escalation; control testing evidence |
| KB action | Expand mitigation + audit modules; cross-link ARM/MSMP |
| Benchmark | How do you run a SOX UAR window end-to-end? |
| SME | GRC 12 UAR configuration paths |

### P2.3 GRC connector / sync failure taxonomy

| Field | Plan |
|---|---|
| Missing concepts | Auth sync vs user sync vs repo sync failure signatures; job monitoring |
| KB action | Expand `connectors.md` + sync trio with failure→fix→retest |
| Benchmark | Repository sync succeeded but SoD still wrong — what do you check? |
| SME | Connector version prerequisites |

### P2.4 Transports / ChaRM empty stubs

| Field | Plan |
|---|---|
| Missing concepts | ChaRM security transport coupling; release process gates |
| KB action | **Create content in** empty `transports/chaRM.md`, `release-process.md`; expand `transport-management.md` |
| Benchmark | How do you transport PFCG + SU24 safely with ChaRM? |
| SME | Customer ChaRM variant differences |

---

## P3 — Deep configuration & troubleshooting

### P3.1 Authorization troubleshooting cookbook

| Field | Plan |
|---|---|
| Missing concepts | STAUTHTRACE vs ST01; Fiori FE+BE; RFC/batch; SU53 lies |
| KB action | Expand `troubleshooting/authorization-errors.md`; **populate** empty debugging/job-failures/performance stubs **only with security-relevant content** or mark out-of-scope explicitly |
| Benchmark | SU53 blank / misleading — next steps? Fiori tile missing vs 401/403? |
| SME | Gateway error log T-codes per release |

### P3.2 RFC / trusted RFC / technical users

| Field | Plan |
|---|---|
| Missing concepts | SMT1/SMT2 trust failures; S_RFC allowlists; destination auth methods |
| KB action | Expand core architect bank Q6 + integration bank |
| Benchmark | How do you harden an interface user end-to-end? |
| SME | Unified connectivity vs classic S_RFC guidance |

### P3.3 Security Audit Log purge vs read

| Field | Plan |
|---|---|
| Missing concepts | Already in architect bank — ensure retrieval hits Q11/Q12 |
| KB action | Optional split to `knowledge/security/security-audit-log.md` for retrieval density |
| Benchmark | How do you purge SAL? Can SM20 delete logs? |
| SME | RSAU_* availability by Basis |

---

## P4 — SAP IDM and IAM

### P4.1 SAP IDM Identity Center depth (critical)

| Field | Plan |
|---|---|
| Missing concepts | Entry types, jobs/tasks/event tasks, dispatcher, ToIdentityStore, connector scripts — **distinct from IPS SCIM sync** |
| KB action | Expand `sap-idm-identity-management-architect-bank.md` + `idm-provisioning.md`; add explicit **anti-collapse** section: “If question says IDM, do not answer only IPS” |
| Benchmark | Explain IDM provisioning lifecycle; Event task for leaver; IDM vs IPS responsibilities |
| SME | IDM 8.0 package/transport model; MX_* attribute standards |

### P4.2 IAS / IPS edge cases

| Field | Plan |
|---|---|
| Missing concepts | Proxy systems; transformation filters; corporate IdP multi-route; cert expiry |
| KB action | Expand `ias.md`/`ips.md` troubleshooting |
| Benchmark | IPS job success but target missing groups — triage? |
| SME | Connector support matrix |

### P4.3 IAG services completion

| Field | Plan |
|---|---|
| Missing concepts | Bridge scenarios; Certification campaigns; sync job failures; GRC coexistence |
| KB action | Expand architect bank + dedicated Bridge section; deepen Certification |
| Benchmark | When IAG Bridge vs replace GRC AC? PAM ID vs Firefighter ID? |
| SME | SAP IAG Help service docs |

---

## P5 — S/4HANA and BTP Security

### P5.1 S/4 edition boundaries

| Field | Plan |
|---|---|
| Missing concepts | Public Edition business roles / catalogs / IAM apps vs Private PFCG |
| KB action | Expand `s4hana-erp-security-architect-bank.md` with edition decision tree |
| Benchmark | How does role maintenance differ Public vs Private Edition? |
| SME | Current Public Edition IAM app names |

### P5.2 Fiori FE/BE diagnostics

| Field | Plan |
|---|---|
| Missing concepts | Missing tile vs launch failure vs backend auth; spaces/pages ownership |
| KB action | Expand fiori architect bank; thicken `spaces-pages.md` |
| Benchmark | User sees no tile — what do you check in order? |
| SME | Launchpad content manager vs legacy catalogs |

### P5.3 BTP XSUAA depth for LIVE quality

| Field | Plan |
|---|---|
| Missing concepts | xs-security.json scopes/role templates; destination OAuth types; principal propagation |
| KB action | Ensure architect bank chunks retrieve for broad “authN/authZ architecture” prompts (structure headings for retrieval) |
| Benchmark | Explain authentication and authorization architecture on BTP |
| SME | XSUAA vs IAS responsibility split |

### P5.4 OAuth auth code in SAP cloud

| Field | Plan |
|---|---|
| Missing concepts | PKCE; IAS-as-AS; refresh; resource-server scopes (extend `cloud/oauth.md`) |
| KB action | Expand oauth.md with SAP-specific validation steps |
| Benchmark | Authorization code flow in cloud integrations with IAS |
| SME | IAS OIDC app configuration fields |

---

## P6 — Broader architecture & open-world

### P6.1 SuccessFactors / Ariba / SAC / MDG / SCM / CRM

| Field | Plan |
|---|---|
| Missing concepts | Module RBP; Ariba document ACL; SAC DAC overrides; MDG CR SoD; SCM/IBP; CX permissions |
| KB action | Expand existing `*-architect-bank.md` files per domain; avoid generic filler |
| Benchmark | One diagnostic + one design question per domain (see matrix) |
| SME | Each cloud product Help portal |

### P6.2 RISE / Activate / security workstream artifacts

| Field | Plan |
|---|---|
| Missing concepts | Phase deliverable checklists; customer/SAP/partner RACI |
| KB action | Expand Activate + rise transformation banks with security WBS artifacts |
| Benchmark | Security activities in Explore vs Realize; RISE responsibility boundaries |
| SME | Latest RISE methodology quality gates |

### P6.3 Leadership empty stubs

| Field | Plan |
|---|---|
| Missing concepts | Client/delivery/team/vendor management interview depth |
| KB action | Populate empty `leadership/*.md` **from verified behavioral frameworks** already in `behavioral/*` — dedupe carefully |
| Benchmark | Conflict with audit vs go-live date; mentoring junior security consultants |
| SME | N/A (soft skills) — still no fabricated personal metrics |

### P6.4 HANA / Integration Suite

| Field | Plan |
|---|---|
| Missing concepts | Analytic privileges triage; CPI/API Management security artifacts |
| KB action | Expand hana + integration banks |
| Benchmark | Authorization fails at DB not app — how do you prove it? |
| SME | HANA privilege model docs |

---

## Validation protocol (per gap closed)

1. SME/doc-verify technical facts.  
2. Write/expand **KB markdown only** (no production static Q&A substitution).  
3. Rebuild/index when authorized (out of scope for this frozen audit).  
4. Offline retrieval probe: target question returns intended chunk.  
5. LIVE or bounded provider eval: target + negative control + paraphrase + follow-up.  
6. Score: technical correctness, product-plane accuracy, fabrication, spoken tone, sanitization artifacts.  
7. Regression: PFCG AGR retention, ST03N plane, MSMP naming, SU24≠SU25.

---

## Explicit non-actions

- Do **not** invent customers, metrics, or project outcomes in KB.  
- Do **not** treat eval `expectedAnswers` / Q&A fixtures as Knowledge Base fills.  
- Do **not** collapse IAS ≠ IPS ≠ IAG ≠ IDM ≠ GRC EAM ≠ CyberArk in new content.  
- Do **not** claim LIVE readiness from offline mocks alone.

---

## Suggested execution waves (when freeze lifts)

| Wave | Items | Exit criteria |
|---|---|---|
| Wave A | P1.1 ST03N module; P4.1 IDM anti-collapse; empty transport/BW stubs | LIVE ST03N + IDM benches → PASS |
| Wave B | P2 GRC UAR/connectors; P3 troubleshooting cookbook | Critical-actions processing fix verified separately in eng cycle |
| Wave C | P5 edition/Fiori/BTP retrieval headings | BTP + S/4 edition LIVE → PASS |
| Wave D | P6 cloud LOB banks + leadership stubs | Matrix rows move Partial→Complete for targeted domains |
