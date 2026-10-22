# SAP GRC & S/4HANA Security — Greenfield & Brownfield Scenario Bank

Spoken Principal Architect scenarios for Greenfield and Brownfield S/4HANA security and GRC delivery. Keep Access Control, Process Control, and IAG as separate products. Prefer methodology framing ("I would…") unless verified candidate experience is supplied.

## Q51: In an S/4HANA Greenfield implementation, business process owners insist on using legacy ECC T-codes. How do you enforce a Clean Core security architecture?

I would reject standing legacy transaction usage where a Fit-to-Standard Fiori or S/4 path exists, and treat exceptions as governed architecture decisions—not as role design convenience.

Decision: Prefer task-based Fiori catalogs and standard S/4HANA transactions over ECC T-code carry-forward. Mechanism: Run Fit-to-Standard workshops that map activities to business roles and apps, use the Simplification Item list to retire deprecated T-codes, and maintain SU24 for OData services and S_SERVICE. Governance: Require Architecture Board written exception approval when a legacy T-code is requested despite a native app. Validation: Use ATC and STAUTHTRACE in UAT to prove target roles do not rely on deprecated T-codes.

## Q52: During a Brownfield system conversion, SUM (Software Update Manager) fails due to legacy transport conflicts in custom auth objects. How do you unblock execution?

I would unblock SUM by isolating custom authorization debt before the conversion window, not by forcing broken profiles through DMO.

Decision: Clear orphan and invalid custom auth artifacts from active roles before database migration. Mechanism: Prepare authorization data with SU25 Step 1, analyze custom auth usage in ABAP, and remediate table/auth-group inconsistencies via SE54/TBRG as needed. Governance: Freeze security transports during SUM/DMO execution. Validation: After conversion in a sandbox, run SU25 2a/2b to reconcile standard proposals with customer modifications without profile-generation failures.

## Q53: During an S/4HANA Brownfield conversion, users report widespread missing access errors despite keeping legacy PFCG roles. How do you remediate?

I would treat retained ECC roles as a starting inventory, not as an S/4 authorization model.

Decision: Drive SU25 post-upgrade reconciliation and replace obsolete T-codes with S/4 transactions or OData apps. Mechanism: Complete SU25 merge and affected-role identification, apply PRGN_CORR2 / simplification replacements (for example FD01/FK01 → BP), then fix missing S_SERVICE and S_TABU_NAM through STAUTHTRACE-backed SU24 updates. Governance: Mandate regeneration of single and derived roles after merge. Validation: Re-run Access Control ARA so merged authorizations do not introduce unmitigated SoD.

## Q54: In a Greenfield S/4HANA deployment, how do you architect Fiori security using Spaces and Pages without creating role explosion?

I would separate Launchpad layout from backend enforcement so Spaces do not multiply technical roles.

Decision: Decouple UI presentation from functional authorizations using Technical and Business Catalogs. Mechanism: Keep tiles and target mappings in Technical Catalogs, consume them through Business Catalogs, bind Business Catalogs into Pages inside Spaces, and assign Business Catalogs plus Spaces on PFCG roles together with backend S_SERVICE. Governance: Prefer one Space per business role domain; never assign raw Technical Catalogs to end users. Validation: Use Launchpad content tools such as /UI2/FLPCM_CUST (release-dependent) to clear mapping errors and keep role size maintainable.

## Q55: A client migrating Brownfield wants to know if their existing ECC GRC 10.1 Access Control ruleset can be re-used in S/4HANA 2023. How do you advise?

I would advise upgrade-and-remediate, not lift-and-shift of an ECC Access Control ruleset into S/4HANA.

Decision: Treat legacy ECC functions as invalid once T-codes and OData services change. Mechanism: Import current S/4-compatible ruleset content, replace obsolete actions with S/4 transactions and service-level checks, and map OData exposure through S_SERVICE in ARA functions. Governance: Put ruleset change under formal change control with risk owners. Validation: Compare ARA results in a dual ECC/S/4 sandbox before cutover. This is Access Control ARA—not Process Control and not IAG Rule Setup.

## Q56: How do you design an ARM MSMP workflow in Greenfield to route access requests dynamically based on cross-system SoD risk results?

I would keep risk-aware routing inside Access Control ARM/MSMP/BRF+, not in IAG RequestTypeRule.

