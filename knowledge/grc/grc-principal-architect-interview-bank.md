# SAP GRC Security — Principal Architect Interview Bank

Spoken Principal Architect answers for SAP Security and GRC Access Control interviews. Keep Access Control, Process Control, and IAG as separate products. Prefer methodology framing ("I would…") unless verified candidate experience is supplied. Do not invent employers, metrics, or personal project history.

## Q1: How do you align SAP Security and GRC Access Control strategy with enterprise-wide Zero Trust Architecture (ZTA)?

I would align SAP Security with Zero Trust by shifting from perimeter trust to explicit verification, least privilege, and continuous risk evaluation.

Explicit verification means IdP-backed MFA through SAP Cloud Identity Services (IAS/IPS) or a corporate IdP, with SAML 2.0 or OAuth/OIDC for Fiori and web services. Least privilege means task-based Fiori roles and tight backend OData/RFC exposure through S_SERVICE and the business authorization objects that actually enforce the transaction. Continuous evaluation means ARA simulation inside ARM before provisioning, and IAG only where cloud governance is in scope—not as a rename of Access Control MSMP.

Validate by proving sign-in, least-privilege effective access, and risk simulation on representative joiner and change requests.

## Q2: What is your methodology for driving a Greenfield vs. Brownfield SAP S/4HANA Security and GRC migration?

I would decide Greenfield versus Brownfield from the deployment and authorization baseline, not from a generic migration slogan.

Greenfield focuses on Clean Core: task-based Fiori catalogs, groups or Spaces/Pages, BRM for business roles where used, SU24 as the proposal source, and S/4HANA-compatible SoD rulesets from the start. Brownfield focuses on remediation: SU25 2a–2d to reconcile proposals, Simplification Item impact on obsolete T-codes (for example BP replacing classic vendor/customer masters), then ARA ruleset sync and function remediation for new OData services and S/4 transactions.

Validate with edition-correct role tests and a post-migration SoD baseline before go-live.

## Q3: How do you design an enterprise Segregation of Duties (SoD) Framework to eliminate false positives in GRC ARA?

I would treat false positives as a ruleset-quality defect, not an audit inconvenience.

Refine functions and risks from action-only T-code pairs toward permission-level criteria (service or T-code plus authorization object, field, and ACTVT). Pull broad objects such as S_TABU_DIS with &NC&, S_PROGRAM, and S_DEVELOP into dedicated admin roles. Configure org-level context so conflicts fire only inside the relevant company code or plant boundary. Clean SU24 and risk object maps so display-only paths stop generating noise.

Validate by comparing before/after ARA on known clean and known conflict users with risk owners agreeing the residual set is actionable.

## Q4: Explain the architectural integration between SAP GRC 12.0 (On-Premise/PCE) and SAP Cloud Identity Access Governance (IAG).

I would describe a Bridge topology, not a single merged product.

GRC Access Control 12.0 remains the engine for on-premise or private-cloud ABAP targets, while IAG governs supported cloud applications. Repository and identity sync bring cloud users, roles, and entitlements through the documented connectors or IPS path into the bridge landscape. When ARM needs cross-system analysis, GRC calls IAG over the documented integration APIs so cloud and on-premise risk can be evaluated before provision.

Keep MSMP/BRF+ configuration on the ABAP GRC system separate from IAG RequestTypeRule and Rule Setup. Validate with an end-to-end request that proves both analysis and target provisioning.

## Q5: How do you establish an effective Governance Framework for custom authorization objects and Z-transactions?

I would make custom security a development quality gate, not a PFCG cleanup exercise.

Require AUTHORITY-CHECK for custom Z-objects or the correct standard objects in ABAP. Maintain SU24 Check/Maintain proposals for every Z-transaction and forbid manual object stuffing in PFCG as the delivery pattern. Extend ARA functions only through change control after SoD impact assessment in a non-production GRC client. Use ATC or equivalent gates to block transports missing authorization checks.

Validate by tracing a custom app end to end and confirming SU24 proposals match the checks that actually fire.

## Q6: Walk me through the security architecture of SAP Fiori in an embedded S/4HANA deployment.

