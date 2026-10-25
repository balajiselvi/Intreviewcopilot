# SAP IAG — Cloud Identity Access Governance Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** SAP Identity Access Governance (IAG) cloud services are **not** on-prem GRC Access Control renamed. Core services: Access Analysis, Access Request, Certification Review, Role Design, Privileged Access Management. **IAG Bridge** integrates with GRC AC where hybrid. IAS/IPS are identity planes; IAG is governance. Do not claim IAG “replaces PFCG.”

**Anti-surface rule:** Prefer service configuration, connector sync, Bridge scenarios, and campaign evidence over marketing definitions.

## Q1: How do you decide between SAP IAG, GRC Access Control, or a hybrid Bridge architecture?

- **Decision:** Choose by landscape: cloud-first / BTP-centric governance → IAG; deep on-prem AC ruleset/MSMP investment → GRC AC; dual → IAG Bridge with clear system-of-record for requests and analysis.
- **Mechanism:** Inventory connectors needed (S/4, SF, ARIBA, ABAP on-prem). If Bridge: define which risks analyze in which engine and how Access Request routes. Document user UX (IAG UI vs GRC ARM). Align IAS as authentication for IAG tenants.
- **Governance:** ADR locked in Explore; changing Bridge vs standalone mid-Realize requires CAB. Dual maintenance of identical rulesets without sync ownership rejected.
- **Validation:** Architecture diagram shows request/analysis path for one joiner and one SoD hit; test request completes on the chosen path only.

## Q2: How do you implement Access Analysis Service for SoD and critical access in IAG?

- **Decision:** Access Analysis is the cloud risk engine—rulesets/functions must include the apps and permissions actually used (including Fiori/cloud entitlements in scope).
- **Mechanism:** Onboard target systems via IAG connectors; synchronize users/roles/assignments; run risk analysis / what-if simulation; investigate violations; remediate by role change or mitigating control assignment. Schedule recurring analysis jobs; monitor sync failures.
- **Governance:** Risk owners and control owners named in IAG; critical risks cannot sit open without mitigation past SLA. Ruleset changes change-controlled.
- **Validation:** Known toxic test user appears in analysis; after role split, risk clears; sync job log green; false positive fixed in ruleset with ticket.

## Q3: How do you design Access Request Service with risk simulation and provisioning?

- **Decision:** Access Request is the approval + simulation gate before provisioning—not a cosmetic form in front of uncontrolled admin grants.
- **Mechanism:** Configure request types, approval workflow, risk simulation on submit, and provisioning integration to targets (and/or Bridge to GRC). Map approvers (role owner, manager, risk owner). Ensure rejected risks block or require mitigation path per policy.
- **Governance:** Production direct role assign bypassing IAG is policy violation except break-glass. SLA on pending approvals with escalation.
- **Validation:** Request with toxic combo shows risk; approver sees simulation; approval provisions assignment; denial leaves access unchanged.

## Q4: How do you run Certification Review campaigns that produce audit-ready evidence?

- **Decision:** Certification is periodic attestation of assignments—campaign design must match SOX/UAR scope, not ad-hoc screenshots.
- **Mechanism:** Define campaign scope (systems, user populations, role types); assign reviewers; collect maintain/revoke decisions; drive remediation provisioning; retain campaign reports. Include privileged and cloud app populations explicitly.
- **Governance:** Non-responding reviewers escalate; revoked access removed within SLA; campaign closure signed by control owner.
- **Validation:** Sample user revoked in campaign disappears from target; evidence export matches UI decisions; open items aged in report.

## Q5: How do you use Role Design Service without duplicating PFCG/business-role maintenance poorly?

- **Decision:** Role Design models business roles for governance/optimization; enforcement remains in the target (PFCG / Public business roles / cloud groups)—IAG does not magically merge product auth models.
- **Mechanism:** Import/model business roles; map technical roles; run optimization/similarity where used; govern ownership and lifecycle approvals before publishing changes back to maintenance process.
- **Governance:** Role owners approve business-role changes; Security reviews SoD impact via Access Analysis before Production.
- **Validation:** Business-role change simulates risk; after publish, target assignment matches; orphan technical roles flagged.

## Q6: How do you implement IAG Privileged Access Management versus GRC EAM Firefighter?

- **Decision:** IAG PAM governs cloud/hybrid privileged elevation requests and review; GRC EAM remains Firefighter for classic ABAP where Bridge/landscape dictates—do not dual-run conflicting break-glass without RACI.
- **Mechanism:** Configure PAM request types, approvers, session/assignment windows, and review of privileged usage. For ABAP Firefighter via Bridge/GRC, keep controller log review (`GRAC_SPM_LOG_SYNC` path) intact. CyberArk may vault OS/DB secrets separately from SAP Firefighter.
- **Governance:** Standing SAP_ALL banned; PAM/EAM logs reviewed within SLA; tool choice per system in ADR.
- **Validation:** Privileged request grants temporary access; expires; review task completes; parallel unmanaged admin role absent.

## Q7: How do you onboard S/4 and on-prem systems into IAG connectors reliably?