Decision: Use inline ARA results to drive MSMP path selection. Mechanism: Configure process SAP_GRAC_ACCESS_REQUEST, maintain BRF+ initiator/routing against risk analysis results, send high/critical conflicts to a risk-owner path and clean requests to a shorter manager path. Governance: Require mitigation before final approval on high-risk paths. Validation: Submit known-conflict and clean requests and prove path selection in Request Status / Instance Status. Do not describe this as IAG PAM or Process Control.

## Q57: In a hybrid Brownfield landscape, GRC ARA performance degrades significantly during full risk analysis sync jobs. How do you optimize execution?

I would optimize Access Control repository and analysis scope before blaming the ruleset design.

Decision: Prefer incremental sync and scoped connector groups over full daytime runs. Mechanism: Schedule incremental authorization sync jobs, keep connector groups purposeful, maintain indexes on high-volume GRC tables such as GRACUSERCONN, and limit batch ARA to active groups. Governance: Restrict heavy ARA windows to non-business hours with operational SLAs. Validation: Compare SM37 runtimes before and after the change.

## Q58: During Greenfield testing, users are unable to access Fiori apps due to missing CDS View DCL permissions, but SU53 shows no authorization errors. How do you fix this?

I would not stop at SU53 when Fiori returns empty data with clean checks.

Decision: Treat CDS DCL as database-layer row filtering bound to PFCG aspects. Mechanism: Use SACM_TRACE or ST05 to see which aspect values filtered rows, then add the missing object/field values to the backend role. Governance: Capture DCL dependencies during catalog design. Validation: Re-run SACM_TRACE and confirm expected rows return. This is S/4 authorization—not IAG and not Process Control.

## Q59: In a Brownfield conversion, how do you handle custom Z-transactions that contain hardcoded authority checks that fail in S/4HANA?

I would bring custom checks back under SU24 discipline rather than patching PFCG manually forever.

Decision: Refactor hardcoded checks to standard or governed custom objects with Check/Maintain proposals. Mechanism: Scan with ATC security variants, replace brittle AUTHORITY-CHECK patterns, and maintain SU24 for the Z-transaction. Governance: Block transports that fail ATC authorization gates. Validation: Prove the Z-transaction under a restricted test user after proposal re-read.

## Q60: How do you configure EAM (Firefighter) in S/4HANA Greenfield for central Fiori Launchpad usage?

I would choose Role-Based firefighting when Fiori/web channels must keep actions under the user's own ID.

Decision: Prefer Role-Based EAM for Launchpad-centric landscapes; keep ID-Based for classic GUI plug-in cases where that model is required. Mechanism: Build firefighter roles on the target, enable Role-Based EAM in Access Control, and provision temporarily through ARM after approval. Governance: Require controller log review within a defined window after session end. Validation: Complete a firefighter session from Launchpad and confirm GRAC_SPM_LOG_SYNC / consolidated log evidence. This is Access Control EAM—not IAG PAM.

## Q61: During a Brownfield project, legacy user accounts have massive accumulated roles containing broad S_TABU_DIS values (&NC&). How do you remediate without breaking operations?

I would remediate table access with precision before cutting production change rights.

Decision: Replace &NC& breadth with authorization groups and S_TABU_NAM where table-specific access is justified. Mechanism: Assign groups in SE54/TBRG, remove &NC& from business roles, and drive S_TABU_NAM through SU24. Governance: Block DICBERCLS = &NC& via transport checks. Validation: Confirm ARA and operational tests no longer show blanket table-group risk while required maintenance still works.

## Q62: A client on Greenfield S/4HANA Cloud Private Edition wants to integrate GRC 12.0 with SAP SuccessFactors and Ariba. How do you architect the governance framework?

I would describe a Bridge topology: Access Control for ABAP targets, IAG for supported cloud apps, with a documented sync path—not a single merged product.

Decision: Use GRC 12.0 with IAG Bridge for hybrid cloud governance. Mechanism: Establish connectivity (Cloud Connector / IPS as designed for the landscape), synchronize SF/Ariba identities and entitlements into IAG, and call IAG from ARM when cross-system analysis is required. Governance: One approval policy spanning on-premise and SaaS, with clear owners per plane. Validation: Request an S/4 plus Ariba combination in ARM and prove IAG cross-system analysis before provision. Keep MSMP/BRF+ on Access Control separate from IAG workflow rules.

