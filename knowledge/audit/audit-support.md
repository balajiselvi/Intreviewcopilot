# Audit Support & Internal Controls

## Overview

Audit support is about providing auditors with evidence, traceability, and systems thinking: showing that your GRC program has systematic controls, not just occasional compliance reviews. Interview questions test: audit evidence (what documentation do you maintain?), controls framework (design vs. operation), internal control architecture (preventive vs. detective controls), audit response (how do you handle audit findings?). Strong audit professionals: proactive evidence collection, understand control lifecycle, data-driven insights, collaborative with auditors. Weak: reactive only, poor documentation, can't articulate why controls exist.

## Interview Summary

Audit support: Providing auditors evidence of effective GRC controls and risk management. Evaluates: audit evidence methodology (how systematic?), controls framework (preventive/detective), internal controls assessment (design/operation), audit findings management (process for remediation?). Strong programs: documented controls, evidence trails, executive oversight, continuous monitoring. Weak: ad-hoc documentation, no evidence trail, no follow-up on findings.

## 30 Second Interview Answer

Audit support approach: (1) **Evidence Collection**: Maintain documented evidence of controls (ARA reports, access reviews, role maintenance logs). (2) **Controls Framework**: Map business processes → risks → controls (preventive: design strong roles; detective: monitor violations). (3) **Internal Control Assessment**: Annual SOX 404 or equivalent - test control design (is this a good control?) and operation (is it actually working?). (4) **Audit Findings**: Formal tracking, root cause analysis, remediation with proof-of-implementation.

Illustrative approach: a candidate could describe keeping an evidence repository of risk findings and remediation logs, testing a risk-based sample of key controls annually, remediating gaps and re-testing, and giving auditors a structured view of KPIs, exceptions, and evidence. Do not invent finding counts or claim a specific audit dashboard as personal delivery.

## 60 Second Interview Answer

**Scenario: Annual SOX 404 Internal Control Assessment for GRC**

**Challenge:** Financial controls include authorization (who can post GL?), segregation of duties (who can approve what?). Need to demonstrate to auditors that these controls are designed well AND operating effectively.

**My Audit Support Approach:**

1. **Evidence Repository** (Ongoing, not just for audit):
   - Monthly ARA runs: Baseline SoD violations, trend analysis
   - Role maintenance logs: When roles created/modified, who approved
   - Access review evidence: Manager certifications, remediation tracking
   - Exception reports: Users with violations, how handled
   - Dashboard: Real-time view of control status (green/red)

