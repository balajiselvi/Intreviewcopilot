# Segregation of Duties (SoD) - Core Compliance Control

## Overview

Segregation of duties (SoD) is the foundational GRC principle: no single user should have the ability to perpetrate and conceal a fraud. Interview questions test: SoD philosophy (why does it matter?), design approach (how do you identify conflicts?), implementation pragmatism (how do you balance SoD with usability?), real scenarios (conflict between security and business). Strong SoD professionals: understand risk deeply, design proportionate controls, balance compliance with operations. Weak: overly rigid rules, no business context, can't articulate trade-offs.

## Interview Summary

SoD: Preventing any single user from having incompatible access (e.g., can't create AND approve payments). Evaluates: understanding of conflicts (what creates risk?), design methodology (how identify?), pragmatism (strict vs. realistic?), enforcement (technical vs. procedural?). Strong programs: risk-based rules, documented conflicts, monitoring for exceptions, executive oversight. Weak: blanket rules, no documented rationale, no monitoring.

## 30 Second Interview Answer

SoD philosophy: (1) **Risk Identification**: What frauds matter? GL posting + payment approval = high risk (embezzlement). (2) **Conflict Definition**: Define incompatible access (ARA rule set). (3) **Role Design**: Create roles that respect SoD (Accountant role: posting only. Approver role: approval only. Never both). (4) **Enforcement**: Technical (PFCG SoD rule prevents combination) or procedural (manual review). (5) **Exception Management**: Some users need exceptions (treasurer role = both functions). Manager approves, documents, monitors.

Illustrative approach: a candidate could describe a risk-based SoD ruleset covering high-fraud pairs such as posting-plus-approval, receipt-plus-payment, and hire-plus-payroll, enforcing most combinations technically, and managing a small documented exception set with periodic review and monitoring. Use actual rule counts only if they appear in candidate background.

## 60 Second Interview Answer

**Scenario: Designing SoD for Financial Close Process**

**Challenge:** Finance team has 50 people across AP, AR, GL, Payroll. Need SoD to prevent fraud (unauthorized posting, ghost payments, payroll adjustments) without paralyzing business.

**My SoD Design Approach:**

1. **Risk Assessment** (Week 1):
   - Identify high-risk transactions: GL posting (any GL account?), payment approval (any amount?), payroll changes (salary, tax), revenue recognition
   - For each: What's the fraud? GL posting: unauthorized journal entry. Payment: unauthorized vendor/amount. Payroll: unauthorized raise.
   - Quantify risk: What's the cost if control fails? GL posting = potential $M. Payroll = compliance + fraud risk.

2. **Conflict Identification** (Week 2):
   - Who can do what?
   - Invoice approver: Can they create the vendor? NO (fraud: create fake vendor, approve invoice, payment goes to attacker).
   - GL poster: Can they approve their own postings? NO (fraud: post unauthorized entries, approve themselves).
   - Payroll processor: Can they both input hours AND process payroll? NO (fraud: inflate hours, process, cash check).
   - Exceptions: Treasurer often does both GL + payment (controls: executive review, smaller approval limits, daily reconciliation to mitigate).

3. **SoD Rule Definition** (Week 3):
   - Document conflicts:
     - "Cannot both Create Vendor AND Approve Invoices" (Conflict severity: High)
     - "Cannot both Post GL AND Approve GL" (Conflict severity: High)
     - "Cannot both Process Payroll AND Approve Payroll" (Conflict severity: High)
     - "Cannot both Receive Goods AND Authorize Payment" (Conflict severity: Medium)
   - Severity: High = fraud + financial impact. Medium = fraud but smaller risk.
   - ARA rule set: Load into SAP (SU24 proposals, GGBS tables)

4. **Role Design** (Week 4):
   - Create roles respecting SoD:
     - AP_INVOICE_ENTRY: Can create vendors, enter invoices (NOT approve)
     - AP_INVOICE_APPROVER: Can approve invoices (NOT create vendors/payment)
     - GL_POSTER: Can post GL (NOT approve GL)
     - GL_APPROVER: Can approve GL (NOT post)
     - PAYROLL_PROCESSOR: Can calculate payroll (NOT approve)
     - PAYROLL_APPROVER: Can approve payroll (NOT process)
   - Composite roles: Coordinator role = entry + coordination (NOT approval)
   - Derived roles: Treasurer = GL_POSTER + AP_APPROVER + limited exceptions (executive override with review)

5. **Exception Management**:
   - Some roles violate SoD by necessity (Treasurer, CFO). Manage via:
     - Documented exception (why needed?)
     - Executive approval (CFO/Controller signs off)
     - Detective controls (daily reconciliation, exception reporting)
     - Quarterly review (still needed? Executive re-approves or revokes)
   - Example: Treasurer role violates SoD (both GL posting + payment approval). Risk accepted because Treasurer < 5 people, daily reconciliation, CFO reviews daily exceptions

6. **Technical Enforcement** (Week 5):
   - PFCG: Configure SoD rules (SU24 → SoD conflicts)
   - ARA: Monthly run (flag violations)
   - Exception report: Who has conflicting roles? How justified?
   - Executive dashboard: SoD compliance status (green = compliant, red = has violations/exceptions)

7. **Monitoring & Maintenance**:
   - Monthly ARA: Identify new violations (usually from org changes—people move roles, inherit conflicting access)
   - Quarterly review: Exceptions still valid?
   - Annual audit: SoD control design/operation test

**Outcome:** SoD prevents most fraud. Exceptions are documented, monitored, executive-approved. Fraud-resistant AND business-functional.

## 90 Second Interview Answer

**SoD Philosophy: Risk-Based Pragmatism, Not Rigid Rules**

**Core Principle:**
SoD prevents fraud, but overly strict SoD destroys business. My approach: understand WHAT frauds matter (risk assessment), design SoD proportionate to risk, manage exceptions pragmatically.

**Why SoD Matters:**
- Prevents single-person fraud (no one person can both perpetrate AND conceal)
- Classic fraud: Accountant creates fake vendor, approves invoice, processes payment to themselves—leaves business unaware
- SoD breaks the chain: Person A can create vendor (no approval); Person B approves invoices (can't create vendors); Person C pays (can't approve)
- Cost of fraud: Financial + compliance + reputational. Cost of strict SoD: Operational delays + user frustration

**In Practice:**

**Risk-Based Approach (not blanket rules):**
- Don't treat all transactions equally. High-risk (GL posting, payment, payroll)? Strict SoD. Low-risk (report access, read-only)? No SoD needed.
- Example: "Cannot create AND approve invoices" (high-risk, high-fraud potential). "Cannot create AND run reports" (low-risk, no fraud potential).
- Real-world: Some SoD conflicts are more dangerous than others. Prioritize.

**Exception Management (the hard part):**
- Perfect SoD is impossible. Treasurer role needs both GL posting + payment approval (business necessity).
- My philosophy: Don't forbid exceptions. Instead: Document, approve, monitor, re-review.
- Exception decision: Why does this person need conflicting access? Is the risk acceptable? What detective controls offset?
- Example: Treasurer exceptions approved by CFO quarterly. Daily reconciliation (detective control) catches any misuse.
- Cost of exception: Administrative (quarterly review) but avoids paralysis

**Enforcement Layers:**
- Technical (PFCG SoD rules prevent conflicting roles from being assigned) = Strongest, preventive
- Procedural (manual approval required to override technical SoD) = Weaker, needs discipline
- Detective (ARA monitoring flags violations, exception reports) = Catch what slips through
- My approach: Use all three layers. Technical prevents most. Procedural allows necessary exceptions. Detective catches workarounds.

**Business-Audit Balance:**
- Finance leader often frustrated: "SoD slows us down; we can't move fast."
- My response: "Let's identify which SoD rules are truly risk-critical. For others, automate or streamline."
- Example: "Vendor creation approval" is risky (fake vendors = fraud). Maybe require manager approval before PFCG assign permission (detective control, faster than SoD prohibits entirely).
- Not all SoD rules have equal ROI

**Conflict Between SoD Strictness & Usability:**
- Strict SoD (no one can do conflicting tasks) = Very strong control, but: Users frustrated, business delays, workarounds emerge (users share passwords—defeats control).
- Loose SoD (few rules) = Business happy, but: Control fails, fraud risk increases.
- My experience: Sweet spot = Risk-based SoD (high-risk strict, medium-risk monitored, low-risk flexible)
- If forced to choose: Monitored exception > password-sharing workaround (at least there's a detective control)

**SoD Conflicts in Real Orgs:**
- Matrix orgs: One person in AP + HR = multiple reporting lines = harder to structure SoD (coordinate roles)
- Shared service centers: Fewer people, more roles per person (higher conflict risk, higher exception rate) = compensate with monitoring
- Startups: Fewer people, everyone does everything (SoD rules often unrealistic) = focus on detective controls (audit, reconciliation)

**Why This Matters:**
- Fraud costs organizations millions (and hits CFO credibility)
- SoD is primary prevention control (audit expects it in any large org)
- My experience: Companies with weak SoD have auditor warnings ("material weakness"). Companies with SoD violations have big audit findings. Companies with SoD + exceptions + monitoring = clean audit
- Balance = competitive advantage (fraud prevention + operational speed)

**Architect Perspective on SoD:**
- SoD is not a checkbox; it's a risk control with trade-offs
- Over-engineer SoD = business complaints + workarounds + defeats purpose
- Under-engineer SoD = fraud risk + audit findings
- Right-engineer SoD = Proportionate to risk + documented exceptions + detective monitoring + executive oversight

## Architecture

- SoD principle: No single user can perpetrate AND conceal fraud
- Design: Risk assessment → identify conflicts → role design respecting SoD
- Enforcement: Technical (PFCG) + procedural (approvals) + detective (ARA monitoring)
- Exceptions: Documented, approved, monitored, quarterly re-reviewed
- Compliance: Annual audit of SoD control (design + operation)

## Runtime Flow

1. Risk assessment (which transactions are fraud-prone?)
2. Identify conflicts (what access combinations create risk?)
3. Define SoD rules (technical rules in ARA/GGBS)
4. Design roles (create roles respecting SoD rules)
5. Assign roles (users get roles; preventive control blocks conflicting combinations)
6. Exception management (for necessary conflicts: documented, approved, monitored)
7. Monitor (monthly ARA: flag violations; exception report)
8. Remediation (violations found → remove conflicting access OR document exception)
9. Audit (annual SOX 404 test: SoD control effective?)

## Configuration

- Conflict severity (high vs. medium vs. low)
- Enforcement mechanism (technical block vs. procedural approval)
- Exception criteria (who can get exceptions? What review required?)
- Exception review cycle (quarterly, semi-annual, annual?)
- Monitoring approach (monthly ARA, exception dashboards?)

## Implementation Activities

- Map financial processes (identify high-risk transactions)
- Identify conflicts (who can do what? What combinations create risk?)
- Document conflict rules (formal SoD rule set)
- Configure PFCG (create roles, SoD rules prevent conflicting assignment)
- ARA configuration (load conflict rules, run monitoring)
- Exception management (process for documenting, approving, re-reviewing)
- Executive dashboards (SoD compliance status, exception list)
- Annual audit (SOX 404 control testing)

## Production SoD Activities

- Monthly ARA runs (identify new violations)
- Exception management (quarterly re-review of approved exceptions)
- Annual access review (confirm SoD still appropriate)
- Exception investigation (if violation found, why? Remove access or approve exception?)
- Audit support (evidence for SOX 404 auditors)

## Troubleshooting

**Issue:** Users request exceptions that violate SoD  
Resolution: Risk assessment—is exception justified? If yes, document + monitor; if no, deny + offer alternative

**Issue:** ARA finds violations (users with conflicting roles)  
Resolution: Likely org change (person moved roles). Remove conflicting role or approve exception + monitor

**Issue:** Auditors identify SoD rule we missed  
Resolution: Add rule, update GGBS, remediate existing violations, enhance monitoring

**Issue:** Too many SoD exceptions—making control ineffective  
Resolution: Re-assess conflicts—maybe some are too strict? Adjust rules; re-engineer roles

## Common Interview Questions

1. **What's your philosophy on SoD?** (Risk-based, proportionate, pragmatic exceptions)
2. **How do you identify SoD conflicts?** (Risk assessment → identify high-risk transactions)
3. **How do you handle conflicts when business needs violate SoD?** (Exception process: approve, monitor, re-review)
4. **Tell me about an SoD conflict you resolved.** (Real example: conflict, why risky, how managed)
5. **How do you monitor for SoD violations?** (ARA, exception dashboards, quarterly review)

## Tough Follow-up Questions

1. **You say "risk-based SoD," but auditors want strict SoD. How do you reconcile?**  
   - Risk-based SoD IS auditor-friendly (documented rationale, proportionate controls, monitored). Strict SoD that's not enforced = bad. Proportionate SoD with monitoring = good.

2. **Your user has an approved SoD exception. What if auditors find abuse?**  
   - Detective control should catch abuse (daily reconciliation, exception monitoring). If abuse found: exception revoked, user disciplined, root cause fixed.

3. **How do you scale SoD to 10,000+ users across multiple systems?**  
   - Risk-based approach: Not all users equal. High-risk roles (finance)? Strict SoD. Low-risk roles (IT reading logs)? No SoD. Automate monitoring (ARA, dashboards).

## SAP Transactions

- **PFCG:** Profile Generator (role design, SoD enforcement)
- **SU24:** Authorization object proposals (SoD conflict rules, GGBS maintenance)
- **GGBS:** SoD conflict rule table (where conflicts defined)
- **GRC ARA:** Access Risk Analysis (SoD violation detection, monitoring)
- **SUIM:** User Information System (reports on user roles, conflicts)

## SAP Tables

- **GGBS:** SoD conflict rules table
- **GVARS:** ARA violation findings
- **AGRS:** Roles (where SoD rules applied)
- **USR01:** User master (role assignments)
- **USACL:** User-role assignments

## Best Practices

- Risk-based SoD (not blanket rules; proportionate to risk)
- Documented conflict definitions (why is this a conflict? What fraud does it prevent?)
- Technical enforcement (PFCG rules, ARA detection)
- Exception management (document, approve, monitor, re-review)
- Detective controls (monitoring, exception reporting, reconciliation)
- Executive oversight (steering committee reviews SoD status quarterly)
- Audit readiness (evidence of SoD control effectiveness)
- Continuous improvement (findings feed back into rule updates)

## Common Mistakes

- Overly strict SoD (users frustrated, workarounds, defeats purpose)
- No exception process (business can't move, exceptions happen anyway via workarounds)
- No monitoring (violations go undetected)
- Auditor-driven SoD (audit says "add this rule" without risk understanding)
- SoD divorced from business processes (rules don't make sense in practice)
- No documented rationale (audit asks "why this rule?" and can't answer)

## Interviewer's Hidden Expectations

Strong SoD architects: (1) Understand fraud risk deeply, (2) Design proportionate controls, (3) Pragmatic exception process, (4) Monitoring & enforcement, (5) Executive accountability, (6) Business/audit balance

Weak: Overly rigid, no risk basis, exception process broken, can't articulate trade-offs

## What Makes 10/10 Answer

- Clear SoD philosophy (risk-based, pragmatic, exceptions managed)
- Real understanding of fraud (not just "can't do both tasks")
- Risk assessment approach (how identify conflicts?)
- Exception management (how balance business + compliance?)
- Monitoring strategy (how catch violations?)
- Real examples (conflict, how managed, business impact)
- Auditor-ready (can explain rationale, provide evidence)

## Red Flags

- "SoD prevents all fraud" (no, it's one control among many)
- "No exceptions to SoD" (unrealistic; will have workarounds)
- "Users have SoD violations but we monitor them" (not enough; should fix or formally approve)
- "Auditor told us to do this rule" (should be risk-driven, not audit-driven)
- "We don't know which transactions are high-risk" (fundamental gap)

## Keywords

- Segregation of duties, SoD, conflict
- Fraud prevention, risk-based controls
- Role design, PFCG, SoD rules
- Exception management, detective controls
- ARA monitoring, violation detection
- Executive approval, audit readiness

## Related Topics

- [Access Risk Analysis (ARA)](../grc/ara.md)
- [Access Review & User Management Audit](../audit/access-review.md)
- [Audit Support & Internal Controls](../audit/audit-support.md)
- [Role Design & Authorization Objects](../security/role-design.md)