## Q63: In an S/4HANA Greenfield deployment, how do you handle security for Key User Adaptations made in Fiori?

I would treat UI adaptation as controlled development, not a production convenience feature.

Decision: Isolate adaptation to a Key User role and transport adaptations through the landscape. Mechanism: Restrict S_UI_FLEX_A and related develop/adaptation objects (confirm release objects such as UIAD) to named roles; disable broad runtime adaptation in Production. Governance: Separate Key Users from standard business users. Validation: Prove Adapt UI is absent for normal users and present only after transported content.

## Q64: During Brownfield UAT, users report performance slowdowns when launching Fiori tiles. How do you isolate if security is causing the bottleneck?

I would separate Gateway/OData failures from genuine authorization fallback noise.

Decision: Trace Gateway errors, service activation, and user buffer behavior before redesigning roles. Mechanism: Inspect /IWFND/ERROR_LOG and traces, check S_SERVICE and catalog/chip checks, and confirm SU24 declares required services so the system is not repeatedly probing. Governance: Keep SU24 proposals complete for OData endpoints. Validation: Compare launch times before and after fixing proposal mismatches.

## Q65: How do you configure Business Role Management (BRM) in Greenfield to support multi-landscape derived role generation automatically?

I would use BRM to govern business-to-technical mapping and org derivation—not to replace PFCG design entirely.

Decision: Maintain master/derived structures and org-level maps in Access Control BRM. Mechanism: Define master single-role content, map org values to derived variants, and generate across linked landscapes. Governance: Prefer BRM as the role lifecycle entry point; lock uncontrolled Production PFCG edits. Validation: Confirm derived roles carry expected org fields and that ARM requests still provision the intended technical set. BRM is not IAG Role Designer.

## Q66: An auditor flags that legacy Emergency Access Management (EAM) logs in a Brownfield system lack execution details for Web Dynpro and Fiori actions. How do you resolve this?

I would fix the logging channel to match the UI, not invent missing GUI STAT records for Fiori.

Decision: Move web/Fiori firefighter usage to Role-Based EAM and strengthen Security Audit Log / related capture for HTTP/OData events. Mechanism: Activate Role-Based firefighting, configure RSAU_CONFIG for relevant events, and reconcile session windows with GRC firefighter reporting tables such as GRACFFREPLOG. Governance: Require logging for administrative web and OData executions. Validation: Complete a web firefighter test and prove consolidated log completeness.

## Q67: In Greenfield S/4HANA, how do you design least-privilege security for RFC communication users connecting third-party systems?

I would build RFC roles from observed calls, not from S_RFC = *.

Decision: Restrict S_RFC to required function groups and add S_TABU_NAM only where table access is proven. Mechanism: Trace the interface with STAUTHTRACE, craft the role from exact modules/groups, and use S_RFCACL only for trusted RFC scenarios. Governance: Review technical users annually. Validation: Prove RC=0 for intended calls and blocks for out-of-scope modules. Consider UCON as an additional whitelist layer when in scope.

## Q68: How do you handle custom authorization object design in Greenfield ABAP Cloud / Steampunk extensibility?

I would keep cloud extensibility on Clean Core contracts and RAP/CDS authorization patterns.

Decision: Prefer CDS access control and RAP authorization implementation classes over classic free-form checks. Mechanism: Define objects in developer extensibility, bind checks in RAP behavior (global/instance authorization methods), and use DCL where row filtering belongs. Governance: Require C1-released API usage. Validation: ABAP Unit tests that prove allow and deny paths under user context.

## Q69: During a Brownfield system conversion, how do you handle custom table display transactions that bypass SAP authorization checks?

I would close the bypass with explicit S_TABU_NAM (or grouped S_TABU_DIS) checks and SU24 proposals.

Decision: Re-encapsulate custom display paths with AUTHORITY-CHECK. Mechanism: Find SE16/SE16N-style shortcuts in custom code, add S_TABU_NAM checks for named tables, and maintain SU24 for the Z-transaction. Governance: Ban generic table viewers for operational users in Production. Validation: Restricted users fail on unauthorized tables through the custom transaction.

## Q70: How do you design an ARM End-User Provisioning (EUP) configuration in Greenfield to reduce user entry errors during access requests?

I would use EUP to shape the form—not to replace initiator or connector design.