In embedded S/4HANA, UI and backend share the ABAP stack, so I separate launch authorization from business authorization.

The user reaches Launchpad content through catalogs, groups or Spaces/Pages on the PFCG role, with S_SERVICE controlling OData service execution. Backend CDS and application logic still enforce business objects and org levels. STAUTHTRACE or SU53 must be read with that split in mind: a visible tile is not proof of backend create/change rights.

Validate with a positive business task and a negative org-level or activity test for the same user.

## Q7: How do you secure SAP Fiori OData V2 vs. OData V4 services?

I would secure both through S_SERVICE, but I would not treat V2 and V4 proposal metadata as identical.

V2 commonly relies on S_SERVICE service naming plus Gateway proposal types such as IWSG/IWSV in SU24. V4 adds structured service versioning and related proposal types; confirm the exact object fields and SU24 object types on the target release rather than inventing universal hashes. In both cases, backend business objects remain the enforcement for data change.

Validate by authorizing only the intended service version and proving sibling services stay denied.

## Q8: What is the recommended strategy for migrating from Fiori Groups to Spaces and Pages in S/4HANA?

I would migrate layout without confusing layout with authorization.

Spaces map to role domains; Pages map to task groupings inside those domains. Technical catalogs hold tile and target mappings; business catalogs are consumed by Pages and by PFCG roles. Use Launchpad content tools such as /UI2/FLPCM_CUST or the documented content manager for the release, then deprecate Group assignments after role-based validation.

Validate by signing in as each business role and confirming intended tiles appear while unauthorized tiles stay hidden.

## Q9: How do SAP CDS Views implement DCL (Data Control Language) for row-level security in S/4HANA?

I would explain DCL as query-time row filtering bound to PFCG aspects, not as a substitute for S_SERVICE.

DCL conditions map CDS fields to authorization objects through aspect syntax so the database layer filters rows when the view is selected. That keeps Fiori, analytics, and other consumers consistent without duplicating every check in ABAP. Empty results with a clean SU53 often mean DCL filtered the rows.

Validate with SACM or SQL/trace evidence that the aspect values match the user’s org or activity restrictions.

## Q10: How do you secure Key User Adaptation and Custom Fields & Logic in SAP Fiori?

I would isolate adaptation as a controlled development capability.

Grant UI adaptation and Custom Fields apps only to named key users or architects through the release’s adaptation and development objects (for example S_UI_FLEX_A / related develop authorizations—confirm on system). Prefer creating adaptations in development on transports; do not leave broad runtime adaptation open in production.

Validate that a normal business user cannot open adaptation tooling and that transported adaptations appear only after import.

## Q11: What authorization objects control SAP Fiori Launchpad personalization and app execution?

I would name the objects by job, then confirm them on the system.

S_SERVICE gates OData execution for tiles. Catalog and chip evaluation objects control what the Launchpad can assemble for the user. Adaptation objects control runtime flexibility. Table authorizations such as S_TABU_NAM or S_TABU_DIS matter when configuration apps expose customizing tables. Exact object set is release-dependent; I would verify with STAUTHTRACE on a known tile.

Validate launch, personalization boundaries, and denied configuration tiles separately.

## Q12: How do you secure RFC connections between FES and BES in a Central Hub deployment?

I would prefer trusted RFC and least-privilege S_RFC / S_RFCACL over stored passwords and wildcards.

Establish the trust relationship in SM59, constrain S_RFCACL on the accepting system, and limit S_RFC to required function groups rather than RFC_NAME = *. Hub topology keeps UI and backend separate, so both ends need matching trust and user mapping.

Validate with a controlled RFC call that succeeds for the intended group and fails for an out-of-scope module.

## Q13: How do you troubleshoot a missing authorization issue in a Fiori application when SU53 shows no failures?

I would not stop at SU53 for Fiori.

Check browser network and console for 403/500, Gateway error log /IWFND/ERROR_LOG, then STAUTHTRACE or ST01 on the backend while reproducing. If checks pass but data is empty, inspect DCL/CDS filtering. Frontend catalog issues, Gateway service activation, and backend business objects are different layers.

Validate by fixing one layer at a time and retesting the exact business action, not a different tile.

