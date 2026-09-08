# Role and Access Cutover

## Overview

Security cutover is the controlled move of users, roles, and identity jobs into production. Success is measured by expected access working, unexpected access absent, emergency access logged, and a documented rollback. SU53 is a defect diagnostic, not a cutover exit criterion.

## Interview Summary

Before go-live: freeze design, generate profiles, run PFUD/user comparison for existing assignments, reconcile AGR_USERS to the approved matrix, smoke-test critical business roles, confirm IPS/IAG/GRC jobs, and stage Firefighter IDs with owners and controllers.

At cutover: transport sequence, user status, birthright jobs, IdP/IAS trust, Cloud Connector if hybrid.

After: SUIM expected-vs-actual samples, UAT evidence from process owners, FF log review, IPS error queue, rollback transports or assignment restore if a wave fails.

## 30 Second Interview Answer

I would treat role cutover as a production event: approved matrix, generated roles, user comparison so existing users actually receive the new profile, smoke tests on critical processes, Firefighter ready with logging, and a rollback assignment list. I would not sign off cutover because one SU53 looked clean.

## 60 Second Interview Answer

Validation pack: SUIM user-role and auth-object reports against the gold matrix; sample positive tests (can post) and negative tests (must fail); Fiori catalog/space visibility; IPS delta job for joiners created on cutover weekend; GRC/IAG request queue empty of blockers.

Emergency path: ID-based Firefighter via GRAC_SPM or IAG PAM, reason code tied to a ticket, controller review next business day. No unlogged SAP_ALL.

Rollback: keep the prior assignment extract; do not "fix" by widening a shared composite used by thousands of users.

## Related Topics

- knowledge/hypercare/hypercare.md
- knowledge/grc/firefighter.md
- knowledge/security/role-rationalization.md