Decision: Bind mandatory/hidden/read-only fields to request types via EUP profiles. Mechanism: Maintain EUP in Access Request customizing and select profiles with BRF+ where requester context differs. Governance: Align HR/IdP attributes with ARM master data. Validation: Submit requests from different departments and confirm form constraints. EUP is Access Control ARM—not IAG.

## Q71: In an S/4HANA Greenfield project, how do you secure access to sensitive analytical dashboards created in Embedded Analytics / SAC?

I would enforce row security at the CDS/DCL or SAC model layer appropriate to the stack—not only at the tile.

Decision: Bind analytical CDS views to PFCG aspects and restrict query execution services. Mechanism: Maintain DCL on underlying views, grant required service and analytic authorizations for the release, and place tiles in the correct Business Catalogs. For SAC live/import models, apply SAC role and model security separately from S/4 PFCG. Governance: Business-owner sign-off on visibility criteria. Validation: Two users with different org assignments see different row sets.

## Q72: During Brownfield migration, GRC ARA identifies thousands of legacy SoD conflicts. How do you prioritize remediation efforts?

I would run a Get Clean program by severity and root cause—not by ticket volume.

Decision: Clear Critical/High financial and operational conflicts first. Mechanism: Segment role-level versus user-level violations, retire obsolete roles, redesign intra-role conflicts, and reserve mitigating controls for justified residual risk. Governance: Steering committee timeline and explicit risk acceptance. Validation: Post-remediation ARA shows measurable reduction with evidence retained. Mitigation lives in Access Control ARA; Process Control CCM is separate if used as compensating monitoring.

## Q73: How do you configure UCON (Unified Connectivity) in S/4HANA Greenfield to prevent unauthorized remote execution of RFC function modules?

I would treat UCON as a kernel whitelist on top of S_RFC, not a replacement for role design.

Decision: Run logging → communication assembly → block mode. Mechanism: Enable UCON logging (SCON / release tools), build assemblies from observed legitimate modules, then activate blocking for undeclared calls. Governance: Change-control additions to assemblies. Validation: Prove an unapproved remote module is blocked.

## Q74: In a Brownfield S/4HANA conversion, how do you remediate roles that contain full-authorization (`*`) values in critical authorization objects?

I would replace wildcards with SU24-grounded least privilege.

Decision: Remove * in sensitive objects such as S_TABU_DIS, S_PROGRAM, S_USER_GRP, and S_DEVELOP unless a justified admin role owns them. Mechanism: Find wildcards with SUIM, confirm real usage with STAUTHTRACE, update SU24, and regenerate. Governance: BRM or transport gates that block critical wildcards. Validation: SUIM confirms Production roles no longer carry those wildcards.

## Q75: How do you architect Identity Lifecycle Management when integrating S/4HANA, GRC ARM, and an external IdP (e.g., Azure AD)?

I would keep identity, authentication, authorization governance, and target enforcement on separate planes.

Decision: Corporate IdP as identity source, IAS for authentication/federation where used, IPS for provisioning transforms, Access Control ARM for SAP access approval, and PFCG/target roles for enforcement. Mechanism: Joiner sync creates or updates the identity; ARM requests and MSMP approvals drive SAP role assignment; IPS or connectors provision targets; leaver events lock or deprovision. Governance: Automated leaver propagation with evidence. Validation: End-to-end JML test across IdP, IAS/IPS, ARM, and S/4. Do not assign IAG the job of IAS MFA or IPS transforms.

## Q76: During Greenfield S/4HANA testing, business users report that Fiori search results (Enterprise Search) display unauthorized business data. How do you fix this?

I would secure search models with the same business objects and DCL that protect transactional access.

Decision: Treat Enterprise Search as another consumer of authorization, not a public index. Mechanism: Identify the ESH connector/model, grant only required search admin/execution objects to admins, and ensure business objects and CDS DCL filter search results. Governance: Validate search security with Launchpad content design. Validation: Restricted users see only authorized hits.

## Q77: In a Brownfield conversion, how do you handle security for background system jobs (`BTC` users) running deprecated T-codes?

I would update job steps and job-user roles together against the Simplification List.

Decision: Replace deprecated programs/T-codes in SM37 definitions and refresh Type B user roles. Mechanism: Inventory TBTCJOB/SM37 jobs, map steps to S/4 replacements, update authorizations via SU24, and keep dialog users out of batch identities. Governance: Dedicated background users with scoped roles. Validation: Quality job runs complete without authorization failures.