## Q14: How does SAP HANA Database-level security integrate with SAP Application-level security in S/4HANA?

I would keep the planes separate.

Normal S/4 users are enforced by PFCG while the application uses technical DB connectivity. Direct HANA analytic or XSA access is a different path: DB users or federated identities need object and analytic privileges through HANA roles. HANA analytic privileges are not BW RSECADMIN and not S/4 DCL, even when the business goal looks similar.

Validate application users through ABAP traces and direct DB consumers through HANA privilege diagnostics.

## Q15: What are the security risks associated with S_TABU_DIS and S_TABU_NAM, and how do you remediate them?

S_TABU_DIS with &NC& is a classic over-grant because ungrouped tables fall into that bucket.

I would assign authorization groups to custom tables, prefer S_TABU_NAM for precise table access, and keep ACTVT at display unless change is justified. Remediation is SU24-driven so the proposals travel with the transaction or service.

Validate with a trace that display works for intended tables and change or foreign tables fail.

## Q16: Walk me through setting up an end-to-end MSMP Workflow in Access Request Management (ARM).

I would configure MSMP on Access Control, not in IAG.

Maintain the Access Request process in Maintain MSMP Workflows (GRFNMW_CONFIGURE is the documented expert transaction for Access Control releases that use it). Define initiator, paths, stages, agents, and notifications; map BRF+ initiator and agent results to paths and stages; generate the MSMP version after changes. Test with Request Status and Instance Status, including Approvers of Selected Path.

Validate provisioning separately after approval. This is not IAG RequestTypeRule.

## Q17: How do you configure BRF+ (Business Rules Framework Plus) for dynamic approver routing in GRC ARM?

I would separate initiator path selection from stage agent determination.

Build or extend the BRF+ decision tables on the request attributes that actually drive routing, activate the function, and map RULE_RESULT values in Maintain MSMP Workflows. Do not invent a universal BRF+ application name; use the landscape’s delivered or project function. Retest representative request types and inspect Instance Status.

If the path is wrong, fix initiator/route mapping before changing the stage agent rule.

## Q18: What is the technical mechanism behind Emergency Access Management (EAM) ID-Based vs. Role-Based Firefighting?

I would choose the firefighter model from the UI and audit requirements.

ID-based firefighting runs a session under a dedicated firefighter ID with logs tied to that ID and GRC session controls—typical for classic GUI plug-in scenarios. Role-based firefighting temporarily assigns a firefighter role to the user’s own ID so actions remain under that user, which fits many Fiori-centric landscapes. Neither is an IAG PAM ID.

Validate launch, logging, and controller review before calling the control effective.

## Q19: How do you handle EAM log review failures or missing audit logs for Firefighter sessions?

I would start with sync and plugin health, not with redesigning EAM.

Confirm SPM log sync and cleanup jobs, plugin/RFC authorizations for the firefighter log collection path, and that the target Security Audit Log is active for the expected events. Inspect GRC firefighter log tables or apps and re-run sync if needed. Missing controller inbox items are a different defect from missing target audit configuration.

Validate by completing a test firefighter session and seeing the review workflow populate.

## Q20: How do you configure Business Role Management (BRM) to enforce a standardized Role Lifecycle Methodology?

I would use BRM to govern business-to-technical mapping and methodology gates, not to replace PFCG design.

Define methodology steps (define, authorize, risk analysis, approve, generate, test, deploy) and bind role types to those paths. Keep derived and organizational variants consistent with master templates. ARM then requests the business role while provisioning still assigns technical roles.

Validate that a business-role request provisions the intended technical set and that stale mappings are caught before go-live.

## Q21: What are the differences between User Access Review (UAR) and SoD Review in GRC Access Control?

UAR certifies whether assigned access is still appropriate for the person. SoD review focuses on users or roles carrying defined risks. Both are Access Control certification processes with their own MSMP process IDs and scheduling jobs; neither is IAG Certification Review.

Validate campaign scope, reviewer accountability, and evidence retention separately from provisioning.

## Q22: Explain the architecture of Mitigating Controls in GRC ARA and how they affect risk scoring.