2. **Control Design Assessment** (Q1):
   - Map financial close process: Who can create GL master data? Who posts? Who reconciles? Who approves?
   - Design each role: What transactions allowed? What fields restricted?
   - SoD rule set: Define conflicts (e.g., can't create AND post GL)
   - Review with business: "Does this control make sense for your process?"

3. **Control Operating Effectiveness** (Q2):
   - Test design: Is the control technically working? (Run PFCG check, verify SoD rules enforced)
   - Test operation: Is it actually preventing violations? (Sample users, check no one has conflicting access)
   - Test execution: Are exceptions managed? (ARA finds violation → process for remediation → evidence of closure)
   - Sample size: 20-30 transactions per control (statistically valid)

4. **Audit Findings & Remediation**:
   - Annual assessment finds control operating effectively (green) or design/operation gaps (red)
   - If gap: Remediation plan (fix, timeline, owner), execute, re-test for evidence
   - Evidence: Screenshots (SUIM reports), email (manager confirmation), dated documentation

5. **Auditor Handoff**:
   - Provide control evidence library (organized by process, control ID, test results)
   - Executive summary: 12 key controls assessed, 11 effective, 1 with remediation plan
   - Supporting docs: ARA reports, access reviews, SOX 404 test working papers

**Outcome:** Auditors can independently verify controls are effective. Reduces audit risk, provides compliance narrative.

## 90 Second Interview Answer

**Audit Support Philosophy: Systematic Control Evidence, Not Compliance Burden**

**Core Principle:**
Audit support isn't a compliance checkbox—it's building systematic control evidence that auditors can verify independently. My approach: design controls well, operate them consistently, document everything.

**In Practice:**

**Preventive Controls (Design):**
- GRC controls prevent risky access before it happens (vs. detective controls that find violations after)
- Example: Role design prevents SoD violations (if designed well, no one CAN have conflicting access)
- My philosophy: Invest in preventive design upfront. Detective controls (ARA monitoring) catch edge cases, but good design prevents most risk

**Detective Controls (Monitoring):**
- Monthly ARA runs flag violations that slipped through preventive controls
- Access review questions: "Does this user still need this role?" (catches role creep, forgotten assignments)
- Continuous monitoring: Daily authorization logs, exception reports (who has unusual access?)
- My experience: Detective controls catch real violations. Two examples: (1) User with GL posting + reconciliation (SoD conflict); (2) Former employee still had access 6 months after termination

**Internal Control Assessment (SOX 404 or equivalent):**
- Annual requirement: Test that key controls are designed well and operating effectively
- Design test: Is the control theoretically sound? (Does PFCG SoD rule make sense? Yes, prevents fraud)
- Operation test: Is it actually working? (Sample users, verify no violations. Sample transactions, verify control executed correctly)
- My approach: Select 12-15 key financial controls (GL posting, payment approval, reconciliation). For each: design assessment (1 day) + operation testing (3-5 days). Evidence: test working papers, control test results, photos/screenshots

**Evidence & Documentation:**
- Systematic evidence repository: Not scattered files, but organized by process/control
- Audit trail: Who made change? When? Why? Approval? (Git-like traceability for SAP changes)
- Real-time dashboard: Auditors see live control status (green = operating, red = gap)
- My experience: Auditors want to see: systematic process, documented control design, test evidence, remediation tracking. If you have those, audit is straightforward

**Audit Findings & Root Cause:**
- Finding: Control design gap (SoD rule missing) or operation gap (control not executed correctly)
- Root cause: Why? (Lack of governance? Process change? User error? System change?)
- Remediation: Fix root cause (not just symptom). Implement, test, evidence
- Follow-up: Auditors want to see remediation actually happened. Provide evidence (re-test, sign-off)

**Why This Matters:**
- Auditors are validating that YOUR controls are working. If you have evidence, audit is fast/clean.
- My experience: Companies with weak documentation = long audits, auditors more skeptical, higher risk rating
- Companies with systematic evidence = quick audits, auditor confidence, lower risk rating

**Internal Control Mindset:**
- Controls exist to prevent or detect risk. Not to create compliance burden.
- When designing control: What risk are we preventing? Is this proportionate? (Don't over-engineer)
- When operating control: Is it still necessary? Is it still working? (Review annually, retire obsolete controls)
- When documenting: Auditors need to verify independently. Give them data they can check themselves

## Architecture

- Audit support: Systematic control evidence, preventive + detective controls, documented operation
- Control design: Map risks → design controls → test design is sound
- Control operation: Execute controls, monitor for exceptions, maintain evidence
- Evidence repository: Organized by control, documented test results, remediation tracking
- Audit response: Formal findings process, root cause analysis, remediation with proof
- SOX 404 / Internal control assessment: Annual review of key controls (design + operation)

## Runtime Flow

1. Design controls (prevent risk at source)
2. Implement controls (configure PFCG, ARA, etc.)
3. Operate controls (daily monitoring, monthly ARA, quarterly reviews)
4. Collect evidence (maintain audit trail, documented approvals)
5. Annual SOX 404 (test design + operation of key controls)
6. Audit findings (identify gaps, root cause, remediation)
7. Remediation & re-test (fix, implement, evidence of closure)
8. Auditor verification (provide evidence library, dashboard)

## Configuration

- Control framework (which controls are key? How many to test?)
- Evidence requirements (what documentation is sufficient?)
- SOX 404 testing approach (sample size, test procedures)
- Audit findings process (how track, remediate, close?)
- Continuous monitoring (what metrics, what thresholds trigger escalation?)

## Implementation Activities

- Document control design (process maps, role design, SoD rules)
- Implement preventive controls (PFCG, ARA, access restrictions)
- Set up detective controls (ARA monitoring, access review, continuous analytics)
- Create evidence repository (organize by control, maintain test working papers)
- Execute annual SOX 404 (select controls, design assessment, operation testing)
- Manage audit findings (formal tracking, root cause, remediation tracking)

## Production Audit Support Activities

- Monthly ARA runs (baseline violations, trend analysis)
- Quarterly access reviews (systematic user access review)
- Annual SOX 404 testing (full control assessment)
- Continuous monitoring (daily authorization logs, exception reports)
- Audit response (evidence handoff, auditor interviews)
- Findings remediation (implement fixes, re-test, closure evidence)

## Troubleshooting

**Issue:** Auditors request evidence we don't have documented  
Resolution: Proactive evidence collection (plan now, don't scramble at audit time)

**Issue:** Control testing finds design or operation gaps  
Resolution: Formal remediation process (fix root cause, implement, re-test, maintain evidence)

**Issue:** Audit findings pile up, not remediated  
Resolution: Establish SLA, assign ownership, escalate over-SLA to steering committee

## Common Interview Questions

1. **What's the difference between control design and control operation testing?** (Design = is control theoretically sound? Operation = is it working?)
2. **How would you prepare for a SOX 404 audit?** (Select controls, test design, test operation, maintain evidence)
3. **What makes a strong control vs. weak control?** (Strong: prevents/detects risk, proportionate, documented, operated consistently)
4. **Tell me about a time you found a control wasn't working and had to remediate.** (STAR: control gap, root cause, remediation, re-test)
5. **How do you provide evidence to auditors?** (Evidence repository, test working papers, dashboard, supporting docs)

## Tough Follow-up Questions

1. **You test 20-30 transactions per control. Is that statistically valid for 100K transactions?**  
   - Depends on risk tolerance. 20-30 is reasonable for routine controls, lower-risk processes. Higher-risk? Larger sample. But 100% testing isn't practical—use statistical sampling or risk-based selection.

2. **Auditors find a control violation in their testing but you didn't catch it in your testing. What happened?**  
   - Possible: (1) Sample size too small (audit's larger sample caught edge case). (2) Control design gap (rule missing). (3) Execution gap (control not applied correctly). Investigate root cause, remediate.

3. **You have a preventive control but auditors still find violations. Does that mean the control isn't working?**  
   - Depends. Preventive control in design? Maybe not technically enforced. Detective control should catch. Root cause: preventive design gap or detective control not operating? Fix both.

## SAP Transactions

- **PFCG:** Profile Generator (role management, SoD rule enforcement)
- **SUIM:** User Information System (queries, reports on user access)
- **SU01:** User master (user-role assignments)
- **SU24:** Authorization object proposal (SoD rule library)
- **GRC ARA:** Access Risk Analysis (SoD violation detection, evidence reports)
- **GRC BRM:** Business Role Management (business/technical role mapping)

## SAP Tables

- **USR01:** User master
- **AGRS:** Roles
- **USACL:** User-role assignments
- **GGBS:** SoD conflict rules
- **GVARS:** ARA violation findings (evidence for auditors)

## Best Practices

- Systematic control evidence (documented, organized, auditor-accessible)
- Preventive + detective control balance (design well, monitor continuously)
- Annual SOX 404 or equivalent (formal control assessment)
- Root cause analysis (fix root, not symptoms)
- Closed-loop remediation (implement, re-test, evidence of closure)
- Continuous monitoring (catch issues before audit)
- Executive oversight (steering committee reviews control status)
- Audit collaboration (provide evidence proactively, support auditor testing)

## Common Mistakes

- Reactive compliance (scramble at audit time vs. proactive evidence collection)
- Weak evidence trail (can't trace decisions, approvals, changes)
- No SOX 404 (informal controls, no independent verification)
- Design/operation gap (designed well but not operating; or operating but design weak)
- No remediation follow-up (find violations, don't fix)
- Preventive controls only (miss violations that slip through; need detective monitoring too)

## Interviewer's Hidden Expectations

Strong audit professionals: (1) Proactive evidence collection, (2) Understand control lifecycle, (3) Design vs. operation distinction, (4) Root cause thinking, (5) Executive accountability, (6) Collaborative with auditors

Weak: Reactive only, poor documentation, weak controls, can't explain why controls exist

## What Makes 10/10 Answer

- Clear control philosophy (preventive + detective, systematic evidence)
- SOX 404 approach (control selection, design test, operation test)
- Evidence strategy (how maintain, organize, present to auditors)
- Root cause thinking (violations = opportunity to strengthen controls)
- Closed-loop remediation (implement, test, evidence)
- Real examples (e.g., "Found user with GL posting + payment approval, root cause was role design gap, fixed by creating separate roles")
- Audit collaboration (work WITH auditors, not against them)

## Red Flags

- "We do controls but don't document" (audit nightmare)
- "We review controls once a year" (too slow for continuous risk)
- "We have preventive controls only" (detective controls catch design gaps)
- "Auditors tell us control gaps we didn't know about" (insufficient monitoring)
- "Controls slow down business" (control design problem, not control concept problem)
- Can't articulate why a control exists (should link to specific risk)

## Keywords

- Audit support, audit evidence, audit trail
- Control design, control operation, effectiveness testing
- Preventive controls, detective controls
- SOX 404, internal control assessment
- Evidence repository, working papers
- Remediation, root cause, closed-loop
- PFCG, SUIM, ARA, BRM

## Related Topics

- [Access Review & User Management Audit](access-review.md)
- [SOX & Regulatory Compliance](sox.md)
- [Access Risk Analysis (ARA)](../grc/ara.md)
- [Segregation of Duties (SoD)](../compliance/sod.md)