## Q78: How do you establish an effective User Access Review (UAR) process in GRC 12.0 post-Greenfield go-live?

I would run UAR as Access Control certification—not as IAG Certification Review and not as SoD risk review alone.

Decision: Schedule manager-driven UAR campaigns with MSMP process SAP_GRAC_USER_ACCESS_REVIEW. Mechanism: Use GRAC_UAR_SCHEDULE, route to managers, and enable auto-removal where policy allows. Governance: Mandatory completion window for audit. Validation: Campaign dashboards and backend role removals for revoked lines. SoD Review remains a separate risk-focused campaign.

## Q79: How do you design security for SAP BTP (Business Technology Platform) extensions connecting to an S/4HANA backend?

I would use principal propagation so backend PFCG/DCL still evaluate the end user.

Decision: Prefer PrincipalPropagation destinations through Cloud Connector over shared technical users for user-driven apps. Mechanism: Establish trust (for example X.509) between Cloud Connector and S/4, configure the BTP destination accordingly, and keep IAS authentication separate from S/4 authorization. Governance: Ban generic service accounts for interactive user flows. Validation: STAUTHTRACE/ST01 shows the named user, not a technical alias.

## Q80: In a Brownfield S/4HANA project, how do you remediate custom roles where standard authorization objects were manually inserted into PFCG?

I would eliminate manual red-status insertions by repairing SU24 and re-reading proposals.

Decision: SU24 is the durable proposal source; PFCG manual inserts are technical debt. Mechanism: Identify manual objects, set Check/Maintain in SU24, remove manual inserts, re-read, and regenerate. Governance: Ban unreviewed manual inserts. Validation: PFCG shows a clean authorization status without manual overrides.

## Q81: How do you design an emergency access strategy for S/4HANA Cloud Public Edition where standard GRC EAM (Firefighter) is unavailable?

I would use IAG Privileged Access Management (or an approved enterprise PAM) for Public Edition break-glass—not Access Control Firefighter IDs.

Decision: Time-box elevated Public Edition business roles through IAG PAM. Mechanism: Configure PAM request/approval, temporary elevated role assignment via the identity plane, and automatic expiry with audit evidence. Governance: CISO/security post-review for every invocation. Validation: Prove grant, elevated action, and automatic revocation. Do not claim PFCG Firefighter ID sessions on Public Edition.

## Q82: How do you handle authorization troubleshooting during Greenfield UAT when users experience intermittent HTTP 403 errors in Fiori?

I would separate ICF/service activation defects from missing S_SERVICE values.

Decision: Verify SICF, /IWFND/MAINT_SERVICE registration, Gateway error log, then backend S_SERVICE hashes/names for the release. Mechanism: Fix inactive nodes or missing role proposals before redesigning business objects. Governance: Include service activation checks in transport verification. Validation: Browser network shows HTTP 200 for the OData calls after remediation.

## Q83: How do you configure GRC ARA to perform cross-system SoD risk analysis between S/4HANA and SAP SuccessFactors?

I would use the IAG Bridge pattern so Access Control ARA can evaluate ABAP plus cloud entitlements without pretending SF RBP is PFCG.

Decision: Synchronize SuccessFactors permissions into IAG and evaluate cross-system risks through the Bridge with Access Control. Mechanism: Connect GRC 12.0 to IAG, sync SF entitlements, and define cross-system functions/risks combining S/4 actions with SF permission IDs. Governance: Joint ERP/HR risk matrix ownership. Validation: A test user with conflicting Finance and Payroll entitlements produces the expected cross-system hit.

## Q84: In a Brownfield conversion, how do you handle custom authorization checks in legacy Z-reports that fail due to table structure changes in S/4HANA?

I would adapt SQL to compatibility/CDS views while preserving AUTHORITY-CHECK semantics.

Decision: Point custom reports at supported S/4 views and keep checks on valid fields. Mechanism: Replace obsolete table access (for example classic FI tables) with released views such as compatibility views where applicable, adjust field mapping, and update SU24. Governance: ATC sign-off before transport. Validation: Restricted profiles still deny unauthorized data after the rewrite.

## Q85: How do you enforce Separation of Duties (SoD) within the SAP Security administration team itself?

I would split role design, user administration, and ruleset administration as distinct duties.