A mitigating control is a governed exception when the business cannot remove a conflict.

Define control, owner, monitor, evidence, and expiry; assign at user, role, or request level as policy allows. Reporting options that exclude mitigated risks change the residual view for operations, but audit still needs the mitigation trail. Mitigation is not remediation and not Process Control automatically—though a Process Control control can be referenced when that integration is in scope.

Validate expiry, owner accountability, and that residual risk reporting matches what audit expects.

## Q23: How do you perform offline GRC Risk Analysis for non-SAP applications?

I would only claim offline analysis where the Access Control release supports file-based import.

Load user, role, and permission extracts in the documented templates, map non-SAP permissions into functions and risks, and run ARA against the non-SAP connector definition. Cross-system analysis still depends on consistent function definitions.

Validate with a known conflict fixture and a known clean fixture before relying on production imports.

## Q24: What is the function of GRC Connector Groups and how do they impact risk analysis performance?

Connector groups bundle target connectors for ruleset generation and analysis scope.

Over-broad groups drive expensive cross-system runs. I would scope groups by landscape purpose, keep repository sync healthy, and prefer incremental analysis windows over repeated full daytime syncs when volume demands it.

Validate runtime and result stability after group changes on a representative subset before enterprise rollout.

## Q25: How do you configure End-User Provisioning (EUP) profiles in GRC ARM?

EUP controls field behavior on access request forms—mandatory, optional, read-only, or hidden.

I would maintain EUP in Access Request customizing and bind specialized forms through MSMP/BRF+ decisions when employee versus privileged request paths differ. EUP does not replace initiator rules or provisioning connectors.

Validate each request type’s form and the resulting MSMP path together.

## Q26: Explain the difference between SU24 and SU25 and how you manage them during an upgrade.

SU24 is the customer proposal maintenance for transactions and services. SU25 is the upgrade reconciliation utility against new SAP defaults after support packages or S/4 upgrades.

I would run the compare and merge steps carefully so customer SU24 decisions are not blindly overwritten, then identify impacted roles and regenerate profiles with controlled testing.

Validate critical transactions before and after merge with STAUTHTRACE, not only with SU25 return codes.

## Q27: How do you debug authorization issues caused by missing S_TABU_NAM vs S_TABU_DIS?

I would trace first.

Reproduce under STAUTHTRACE/ST01 and read RC on S_TABU_DIS and S_TABU_NAM. Remediate through SU24 with the precise table or group and ACTVT needed, preferring S_TABU_NAM for named tables when broad groups are unacceptable.

Validate display versus change separately and confirm unrelated tables remain denied.

## Q28: How do you secure RFC connections against unauthorized execution via Unified Connectivity (UCON)?

I would treat UCON as a whitelist control on top of S_RFC, not a replacement for it.

Log real RFC usage, build communication assemblies from observed legitimate calls, then move to blocking mode so undeclared modules fail at the connectivity layer. Confirm the UCON phases and apps on the exact NetWeaver/S/4 release before quoting transaction codes.

Validate by attempting an out-of-assembly module and confirming the block with monitoring evidence.

## Q29: What is the purpose of authorization object S_PROGRAM and how do you secure ABAP reports?

S_PROGRAM restricts program submit and variant maintenance by authorization group.

I would assign groups on custom programs and grant SUBMIT only for those groups; avoid P_GROUP = *. Pair this with table and RFC controls when reports expose data or interfaces.

Validate that intended reports run and ungrouped or foreign groups fail.

## Q30: How do you handle emergency security fixes in Production without violating audit controls?

I would prefer Firefighter plus accelerated change control over silent production PFCG edits.

Use EAM for immediate break-glass, document the session, and drive the lasting fix through development transports with emergency CAB approval. If a transient production change is unavoidable under Firefighter, reconcile with a transported correction quickly and retain evidence.

Validate that the emergency session was reviewed and the durable transport removed the need for repeated firefighting.

## Q31: How do you design roles to support Structural Authorizations in SAP HR/SuccessFactors?

For on-premise HCM, structural profiles constrain org hierarchy access and must intersect standard HR authorization objects such as P_ORGIN or context-sensitive variants when activated. SuccessFactors RBP is a different model—permission roles, groups, and target populations—not structural T77 profiles.

