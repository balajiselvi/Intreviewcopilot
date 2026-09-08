# Identity and Access Control Planes

## Overview

A Principal Architect separates five planes. Mixing them is the fastest way to fail a Head of SAP Security interview.

| Plane | Typical product | Responsibility |
|---|---|---|
| Identity source | SuccessFactors / HR | Employment status, org, job, company code, manager |
| Authentication | IAS / corporate IdP | Who the user is: federation, MFA, SSO, session, trust |
| Provisioning | IPS / SAP IDM | Create/update/disable accounts and assignments from source to target |
| Governance | IAG / GRC AC | Whether access is appropriate: request, SoD, certification, PAM |
| Enforcement | Target application | What the user can execute: PFCG, SF RBP, RSECADMIN, XSUAA role collections, Ariba groups |

## Interview Summary

Identity source is not authentication. Authentication is not provisioning. Provisioning is not approval. Approval is not enforcement. BTP role collections live on XSUAA in the subaccount, not in IAS. SoD lives in IAG Access Analysis or GRC ARA, not in IPS transformations.

## 30 Second Interview Answer

I would design IAM as a chain: HR records the business event, the identity layer authenticates, the provisioning layer writes accounts, governance decides whether a risky role is allowed, and the application enforces the resulting authorization. IAS never hosts S/4 roles. IPS never signs off SoD. IAG never replaces PFCG.

## 60 Second Interview Answer

For a joiner, mover, or leaver the sequence is:

1. HR trigger and attribute change in SuccessFactors.
2. Correlation so one person is not two user IDs.
3. IPS transformation maps attributes to target fields and assignment payloads.
4. Birthright or business-role mapping — derived roles for org change, not a new master role per plant.
5. SoD simulation in IAG or GRC when the role is risk-relevant.
6. Approval on Access Request / MSMP — business owner plus security where policy requires it.
7. Provisioning to the target (SU01/PFCG assignment, BTP role collection, Ariba group).
8. Deprovisioning of obsolete access on movers and leavers.
9. Certification later; Firefighter/PAM for break-glass; audit trail on every hop.

## Banned conflations

- IAS issues tokens and applies authentication policy. It does not assign AGR_USERS, role collections, or Ariba purchasing groups.
- IPS JSON transformations can default a role name. They do not replace Access Analysis.
- IAG users authenticate through IAS to use IAG. That does not make IAS the landscape authorization service.
- Cloud Connector principal propagation carries the authenticated identity to on-prem. It does not grant PFCG objects.

## Related Topics

- knowledge/idm/idm-provisioning.md
- knowledge/btp/ias.md
- knowledge/btp/ips.md
- knowledge/iag/iag-overview.md
- knowledge/security/role-design.md
