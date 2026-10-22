# Security Cutover Rollback

## Overview

A security rollback plan is the rehearsed way to restore a known-good access state when a cutover wave fails before the business has posted irreversibly in the new system. The plan is assignment extracts, transport sequencing, identity-job freezes, and go/no-go criteria. After users post business documents in a converted or newly live system, a full technical rollback may no longer be available. SU53 is not a rollback trigger and not cutover proof. Source checked 2026-10-21 against the repository cutover and hypercare procedures and SAP Activate cutover discipline already documented in knowledge/cutover/cutover-plan.md.

## Interview Summary

I would keep a rollback pack before go-live: prior AGR_USERS or business-role assignment extract, transport list, identity-job pause points, and Firefighter coverage. I would not promise a full platform reverse after productive posting.

## Prepare and execute a security rollback for a failed cutover wave

I would prepare the rollback before the cutover window. I would freeze further role design, export the approved assignment baseline, list the transports that can be reversed or re-imported, confirm how user status and birthright jobs will be paused, and stage Firefighter IDs with owners and controllers for true blockers. During the wave I would use go/no-go checks on expected access working, unexpected access absent, and identity jobs completing without critical errors. If the wave fails before irreversible business posting, I would restore the prior assignment extract, reverse or withhold the failed transports according to the rehearsed sequence, re-run user comparison or the Public Edition business-role assignment restore for that deployment, and smoke-test critical processes with the restored access. After users have posted in the new or converted system, I would stop claiming a full technical rollback and move to defect containment, logged emergency access, and a forward fix. I would not widen a shared composite as a rollback shortcut, and I would not treat a clean SU53 as evidence that cutover or rollback succeeded.

## Sources and scope

- knowledge/cutover/cutover-plan.md
- knowledge/hypercare/hypercare.md
- knowledge/project-types/brownfield.md and greenfield.md for conversion versus new-implementation rollback limits
- Do not invent ChaRM screen steps. Transport mechanics stay in knowledge/transports/transport-management.md.
