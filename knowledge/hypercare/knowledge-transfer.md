# Security Knowledge Transfer into BAU

## Overview

Knowledge transfer after hypercare hands a stable operating model to BAU support. The transfer covers how to triage access defects, when to use Firefighter, which reports prove expected access, and which defects require a design change instead of a local fix. Source checked 2026-10-21 against knowledge/hypercare/hypercare.md.

## Interview Summary

I would transfer the evidence path, not only a contact list: gold matrix, SUIM or business-role checks, IPS queues, Firefighter review, and escalation criteria.

## Hand over the security operating model after hypercare

I would document the severity model, owners, and the difference between a logged emergency-access session and a permanent role change. I would leave BAU with the approved assignment matrix, the reports used to compare expected versus actual access, the IPS or IAG queue checks, the Firefighter controller review steps, and the criteria for escalating a catalog or SoD redesign. I would walk a sample missing-app case and a sample authorization-failure case using the correct deployment tools, then confirm BAU can reproduce those checks without the project team. I would not transfer unlogged production widenings as normal support practice.

## Sources and scope

- knowledge/hypercare/hypercare.md
- knowledge/project-management/senior-consultant-delivery.md for mentoring and handover behaviour