- **Decision:** Connector health and repository sync are prerequisites for trustworthy analysis—stale sync equals false audit comfort.
- **Mechanism:** Configure destination/connectivity (Cloud Connector where needed); authenticate technical users least privilege for read of user/role data; schedule sync; monitor failures; validate counts (users, roles) after sync. Troubleshoot auth, certificate, and payload errors via job logs.
- **Governance:** Sync failure beyond SLA raises incident; no certification campaign on stale data without disclosure.
- **Validation:** Sync success log; spot-check user/role in IAG matches SUIM/target; induced failure alert observed in non-prod.

## Q8: How do you operate IAG Bridge with GRC Access Control without splitting the truth?

- **Decision:** Declare system of record per process (request, risk, mitigation) and synchronize—Bridge is integration, not “both own everything.”
- **Mechanism:** Configure Bridge per SAP guidance for the release; map risk repositories/mitigations; align user identities via IAS; test request originating on each side if bi-directional. Document which UI end users use.
- **Governance:** Ruleset change procedure states which system is edited first and how the other updates. Conflicting mitigations escalated.
- **Validation:** Single SoD scenario consistent on both UIs per design; provisioning occurs once; audit trail complete on the SoR.

## Q9: How do you troubleshoot identity/role sync mismatches between IAG and targets?

- **Decision:** Classify as connectivity, mapping/correlation, authorization of technical user, or timing—fix correlation keys before rebuilding rulesets.
- **Mechanism:** Compare IAG user key to IAS/`BNAME`/SF ID; re-run sync; inspect transformation if IPS involved upstream; check deleted/expired users. For assignment drift, reconcile provisioning logs vs IAG request history.
- **Governance:** Manual “fix in target only” without IAG update creates drift—forbidden for governed systems.
- **Validation:** After remapping, user appears once; assignment matches; duplicate identity report clear.

## Q10: What implementation and operating-model evidence do you require for IAG go-live?

- **Decision:** Go-live needs connector inventory, ruleset ownership, request UX acceptance, certification calendar, PAM procedure, and Bridge SoR—not only tenant URL access.
- **Mechanism:** Deliver ADR; RACI; sync SLAs; sample analysis/request/cert/PAM evidence; training for approvers; hypercare defect path.
- **Governance:** Deploy gate requires Security + Control Owner signatures. Residual risks logged with expiry.
- **Validation:** End-to-end: request → simulate → approve → provision → certify; PAM path tested; sync green; audit pack stored.

## Q11: What is SAP Cloud IAG and how does it differ from SAP GRC Access Control?

- **Decision:** Treat SAP Cloud IAG as BTP SaaS governance for hybrid/cloud landscapes; treat SAP GRC Access Control 12.0 as the on-premise/private ABAP governance stack. Prefer IAG when cloud apps and BTP-centric governance dominate; prefer GRC AC 12.0 when deep MSMP/BRF+/ARA investment and ABAP Firefighter dominate; prefer IAG Bridge hybrid when both must share risk/request truth. Never answer with doors/keys analogies.
- **Mechanism:** Direct technical comparison:
  - **SAP GRC Access Control 12.0:** On-premise ABAP add-on (`GRCFND_A` V1200 + plug-in `GRCPINW`); ARA ruleset stored in ABAP database tables; ARM access requests routed by **MSMP** workflows with **BRF+** initiator/agent decision tables; EAM Firefighter via SPM tables/jobs (e.g. `GRAC_SPM_*` sync/log review); connectors and repository sync through GRC Integration Framework / **SM59** RFC (and related connection settings); maintenance via SPRO / NWBC / expert MSMP transactions — not BTP microservices.
  - **SAP Cloud IAG:** SaaS on **SAP BTP**; microservices — **Access Analysis**, **Access Request**, **Access Certification**, **Role Design**, **Privileged Access Management (PAM)**; end-user authentication into IAG via **IAS**; repository/user sync via IAG connectors and often **IPS**/identity feeds; **IAG Bridge** connects to on-prem GRC AC for hybrid SoR; connectivity to on-prem via **SAP Cloud Connector** / BTP destinations and REST APIs — IAG does **not** use MSMP/BRF+ as its native cloud workflow engine; GRC MSMP remains on the ABAP side when Bridge is used.
  - **Enforcement boundary:** Neither product replaces target authorization — S/4 still enforces PFCG (or Public Edition business roles); BTP still enforces role collections; IAG/GRC decide appropriateness and request/certify/analyze.
- **Governance:** On-prem GRC localizes SOX/ITGC evidence around ABAP request/audit trails, Firefighter log review, and ARA mitigation controls. IAG scales multi-tenant cloud certification campaigns and Access Analysis across cloud connectors with IAS-backed access to the governance UI. In Bridge landscapes, declare a single system of record per process (request vs analysis vs mitigation) to avoid dual conflicting rulesets.
- **Validation:** GRC path — prove connector in Integration Framework / SM59, run ARA simulation, complete an MSMP/BRF+ ARM request, review Firefighter logs. IAG path — prove IAS login to IAG, connector/repository sync green, Access Analysis hit on a toxic test user, Access Request with risk simulation, and (if hybrid) Bridge end-to-end consistency with on-prem GRC. Never validate with metaphor; validate with sync logs, request IDs, and risk hits.
