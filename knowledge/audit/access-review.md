# Access Review & User Management Audit

## Overview

Access review (or user access review—UAR) is the foundation of any GRC compliance program: periodic verification that users have only the access they need. Interview questions test: audit methodology (how do you structure reviews?), findings analysis (what's a critical access violation?), remediation process (how do you fix violations?). Strong auditors: methodical, data-driven, outcome-focused. Weak: reactive only, ignore patterns, no continuous monitoring.

## Interview Summary

Access review: Periodic verification user access is still necessary and appropriate. Auditors evaluate: business justification (does this user still need this role?), segregation violations (SOD conflicts), least privilege (over-provisioned access?), compliance (audit evidence?). Strong review programs: systematic (all users, all systems), executive signoff, closed-loop remediation. Weak: haphazard, no follow-up, no metrics.

## 30 Second Interview Answer

Access review process: (1) **Scope**: Define reviewed systems (all ERP, or subset?), which users (all, or risk-based?). (2) **Data**: Extract user-role assignments from SAP (PFCG, SU01), ARA findings. (3) **Justify**: Ask business owners: "Does [User] still need [Role]?" (4) **Resolve**: Approve, reject (access removed), or mitigate (add monitoring). (5) **Document**: Evidence of review (spreadsheet, ARA report, sign-off).

Illustrative approach: a candidate could describe a periodic access review covering the in-scope user population, using ARA to surface SoD conflicts, asking business owners to certify remaining access, obtaining executive sign-off on evidence, and working to an agreed remediation SLA. Use real volumes and SLAs only from candidate background.

## 60 Second Interview Answer

**Scenario: Annual Access Review for Finance Function**

**Challenge:** 300 finance users across ECC + S/4HANA. Need to verify they still have appropriate access, identify over-provisioning or SoD violations.

**My Review Approach:**

1. **Scoping** (Week 1):
   - Extract all finance roles from PFCG (via authority check SU01, SU02)
   - Query user-role assignments (S_USER_GRP security table)
   - Identify critical transactions (GL posting, reconciliation, payment approval)

2. **Data Gathering** (Week 1-2):
   - Run ARA: Identify SoD violations (unauthorized role combinations)
   - BRM: Map business roles to technical SAP roles (traceability)
   - Report builder: User provisioning history (when was access granted?)

3. **Justification Process** (Week 2-3):
   - Finance manager reviews each user: "Still in this role? Still need this access?"
   - Red-flag access: Users with GL posting + payment approval (SoD violation), or multiple incompatible roles
   - Manager signs-off: "Access confirmed appropriate for [date]"

4. **Remediation** (Week 3-4):
   - Violations: Remove conflicting roles or add detective controls (monitoring)
   - Over-provisioned access: Revoke non-business-justified roles
   - Gaps: If user missing access needed for job, add through CAB

5. **Audit Trail**:
   - ARA evidence report (findings, root cause analysis)
   - Manager certification (name, date, signature—digital or email)
   - Remediation log (access changed, approved by, audit trail in SUIM logs)
   - CFO attestation (finance control environment is monitored)

**Outcome:** Evidence of systematic review, executive accountability, closed-loop remediation. Auditors expect quarterly drifts (new hires, role changes), which we track via provisioning analytics.

## 90 Second Interview Answer

**Access Review Philosophy: Continuous Verification, Not Compliance Checkbox**

**Core Principle:**
Access review isn't an annual task checked off—it's ongoing verification that access still aligns with business need. My approach: balance systematic rigor with pragmatic efficiency.

**In Practice:**

**Systematic but Efficient:**
- Annual comprehensive review: All users, all systems (ECC, S/4, BTP)
- Quarterly risk-based review: High-risk roles (GL posting, payment, hiring)
- Monthly continuous monitoring: Segregation violations flagged by ARA (not waiting for annual review)
- Outcome: Violations caught faster, executive visibility, compliance narrative

**Scoping Matters:**
- Don't review everything the same way. High-risk access (financial, HR, security)? Full scrutiny. Low-risk access (read-only reports)? Sampling fine.
- Define "justification threshold": Does GL posting access need business case every year? Yes. Does read-only report access? Probably not—track changes instead.
- Real-world: Most users have legitimate access. The 5-10% with violations or drift are what matter. Find those efficiently.

**Remediation Is the Hard Part:**
- Violation findings are easy—fixing them is hard (requires stakeholder coordination, sometimes operational disruption).
- My experience: Don't just say "access violation—remove it." Understand why it exists (workaround? new process? forgotten old assignment?). Then fix root cause.
- Example: If a user has SoD-conflicting roles because they cover multiple roles during vacation, the fix is temporary access replacement, not permanent revocation + "sorry, you can't cover anymore."

**Audit Evidence:**
- Auditors want to see: Systematic process, executive accountability, closed-loop remediation. Not perfection.
- What I document: Scope (which users, systems), frequency (annual, quarterly, continuous), methodology (ARA, BRM, manual cert), findings (count, severity), remediation (what we fixed, by when), executive sign-off.
- Red flag for auditors: "We did an access review, but it's not documented and we didn't really follow up on findings." Real flag: "Here's our annual review evidence, ARA findings, remediation tracking, CFO attestation."

**Why This Matters:**
- Access creep is silent risk. Users accumulate roles over years (job changes, project work, temporary assignments). Without review, you inherit risk.
- My experience: One review found a payment approver with GL posting access (SoD violation) for 5 years—undetected. Remediation = structural change to role design.
- Continuous monitoring catches these faster than annual review alone.

## Architecture

- Access review: Systematic verification user access still appropriate and necessary
- Scope: All users vs. risk-based; all systems or subset
- Process: Extract data (PFCG, SU01, ARA) → justify (business case) → resolve (approve/revoke) → document (audit trail)
- Frequency: Annual comprehensive, quarterly risk-based, monthly continuous monitoring
- Remediation: Remove access, or mitigate (detective control), or fix root cause
- Audit evidence: Scope, methodology, findings, remediation, executive sign-off

## Runtime Flow

1. Scope users and systems (annual vs. quarterly vs. continuous)
2. Extract access data (PFCG, BRM, ARA, provisioning logs)
3. Identify violations (SoD conflicts, over-provisioning, least-privilege violations)
4. Justify access (business owner certification: still needed?)
5. Resolve violations (remove, mitigate, or fix root cause)
6. Document remediation (evidence trail, timeline, who approved)
7. Executive attestation (CFO/audit committee sign-off)
8. Monitor for drift (quarterly continuous monitoring, not just annual)

## Configuration

- Review scope (all users vs. risk-based)
- Review frequency (annual, quarterly, continuous)
- Violation criteria (ARA rules, least-privilege thresholds)
- Remediation SLA (critical findings: 30 days, standard: 90 days)
- Audit evidence requirements

## Implementation Activities

- Define access review policy (scope, frequency, authority)
- Extract user access data (PFCG, BRM, provisioning systems)
- Run ARA to identify segregation violations
- Coordinate business owner certification (maintain access?)
- Process remediation requests (remove access, add monitoring)
- Document evidence (audit trail, sign-offs, closed-loop tracking)
- Escalate over-SLA findings to steering committee

## Production Access Review Activities

- Monthly continuous monitoring (ARA findings)
- Quarterly risk-based reviews (high-risk roles)
- Annual comprehensive review (all users)
- Remediation tracking (violations closed?)
- Audit evidence management (compliance narrative)
- Trend analysis (access creep, violation patterns)

## Troubleshooting

**Issue:** Access review findings pile up, not remediated  
Resolution: Establish SLA, assign ownership, escalate over-SLA to steering committee

**Issue:** Managers rubber-stamp reviews (no rigor)  
Resolution: Spot-check auditor—verify a sample of "approved" access, challenge weak justifications

**Issue:** Access violations detected after incidents (audit finds after financial fraud)  
Resolution: Shift to continuous monitoring (monthly ARA, not just annual review)

## Common Interview Questions

1. **How often should you review user access?** (annual, quarterly, continuous)
2. **What's a critical access violation vs. acceptable risk?** (SoD conflicts = critical; over-provisioned read-only = acceptable if low-risk)
3. **What's your approach when business owner says "I can't revoke that access—they need it"?** (Probe: What do they need? Can we scope it differently? Or mitigate risk?)
4. **How do you measure access review effectiveness?** (Violations found/fixed, time-to-remediate, audit evidence completeness)
5. **Tell me about a time an access review found a significant violation.** (STAR: Situation, what violation, how you remediated, business impact)

## Tough Follow-up Questions

1. **You say "annual review," but new users join every week. How do you handle new access?**  
   - Provisioning process separate from review. New users provisioned via CAB → Annual review verifies ongoing appropriateness.

2. **What if business owner refuses to certify access or says "it's justified but I can't explain why"?**  
   - Red flag. Either help them articulate business case, or recommend remediation (remove or mitigate). Unexplained access = risk.

3. **How do you scale access review to 10,000+ users across multiple systems?**  
   - Risk-based: Review 100% of high-risk roles, statistical sample of low-risk. Use ARA automation to pre-flag violations.

## SAP Transactions

- **PFCG:** Profile Generator (role management, maintains user-role mappings)
- **SU01:** User master (user-role assignments, login data)
- **SU02:** Authorization object maintenance
- **SUIM:** User Information System (queries, reports on user access, role usage)
- **GRC ARA:** Access Risk Analysis (automates SoD violation detection)
- **GRC BRM:** Business Role Management (maps business roles to technical SAP roles)

## SAP Tables

- **USR01:** User master
- **USR02:** Logon data
- **USGRP:** User group
- **AGRS:** Roles (aggregates authorization objects)
- **USACL:** User-role assignments (with dates)
- **GGBS:** Segregation of duties conflict rules
- **GVARS:** ARA violation findings

## Best Practices

- Systematic scope (all systems, all users, not ad-hoc)
- Executive accountability (CFO/audit sign-off)
- Closed-loop remediation (violations tracked to closure)
- Continuous monitoring (ARA monthly, not just annual review)
- Risk-based prioritization (high-risk violations fixed first)
- Audit evidence (scope, findings, remediation, sign-off documented)
- Root-cause analysis (why violations exist, fix cause not just symptom)

## Common Mistakes

- Annual-only review (too slow to catch drift)
- No follow-up on findings (findings pile up, auditors see no remediation)
- Rubber-stamp certification (managers don't actually review, just sign)
- No prioritization (treat all violations equally)
- Access review divorced from provisioning (review finds violations, but provisioning process causes same violations next year)

## Interviewer's Hidden Expectations

Strong auditors: (1) Systematic (structured process, all users), (2) Analytical (ARA, data-driven findings), (3) Outcome-focused (remediation tracked), (4) Executive-aware (audit evidence, compliance narrative), (5) Continuous (not just annual), (6) Collaborative (work with business, understand root causes)

Weak auditors: Reactive only, no methodology, no follow-up on findings, can't articulate what they're looking for

## What Makes 10/10 Answer

- Clear methodology (scope, frequency, process)
- Mentions ARA automation + manual justification (balance)
- Shows executive accountability (CFO sign-off)
- Closed-loop remediation (violations tracked)
- Continuous monitoring (monthly, not just annual)
- Root-cause thinking (why violations exist, not just remove them)
- Real examples (e.g., "Found payment approver with GL posting, caused by forgotten role assignment from project 5 years ago")

## Red Flags

- "We do annual access review" (too slow, doesn't catch drift)
- "Managers confirm access" (but no process verification)
- "We found violations but didn't remediate" (compliance failure)
- "No continuous monitoring, only annual" (risk creep between reviews)
- Can't articulate what access is "appropriate" (vague criteria)

## Keywords

- Access review, user access review (UAR), access certification
- Segregation of duties, SoD violations, conflict of interest
- Risk-based review, continuous monitoring
- Remediation, closed-loop, SLA
- Audit evidence, audit trail, executive attestation
- PFCG, SU01, ARA, BRM

## Related Topics

- [Segregation of Duties (SoD)](../compliance/sod.md)
- [Access Risk Analysis (ARA)](../grc/ara.md)
- [Audit Support & Compliance](audit-support.md)
- [SOX & Regulatory Compliance](sox.md)
