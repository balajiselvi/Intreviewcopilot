# Authorization Error Diagnosis

## Overview

Authorization troubleshooting is isolation, not a list of transactions. The symptom tells you which layer to test. A missing Fiori tile is not SU53. A BW empty result is not ST01. A BTP 403 is not PFCG.

## Interview Summary

Start from the symptom and the product. Confirm identity, then the application, then the check that failed. Collect evidence that distinguishes missing assignment, failed object check, failed analysis authorization, failed OData service, or failed token/role collection. Fix the root layer, then prevent by correcting SU24, catalogs, or provisioning mappings.

## SU53: What It Shows and What It Does Not Prove

In an ABAP system, transaction SU53 displays recent failed authorization checks for the user, including the authorization object and checked values. Use it immediately after reproducing an authorization denial; another later failed check can replace the evidence, and the retained history is bounded. SU53 is diagnostic evidence for a failed check, not a simulation or proof that a role grants successful access. If SU53 reports that the checks shown were successful, that means the reported problem is not explained by those authorization checks; it does not prove that the user completed the business action. Validate access by having the assigned user perform the intended transaction or application action. If SU53 does not capture the failure, use the applicable authorization trace while reproducing it.

Source checked 2026-10-17: [SAP Learning, Troubleshooting Authorization Checks](https://learning.sap.com/courses/exploring-the-authorization-concept-for-sap-s-4hana-and-sap-business-suite/troubleshouting-authorization-checks); [SAP Learning, Evaluate Users and Authorizations](https://learning.sap.com/courses/technical-implementation-and-operation-i-of-sap-s-4hana-and-sap-business-suite/evaluate-users-and-authorizations). Applies to ABAP authorization troubleshooting; it does not apply to S/4HANA Cloud Public Edition, where SAP GUI transactions are not customer administration tools.

## 30 Second Interview Answer

I would not open PFCG first. I would ask what the user saw: no tile, dump, “not authorized,” empty report, or login failure. Login is authentication. Empty BW data is often analysis authorization. A GUI error with an object name is a classic AUTHORITY-CHECK. Then I pick the matching evidence path — STAUTHTRACE or SU53 on ABAP, RSECADMIN on BW, IdP/IAS logs on SSO, BTP cockpit logs on role collections.

## 60 Second Interview Answer

Scope: one user or many, one app or many, since when, production or a specific client.

Identity: is this the same correlated user, or a duplicate account from a mover.

Evidence: for ABAP, a current STAUTHTRACE filtered to the user beats an old SU53 that another transaction overwrote. For Fiori, decide tile versus service. For GRC, distinguish request not provisioning versus SoD blocking the request.

Root cause is usually one of: role not assigned, generated profile outdated, org values too tight, SU24 missing for a custom T-code or service, derived role org mismatch, or analysis authorization characteristic not in the provider.

Remediation is the smallest change that is still correct — not SAP_ALL, not copying a fat role. Prevention is SU24, naming, and provisioning mapping so the next mover does not recreate the ticket.

## Diagnostic Split

- Cannot log on: IAS, IdP, user lock, password, SSO certificate
- No Fiori tile/app: launchpad resolution for that deployment. Public Edition 2608: search App Finder/All My Apps first; it lists apps available for the user's role, while pages are an administrator-selected subset. If present in App Finder, check space/page assignment and content in Manage Launchpad Spaces and Manage Launchpad Pages. If absent, use Maintain Business Users, then Maintain Business Roles and IAM Information System to check the assigned business role, catalog or IAM app assignment, and activation. Do not use authorization traces or ABAP transactions for an app that never appears. Source checked 2026-10-15 against SAP Help Portal, SAP Fiori Launchpad for SAP S/4HANA Cloud Public Edition 2608: App Finder and Spaces and Pages.
- Tile opens, request fails: classify by deployment. Public Edition: reproduce and use Display Authorization Trace for authorization evidence; if the trace does not identify an authorization failure, use tenant-available application logs or escalate service/activation issues to SAP. Private Edition/on-premise ABAP Gateway: use /IWFND/ERROR_LOG on the hub and /IWBEP/ERROR_LOG on the backend; use the HTTP status and error text to distinguish authorization from provider/service failure. Then use an ABAP authorization trace only when the evidence indicates an authorization check. /IWFND/MAINT_SERVICE is registration/activation, not an error log. Do not name an authorization object the trace did not return.
- GUI “you are not authorized”: object/field/org
- Query runs, no rows in BW: analysis authorization or data
- Access request approved, still no access: provisioning connector or user mapping

## Related Topics

- knowledge/security/pfcg.md
- knowledge/fiori/fiori-security.md
- knowledge/bw/analysis-authorizations.md
- knowledge/btp/ias.md
