# SuccessFactors as HR Source for SAP IAM

## Overview

For this IAM/Security role, SuccessFactors is usually the HR system of record that drives joiner, mover, and leaver — not a full HCM functional encyclopedia. Interview answers should explain how employee attributes become SAP access, and where SuccessFactors role-based permissions sit versus S/4 and BTP authorization.

## Interview Summary

SuccessFactors holds employment status, org assignment, and often job code. IPS can read those attributes and provision IAS, S/4, BTP, or other targets. SuccessFactors also has its own role-based permission (RBP) model for HR data. Those are different control planes. A mover that updates department in SF but does not update S/4 derived-role org values is a mapping failure.

## 30 Second Interview Answer

I would treat SuccessFactors as the typical HR source for identity lifecycle. Joiners and leavers should follow employment status. Movers should follow org and job attributes into business-role mapping. I would still design S/4 authorization in PFCG and governance in IAG or GRC. SuccessFactors RBP protects HR data; it does not replace SoD on finance posting in S/4.

## Architecture Notes

- Source: Employee Central or equivalent employment objects
- Provisioning: IPS source connector, transformation, targets
- SF RBP: permission roles and groups inside SuccessFactors
- Downstream: IAS users, S/4 users, BTP role collections
- Correlation: person ID / user ID mapping must be explicit

## Related Topics

- knowledge/idm/idm-provisioning.md
- knowledge/btp/ips.md
- knowledge/btp/ias.md