Decision: Role developers maintain PFCG content without SU01 assignment rights; user admins assign without redesigning roles; compliance owns Access Control ruleset maintenance. Mechanism: Separate admin roles accordingly and monitor with ARA critical-access risks. Governance: Independent annual review of security-team access. Validation: ARA against security team IDs shows no critical intra-team conflicts.

## Q86: During Greenfield S/4HANA implementation, how do you handle security for SAP Fiori custom analytical apps built using Core Data Services (CDS)?

I would ship DCL with every custom analytical CDS view before QA.

Decision: Bind GRANT SELECT conditions to PFCG aspects for org and activity fields. Mechanism: Create DCL beside the view, reference the same objects used in transactional apps, and assign matching PFCG values. Governance: No custom CDS to QA without DCL. Validation: Multiple users see filtered analytical rows consistent with their profiles.

## Q87: In a Brownfield migration, how do you manage transport migration of security roles to avoid overwriting Production authorization data?

I would transport role definitions carefully and keep user assignments and local org derivation under control.

Decision: Move role content without blindly transporting Production user assignments. Mechanism: Use PFCG transport utilities that exclude unwanted assignment data, preserve target org-level practices, and regenerate derived roles where maps differ. Governance: Lock Production changeability for ad-hoc role edits. Validation: Transport logs show structure updates without unintended AGR_USERS overwrite.

## Q88: How do you secure SAP GUI for HTML (WebGUI) applications in an S/4HANA Greenfield landscape?

I would treat WebGUI as another authenticated channel into the same PFCG model.

Decision: Activate and protect ITS/WebGUI ICF services and require SSO. Mechanism: Secure /sap/bc/gui/sap/its/webgui, grant only required S_SERVICE/S_WEBGUI (confirm release objects), keep transaction access in PFCG, and authenticate via IAS/SAML. Governance: No anonymous HTTP to WebGUI. Validation: Launch via Launchpad with SSO and prove role-restricted transactions.

## Q89: How do you configure Continuous Control Monitoring (CCM) in SAP Process Control to compensate for unmitigated SoD risks in GRC Access Control?

I would keep Process Control CCM as monitoring evidence linked to Access Control mitigation—not as a substitute for role remediation.

Decision: Build automated PC monitoring for residual SoD exceptions and reference that control as a mitigating control in ARA where policy allows. Mechanism: Define automated monitoring rules against transactional evidence (for example create-versus-pay patterns), assign control owners, and link Control IDs into Access Control mitigation. Governance: Quarterly audit review of CCM exceptions. Validation: Inject a test conflict and prove PC issue routing. Do not configure this inside IAG or MSMP.

## Q90: During Brownfield conversion, how do you handle custom roles that contain obsolete HR authorization objects (e.g., `P_ORGIN`)?

I would redesign HCM access for the Business Partner model without inventing SF RBP as structural authorization.

Decision: Reassess whether P_ORGIN/P_ORGINCON still apply and add BP-related objects where BP master data replaced classic HR transactions. Mechanism: Align SU24 with BP objects such as B_BUPA_* where used, retain structural profiles only for on-premise HCM that still requires them, and regenerate roles. Governance: Synchronize with the HCM conversion workstream. Validation: HR users access converted BP data without ST22 authorization dumps. SuccessFactors RBP remains a separate cloud model.

## Q91: How do you design least-privilege access for SAP S/4HANA Migration Cockpit (`LTMC` / `F1359`) during data migration phases?

I would time-box migration roles and log Production cutover activity.

Decision: Dedicated migration roles active only during cutover windows. Mechanism: Grant migration cockpit objects (confirm release names such as CNV_DMC_* / related DMCC objects on the system) with least activity values and object-scope limits; remove after cutover. Governance: Prefer Firefighter/EAM logging for Production migration execution. Validation: Post-cutover users cannot run migration loads.

## Q92: How do you remediate missing authorization issues caused by custom Fiori tiles invoking backend OData services via alias routes?

I would authorize the technical service the Gateway actually checks, including aliases.

Decision: Align SU24 and PFCG with the registered service and alias. Mechanism: Identify the service in /IWFND/MAINT_SERVICE, maintain IWSG/IWSV (or V4 equivalents) proposals, re-read into the role, and regenerate. Governance: Document alias-to-service mapping with catalog design. Validation: Tile launches without HTTP 403 on the OData call.

## Q93: How do you enforce dynamic Data Masking for sensitive PII data fields in Greenfield S/4HANA?

