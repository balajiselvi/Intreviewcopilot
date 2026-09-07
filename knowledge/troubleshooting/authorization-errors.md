# Authorization Error Diagnosis

## Overview

Authorization troubleshooting is isolation, not a list of transactions. The symptom tells you which layer to test. A missing Fiori tile is not SU53. A BW empty result is not ST01. A BTP 403 is not PFCG.

## Interview Summary

Start from the symptom and the product. Confirm identity, then the application, then the check that failed. Collect evidence that distinguishes missing assignment, failed object check, failed analysis authorization, failed OData service, or failed token/role collection. Fix the root layer, then prevent by correcting SU24, catalogs, or provisioning mappings.

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
- No Fiori tile: catalog/space assignment
- Tile opens, error: OData/object
- GUI “you are not authorized”: object/field/org
- Query runs, no rows in BW: analysis authorization or data
- Access request approved, still no access: provisioning connector or user mapping

## Related Topics

- knowledge/security/pfcg.md
- knowledge/fiori/fiori-security.md
- knowledge/bw/analysis-authorizations.md
- knowledge/btp/ias.md
