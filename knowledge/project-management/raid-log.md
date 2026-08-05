# SAP RAID Log (Risks, Assumptions, Issues, Dependencies)

## Overview

A RAID log tracks four critical project elements: Risks (things that might go wrong), Assumptions (things we believe to be true), Issues (things that are already wrong), and Dependencies (things this project relies on from others). The RAID log is a living document maintained throughout the project. It surfaces project challenges early, prevents surprises, and helps project teams manage uncertainty and interdependencies.

## Interview Summary

A RAID log documents risks (potential problems), assumptions (beliefs about project conditions), issues (current blockers), and dependencies (external reliances) to enable proactive management.

## 30 Second Interview Answer

A RAID log tracks Risks (what might go wrong—timeline pressure, resource availability), Assumptions (what we believe—data quality, legacy system support), Issues (what's already wrong—resources not available, data quality worse than expected), and Dependencies (things we need from others—infrastructure, data access). The RAID log surfaces problems early so you can address them before they derail the project.

## 60 Second Interview Answer

A RAID log is a tracking document for four project elements. **Risks:** things that might happen (business sponsor unavailable, data quality issues, timeline pressure). Each risk has: description, probability (high/medium/low), impact (high/medium/low), overall severity, and mitigation (who owns it, what's the plan). **Assumptions:** things we believe (data will be available, legacy system will remain operational during parallel run, business will prioritize training). Assumptions should be validated or the project is built on shaky ground. **Issues:** things that are actively blocking (resources delayed, business users not released for testing). Issues need owners and resolution dates. **Dependencies:** things this project needs from outside (infrastructure provisioning, data access, legacy system support). If dependencies aren't met, project is blocked. RAID logs are reviewed weekly during steering committee meetings. New items added, owners assigned, mitigation or resolution tracked.

## 90 Second Interview Answer

A RAID log manages four types of project uncertainty. **Risks (potential future problems):** e.g., "Executive sponsor only available part-time" (probability medium, impact high, severity high). Mitigation: designate alternate decision-maker. **Assumptions (beliefs we're building on):** e.g., "Legacy system will remain operational during parallel run." Critical assumptions should be validated early—if assumption is wrong, project plan breaks. **Issues (current active problems):** e.g., "Data quality assessment underway but results worse than expected" or "Testing resources not released as planned." Issues need owners and resolution dates. **Dependencies (things outside this project):** e.g., "Infrastructure team must provision SAP test system by Week 8" or "Data warehouse team must provide clean customer master data by Week 12." If dependencies aren't met on time, project is blocked. RAID log is maintained throughout project lifecycle. Weekly review identifies new risks, validates assumptions, resolves issues, and tracks dependencies. Risk severity (probability × impact) drives escalation: high-severity risks escalate to steering committee. Assumptions are validated during Discover and Explore phases. Issues are tracked to resolution. Dependencies trigger escalation if owners miss dates.

## Architecture

RAID log architecture includes:

1. **Risks**
   - Description: what might go wrong
   - Probability: low/medium/high likelihood
   - Impact: low/medium/high consequence if happens
   - Severity: probability × impact
   - Mitigation: action to reduce risk
   - Owner: who owns mitigation
   - Status: open/mitigated/closed

2. **Assumptions**
   - Description: what we believe to be true
   - Validation status: validated/unvalidated
   - Validation approach: how to confirm
   - Impact if wrong: what breaks if assumption is false

3. **Issues**
   - Description: what's blocking progress
   - Impact: how does this affect project
   - Owner: who's responsible for resolution
   - Resolution: action to fix
   - Target resolution date

4. **Dependencies**
   - Description: what this project needs from outside
   - Owner: who's responsible for delivering
   - Target date: when it's needed
   - Impact: what's blocked if dependency missed

## Runtime Flow

1. **Project Kickoff**
   - Identify initial risks, assumptions, issues, dependencies
   - Assign owners
   - Create RAID log in tracking system or spreadsheet

2. **Weekly RAID Review**
   - Identify new risks, assumptions, issues, dependencies
   - Update status of existing items
   - Escalate high-severity risks to steering committee
   - Verify assumptions are on track for validation
   - Confirm issue resolution progress
   - Track dependency delivery dates

3. **Steering Committee Meeting**
   - Present high-severity risks and escalation status
   - Discuss issue resolution progress
   - Confirm dependencies on track
   - Make decisions on risk mitigation strategies

4. **Ongoing Management**
   - Risk mitigation activities tracked and reported
   - Assumptions validated or confirmed as risks
   - Issues resolved and closed
   - Dependencies tracked to delivery

5. **Project Close**
   - Lessons learned: which risks materialized, which assumptions were wrong
   - RAID log reviewed for future project planning

## Configuration

RAID log includes:

1. **Risk Register**
   - Risk ID, description, probability, impact, severity, mitigation, owner, status

2. **Assumptions Log**
   - Assumption description, validation approach, status (validated/unvalidated), impact

3. **Issue Log**
   - Issue ID, description, impact, owner, resolution, target date, status

4. **Dependency Log**
   - Dependency ID, description, owner, target date, status, impact if missed

## Implementation Activities

1. **RAID Log Setup**
   - Define tracking format (spreadsheet, project management tool)
   - Identify initial risks, assumptions, issues, dependencies
   - Assign owners

2. **Weekly RAID Review**
   - Project team members contribute new items
   - Update status on existing items
   - Assess severity of new risks
   - Validate assumptions progress

3. **Escalation Management**
   - High-severity risks escalated to steering committee
   - Issue owners accountable for resolution
   - Dependency owners held to target dates

4. **Lessons Learned**
   - At project close, review RAID log
   - Document which risks materialized (inform future projects)
   - Document which assumptions were wrong (inform future projects)

## Troubleshooting

### Issue 1: RAID Log Never Reviewed, Items Stale
**Symptoms:** RAID log created but not updated, risks not mitigated, assumptions not validated

**Root Cause:** No discipline to maintain log, not part of steering cadence

**Resolution:** Make RAID review mandatory part of steering committee agenda

---

### Issue 2: Too Many Risks, Can't Mitigate All
**Symptoms:** RAID log has 50+ risks, team overwhelmed, unclear what to prioritize

**Root Cause:** Severity not calculated or not used to prioritize

**Resolution:** Focus on high-severity risks (high probability AND high impact), accept low-risk items

## Common Interview Questions

1. **What is a RAID log?**
   Tracks risks (potential problems), assumptions (beliefs), issues (current blockers), and dependencies (external reliances).

2. **Why track assumptions?**
   Assumptions are beliefs the project plan is built on. If wrong, project fails. Validate early.

3. **What's the difference between a risk and an issue?**
   Risk: might happen. Issue: is happening now.

4. **How do you prioritize risks?**
   By severity = probability × impact. Focus mitigation on high-severity risks.

5. **Who owns dependency tracking?**
   Dependency owner is responsible for delivery. Project manager tracks status.

6. **How often should RAID log be reviewed?**
   Weekly minimum. Part of steering committee meeting agenda.

7. **What happens to issues that can't be resolved?**
   Escalate for steering committee decision. Accept issue, mitigate consequence, or delay project.

## Tough Follow-up Questions

1. **What if a high-severity risk materializes?**
   Execute mitigation plan if ready, or escalate to steering for contingency plan.

2. **What if an assumption is validated as false mid-project?**
   This is a major issue. Escalate to steering. Project plan may need revision.

3. **What if dependency owner misses target date?**
   Escalate immediately. Assess project impact. Adjust timeline or find workaround.

## SAP Transactions

- N/A (RAID log is project management, not system-based)

## SAP Tables

- N/A

## Best Practices

- **Maintain weekly:** RAID log is living document, reviewed every week
- **Assign owners:** every item has clear owner
- **Calculate severity:** focus mitigation on high-severity risks
- **Validate assumptions early:** don't wait until too late to discover assumption is wrong
- **Escalate properly:** high-severity risks, blocked issues, missed dependencies escalate to steering
- **Close items:** don't let RAID log accumulate stale items

## Common Mistakes

- **RAID log created, never maintained:** becomes stale, loses value
- **No severity calculation:** all risks treated equally, resources wasted on low-risk items
- **Assumptions not validated:** assumption later proven wrong derails project
- **No escalation discipline:** issues blocked for weeks without steering involvement
- **Dependencies tracked loosely:** owner misses date, project surprised

## Interviewer's Hidden Expectations

- **Proactive management:** do you identify problems before they happen?
- **Assumption validation:** do you know assumptions need testing?
- **Escalation discipline:** do you escalate appropriately to unblock project?
- **Risk realism:** do you see uncertainty as normal, managed through mitigation?

## What Makes This a 10/10 Answer

- Candidate explains RAID log tracks risks, assumptions, issues, dependencies
- Discusses severity calculation (probability × impact)
- Shares example: risk mitigated, assumption validated/invalidated, issue escalated
- Understands assumption validation is critical early work
- Explains dependency tracking prevents surprises
- Shows awareness: RAID log is living document, reviewed regularly

## Red Flags

- Candidate doesn't know what RAID log is
- Confuses risks and issues
- No awareness of assumption validation
- Thinks RAID log is created once, never maintained

## Keywords

- RAID log
- Risk register
- Assumptions log
- Issue log
- Dependency log
- Risk severity
- Mitigation
- Escalation

## Related Topics

- [Risk Management](./risk-management.md)
- [Project Governance](./project-governance.md)
- [Project Lifecycle](./project-lifecycle.md)