I would mask at UI/policy layer without claiming database values changed.

Decision: Use UI Data Protection Masking (or the landscape's approved masking product) bound to an unmask authorization. Mechanism: Define field rules, bind to a dedicated object (for example Z_PII_UNMASK), and leave storage unaltered. Governance: Privacy officer approval for unmask grants. Validation: Authorized users see clear values; others see masked display.

## Q94: In a Brownfield conversion, how do you handle legacy batch input session (`SM35`) authorizations that fail in S/4HANA?

I would migrate BDC paths to BAPI/OData/API integrations secured by standard objects.

Decision: Prefer Clean Core APIs over standing SM35 dependence. Mechanism: Inventory BDC generators, replace with BAPIs where possible, and if SM35 remains transitional, scope S_BDC_MON/S_BDC_SMON (confirm object names on system) tightly. Governance: Phase-out plan for BDC. Validation: Converted API paths complete with clean authorization evidence.

## Q95: How do you secure SAP Fiori Launchpad Search (Enterprise Search) configuration tools in Greenfield?

I would keep ESH administration with Basis/security architects, not business users.

Decision: Restrict ESH_COCKPIT and admin objects such as S_ESH_ADM / related develop rights. Mechanism: Separate search-model maintenance roles from end-user search execution. Governance: Change control for Production search model changes. Validation: Non-admins cannot open cockpit or alter indexes.

## Q96: How do you handle emergency access log review workflow routing when the designated EAM Controller is absent?

I would configure Access Control MSMP escalation for the EAM log review process—not IAG.

Decision: Primary and alternate controllers with timed escalation. Mechanism: In MSMP process SAP_GRAC_CONTROL_LOG_REVIEW (confirm exact process ID on the GRC release; commonly the EAM log review workflow), set stage escalation so overdue reviews route to the alternate or compliance owner. Governance: Every firefighter ID has primary and secondary controllers. Validation: Age a test review past the timeout and prove re-route. Keep this separate from ARM access-request MSMP.

## Q97: In an S/4HANA Greenfield deployment, how do you secure access to custom SAP Fiori analytical reports built on Core Data Services (CDS) with parameter inputs?

I would bind both parameters and rows to PFCG so OData callers cannot bypass filters.

Decision: Use CDS security annotations and DCL aspects together. Mechanism: Bind parameters with consumption/security annotations where supported, enforce ASPECT pfcg_auth in DCL, and assign matching roles. Governance: Prove direct SQL/OData cannot bypass parameter controls. Validation: Unauthorized parameters fail; authorized parameters return only permitted rows.

## Q98: During a Brownfield project, how do you remediate legacy roles containing broad `S_DEVELOP` access in Production?

I would treat Production S_DEVELOP as a standing incident until removed.

Decision: Strip S_DEVELOP from business roles and lock development tools in Production clients. Mechanism: SUIM to find grants, remove from roles, enforce SCC4 change settings, and deploy only via transport. Governance: Model S_DEVELOP as a critical permission in Access Control ARA with alerting. Validation: Production ARA shows elimination of S_DEVELOP violations.

## Q99: How do you configure SAP Cloud Identity Services (IAS/IPS) to enforce Multi-Factor Authentication (MFA) dynamically for high-risk SAP Fiori apps?

I would put adaptive MFA in IAS authentication policy—not in PFCG and not in IAG.

Decision: Risk-based or application-sensitive authentication rules in IAS. Mechanism: Standard apps may allow SSO; sensitive apps (for example payment apps) require MFA via the corporate authenticator. IPS remains provisioning; Access Control remains authorization governance. Governance: Align with Zero Trust policy. Validation: Sensitive tile triggers MFA; standard tile does not.

## Q100: How do you demonstrate overall SAP Security and GRC compliance readiness to executive auditors prior to S/4HANA Go-Live?

I would present evidence packages by control domain—not a slide claim of zero risk.

Decision: Combine ARA residual-risk posture, UAR completion, SU25/SU24 baseline proof, and EAM review evidence. Mechanism: Show Critical/High unmitigated counts with mitigation files, UAR closure metrics, SU25 completion logs, and firefighter review tracking; separate Process Control evidence if CCM is in scope. Governance: CISO and Internal Audit sign-off before cutover. Validation: Interactive dashboards that auditors can sample back to requests, risks, and role transports. Do not invent metrics or customer outcomes.