I would not describe SF RBP as structural authorizations. Validate HR cases with both structural and object checks; validate SF with RBP target population tests.

## Q32: What is SecStore and how do you audit system security credentials?

Secure Store holds encrypted technical credentials and keys for the system.

I would review SECSTORE integrity, remove or remediate insecure legacy entries, and protect key management procedures. This is Basis/security hardening, not GRC ARA.

Validate after credential rotation that dependent RFC and DB connections still work without reintroducing plaintext secrets.

## Q33: How do you remediate findings from an SAP Security Audit File (SM20 / Security Audit Log)?

I would configure RSAU_CONFIG/SM19 for the events that matter—failed logons, user admin, critical transactions, sensitive RFC—then triage SM20/RSAU reporting into actionable defects.

Remediation means fixing roles, procedures, or monitoring alerts, not merely archiving the log. Correlate with Firefighter and change records when privileged activity appears.

Validate that critical events are present in a controlled test and that alert routing reaches the owning team.

## Q34: What is the function of the S_LOGOFF and S_PATH authorization objects?

S_LOGOFF relates to forced logoff capabilities for sessions. S_PATH restricts logical file path access used by ABAP file interfaces and should be paired with disciplined FILE/logical path configuration.

Grant both narrowly. Validate that intended admin actions work and broad filesystem or session disruption paths fail.

## Q35: How do you automate role testing during an S/4HANA upgrade project?

I would capture STAUTHTRACE during integration tests, compare required checks to SU24 and role contents, and defect missing authorizations before UAT freeze.

Automation helps regression, but business-task scripts remain the acceptance source. GRC risk simulation complements, it does not replace functional authorization testing.

Validate critical process scripts on upgraded roles with positive and negative cases.

## Q36: How do you justify the ROI of an SAP GRC upgrade or implementation to C-level stakeholders (CISO, CFO)?

I would frame ROI as risk reduction and operating efficiency, without inventing guaranteed zero findings.

Quantify audit effort avoided through consistent evidence, provisioning cycle-time reduction via ARM, and residual SoD exposure reduction through ARA and remediation. Separate Access Control benefits from Process Control and IAG benefits so the business case matches the products in scope.

Validate benefits with baseline metrics agreed before go-live—cycle time, open SoD counts, audit exceptions—not slogans.

## Q37: How do you handle conflict between Business Process Owners who resist remediating critical SoD risks?

I would keep the conversation on residual risk ownership.

Show the concrete ARA evidence, offer remediation versus time-bound mitigation with monitoring, and if neither is accepted escalate formal risk acceptance to the accountable executive or risk committee. Do not silently suppress rules to make reports green.

Validate that the chosen path has an owner, expiry, and evidence trail.

## Q38: How do you structure an effective team for a global SAP GRC & Security delivery project?

I would separate architecture, GRC engineering, role design, and audit remediation streams under one security workstream lead, with clear RACI to identity, Basis, and business owners.

Keep IAG/cloud identity specialists distinct when hybrid scope exists. Hypercare needs named L2/L3 owners before Deploy.

Validate the model against the Activate security workstream gates for Explore, Realize, and Deploy.

## Q39: How do you ensure quality control across multi-vendor SAP delivery teams?

I would publish binding standards—SU24 discipline, naming, forbidden broad objects—and enforce them with transport checks and architecture review before UAT.

Vendors deliver inside those gates; exceptions require risk acceptance. Shared tooling beats slideware standards.

Validate by sampling transports and roles for &NC&, S_DEVELOP, and manual authorization anti-patterns.

## Q40: Describe a scenario where you proactively identified and mitigated a major security vulnerability on a client engagement.

I would not invent a client story. If verified candidate experience exists, I would use only those facts. Otherwise I would describe the method: during assessment, treat Production S_TABU_DIS ACTVT 02 with &NC& plus open S_DEVELOP as an emergency exposure, quantify blast radius, contain with Firefighter monitoring and access restriction, remediate table groups and role design in lower environments, and retest before promoting.

Validate containment evidence and the durable transport that removes the standing over-grant.
