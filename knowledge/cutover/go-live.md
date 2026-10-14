# Go-Live Access Stabilization

## Overview

Go-live for SAP security is the moment authentication, provisioning, and authorization must work together under real volume. The architect's job is a go/no-go on access risk, not a list of T-codes.

## Interview Summary

Go/no-go checks: IdP/IAS trust valid, critical business roles smoke-tested, Firefighter available, batch and RFC users confirmed, IPS jobs green, SoD mitigations documented, rollback owner named.

First 72 hours: war-room triage by catalog vs org vs provisioning vs data; no casual role clones; daily FF review; defect-to-design feed for wave two.

## 30 Second Interview Answer

At go-live I would confirm that users can execute the processes we promised, that we can break-glass with an audit trail, and that we can reverse a bad wave. Stabilization is incident management plus catalog discipline, not widening roles because the phone is ringing.

## Related Topics

Before go-live, freeze the approved access design, confirm IAS trust, smoke-test the critical business roles, confirm the IPS and IAG or GRC jobs, and name the rollback owner. At cutover, follow the rehearsed runbook: the transport or software-collection sequence, user status, and Cloud Connector when the landscape is hybrid. Hypercare is incident triage with a severity and an owner, not a second design phase. Close emergency access, review the Firefighter log daily, and leave hypercare when the open access backlog has an owner and a service level.

- knowledge/cutover/cutover-plan.md
- knowledge/hypercare/hypercare.md
