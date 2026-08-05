# Scenario-Based Interview Questions

## Overview

Scenario-based questions present hypothetical situations and ask candidates how they would handle them: "You're 3 months into S/4HANA implementation. Testing finds 200 defects. Go-live is 2 weeks away. What do you do?" "Your company's GL posting failed. Finance can't close month-end. It's Friday 6pm. How do you respond?" Scenario questions test: decision-making under pressure (how do you think?), business judgment (what matters most?), leadership (how communicate?), and problem-solving (multiple options, choose best). Scenarios are very common in SAP interviews because they reveal how candidates think in real crisis situations vs theoretical discussions. Strong candidates: assess situation quickly, identify trade-offs, make decision with reasoning, communicate clearly. Weak: panic, indecisive, no structure.

## Interview Summary

Scenario questions: hypothetical crisis or decision point. Evaluates: decision-making (can you think on feet?), judgment (what matters?), leadership (communicate clearly?), business awareness (cost-benefit?). Strong: assess situation, identify options, make decision with reasoning, explain trade-offs. Weak: panic, overthinking, no structure.

## 30 Second Interview Answer

Scenario answer structure: (1) **Clarify:** Ask clarifying questions (what info do I need?). (2) **Assess:** What's the real problem? What matters most? (3) **Options:** What are my choices? (4) **Recommend:** Which do I prefer? Why? (5) **Communicate:** How do I communicate to stakeholders?

Example scenario: "Testing finds 200 defects, 2 weeks before go-live. What do you do?"
Answer: (1) Clarify: "How many are critical? Which systems affected?" (2) Assess: "If critical issues unresolved, go-live risky." (3) Options: "Fix now (slip timeline), reduce scope (launch without those modules), risk it (go-live with known issues)." (4) Recommend: "Fix critical, reduce scope for non-critical. Slip timeline if needed—better than go-live disaster." (5) Communicate: "Tell steering committee: critical issues must be fixed, non-critical deferred to post-go-live enhancements."

## 60 Second Interview Answer

**Scenario: Testing Defects 2 Weeks Before Go-Live**

**Clarify:**
- How many critical defects (users can't work)?
- How many medium (workaround exists)?
- How many low (cosmetic)?
- Which systems affected (core Finance or peripheral)?

**Assess:**
- Risk: go-live with 200 known defects = high risk (users frustrated, business disrupted)
- Options: (1) Fix all (slip timeline 3-4 weeks), (2) Fix critical, reduce scope (launch Finance now, Supply Chain later), (3) Risk it (go-live, hope users find workarounds)

**Recommend:**
- Triage: Fix critical (users can't work) before go-live. Medium/low: post-go-live patches (acceptable).
- Timeline: If critical issues fix in <1 week, go on schedule. If >1 week, slip 1-2 weeks (better than go-live disaster).
- Scope reduction: If fixing critical takes too long, defer non-critical modules (can add post-go-live).

**Communicate:**
- Steering committee: "Testing found 200 defects. Prioritized: 10 critical (must fix), 50 medium (can workaround), 140 low (post-go-live). Recommendation: fix critical in 1 week, go-live on schedule, post-go-live patches for medium/low."
- Testing team: "Triage by severity. Critical gets resources, medium/low deferred."
- Business users: "Go-live will have some known issues (cosmetic). Post-go-live support ready to fix quickly."

## 90 Second Interview Answer

**Scenario 1: GL Posting Failure, Month-End Close, Friday 6pm**

**Situation:**
- Finance trying to close month-end close (GL posting required for balance sheet)
- Core GL posting transaction failing (system down, or logic error)
- Finance staff waiting (can't close without GL posts)
- Friday 6pm (IT support limited, escalation difficult)

**Immediate Actions (15 minutes):**
1. **Verify problem:** Confirm GL posting actually broken (not user error)
   - Ask: "What error message?" "Can you post a test GL?" "Which GL accounts fail (all, or specific range)?"
   
2. **Assess impact:** How critical?
   - "Can you close month manually (workaround)?" If yes, do workaround immediately.
   - "How many GL posts affected?" (one, or thousands?)
   
3. **Escalate:** Get development/infrastructure team involved
   - If database down: ask infrastructure to restart (might help)
   - If code issue: development team debug (might be quick fix)

**Decision Point (30 minutes):**

Option 1: **Workaround (Best)**
- Finance closes month manually (post GL entries via journal entry, not automated process)
- Allows month-end to close
- Permanent fix addressed Monday (no weekend rush)

Option 2: **Emergency Fix (If Workaround Won't Work)**
- Developer debugs GL posting code (look at logs, check recent changes)
- If simple fix (wrong field, missing data), fix + deploy quickly (risk: might break something else)
- If complex issue, escalate to SAP support (wait for response Monday)

Option 3: **Rollback Recent Change**
- If GL posting broke after recent deployment/change, rollback (restore to last working version)
- Risky if month-end transactions already posted in new version

**Recommendation:**
1. Workaround immediately (finance closes manually, business continues)
2. Document problem (recreate on Monday, plan permanent fix)
3. Don't rush emergency fix Friday evening (high risk, tired team)
4. Permanent fix Monday (proper testing, low pressure)

**Communication:**
- Finance: "Use workaround (manual GL entries). We'll have permanent fix Monday."
- Development: "Don't rush emergency fix tonight. We'll debug properly Monday morning."
- Leadership: "Month-end close delayed 2 hours (manual workaround), no business impact."

---

**Scenario 2: Brownfield Project, 60% Customizations to Rearchitect, Aggressive Timeline**

**Situation:**
- ECC to S/4HANA project, 12-month timeline (aggressive for brownfield)
- Assessment found 60% customization (must rearchitect)
- Team estimated 18 months for proper rearchitecture
- Business pressure: "Ship in 12 months or we won't modernize"
- Budget: Fixed (can't add resources)

**Analysis:**
- Reality: 60% customization can't be rearchitected in 12 months properly
- Options: (1) Extend timeline, (2) Reduce customization scope (build only 30%), (3) Accept risk (rush rearchitecture, quality issues post-go-live), (4) Hybrid (fast-track critical, defer non-critical)

**Recommendation:**
1. **Honest assessment to steering committee:** "12 months for 60% rearchitecture is risky. Three options:
   - Option A: Extend to 18 months (quality, manageable risk)
   - Option B: Reduce scope to 30% rearchitecture (12 months, but defer some customizations)
   - Option C: Rush 60% rearchitecture (12 months, high risk of post-go-live issues, tech debt)

2. **Cost-benefit analysis:**
   - Option A (18 months): Later go-live, but sustainable system, lower post-go-live issues
   - Option B (12 months): Meet timeline, but delayed feature set
   - Option C (12 months): Meet timeline, but risk $5M in post-go-live fixes

3. **My recommendation:** Option A or B (not C). C is false economy (saves 6 months now, costs 6 months fixing later).

4. **If forced to Option C:**
   - Acknowledge risk explicitly (steering committee accepts it)
   - Allocate bigger post-go-live support team (deal with issues quickly)
   - Plan for Phase 2 (defer non-critical customizations to post-go-live enhancement)
   - Don't commit to "stable system" claims (set expectations realistically)

**Communication:**
- Steering committee: Present options + cost-benefit. Make business decide (with understanding of trade-offs).
- Implementation team: "Business chose aggressive timeline. We'll deliver, but post-go-live support will be intensive. Plan accordingly."
- Business users: "Go-live will have some rough edges. Post-go-live we'll stabilize quickly."

---

**Scenario 3: Key Team Member Leaves Mid-Project (Architect, 6 Months Before Go-Live)**

**Situation:**
- Senior architect (irreplaceable person, only one who understands complex data model)
- Leaves for another opportunity (6 months before go-live)
- Knowledge concentrated in one person (not documented well)
- Timeline tight, can't afford delay

**Immediate Actions:**
1. **Knowledge transfer (2 weeks):**
   - Document data model (create diagrams, design decisions, rationale)
   - Record architecture decisions (why this choice, not that)
   - Identify areas of risk (where did this person do most complex work?)
   - Pair new architect with departing architect (knowledge transfer)

2. **Backfill (1-2 weeks):**
   - Hire experienced replacement architect (contractor if needed, short-term cost)
   - Onboard replacement (pair with departing architect if possible)
   - Establish overlap (both on team for 2-3 weeks, knowledge transfer)

3. **Risk mitigation:**
   - Identify risky decisions that need architect review later (flag for go-live phase)
   - Empower team (don't wait for architect for every decision, make decisions collaboratively)
   - Document everything (decisions, trade-offs, risks) for new architect

**Decision Point:**
- Option 1: Slip timeline (give new architect 2-3 months to ramp)
- Option 2: Hire very experienced replacement (more expensive, faster ramp)
- Option 3: Distribute knowledge (different person owns data, different person owns integration, etc.)

**Recommendation:**
- Acknowledge: losing key person is high risk, accept some timeline slip (1-2 months realistic)
- Hire experienced replacement (higher cost, but reduces ramp time)
- Distribute architecture knowledge (don't recreate single point of failure)
- Empower team during knowledge gap

**Communication:**
- Steering committee: "Losing architect is risk. Plan 6-8 week schedule slip, hiring experienced replacement, will recover on track."
- Team: "New architect coming. Continue work, don't wait for permission. Bring decisions to team, not one person."
- New architect: "You're joining mid-project. Documentation exists, previous architect available for 2 weeks overlap. Let's onboard you quickly."

## Architecture

- Scenario structure: (1) Situation, (2) Clarify (what do I need to know?), (3) Assess (what matters?), (4) Options (what are my choices?), (5) Recommend (which do I prefer?), (6) Communicate
- No "right answer" (multiple could work, depends on context)
- Show thinking process (not just decision, but reasoning)
- Acknowledge trade-offs (every option has cost)

## Runtime Flow

1. Listen to scenario
2. Ask clarifying questions (don't assume)
3. Assess situation (what's real problem?)
4. Identify options (multiple approaches)
5. Recommend one (with reasoning)
6. Explain communication (how tell stakeholders)
7. Invite follow-up ("What if X changed?")

## Configuration

- Realistic scenarios (based on actual project risks)
- Sufficient detail (clear enough to reason about)
- Ambiguity (real scenarios are ambiguous, need clarification)
- Pressure (time constraint, limited resources)

## Implementation Activities

- Reflect on real crises you've handled
- Develop structured thinking process
- Practice explaining calmly under pressure
- Prepare for follow-ups ("What if that didn't work?")

## Production Support Activities

- Handle real crises with structured approach
- Communicate clearly under pressure
- Make decisions with reasoning

## Troubleshooting

**Common issue:** Candidate panics (no clear thinking).
Root cause: Not prepared for pressure, doesn't have decision-making framework
Resolution: Slow down, ask clarifying questions, think through options before deciding.

**Common issue:** Candidate makes decision too quickly (doesn't assess trade-offs).
Root cause: Overconfident, or trying to look decisive
Resolution: Think through options, explain why one is better, acknowledge risks.

**Common issue:** Candidate indecisive (can't commit to recommendation).
Root cause: Unclear thinking, or afraid to commit
Resolution: Make a decision (with reasoning). "I'd recommend X because Y, acknowledging risk Z."

## Common Interview Questions

1. **Testing finds 200 defects 2 weeks before go-live. What do you do?** (covered above)
2. **GL posting failure, month-end close, Friday 6pm. How do you handle?** (covered above)
3. **Key architect leaves 6 months before go-live. How do you respond?** (covered above)
4. **Budget cut 30% mid-project. What do you do?**
   - Assess: which work gets cut? Go-live date affected?
   - Options: reduce scope, extend timeline, reduce quality (risky)
   - Recommend: reduce scope (defer enhancements), keep timeline/quality
5. **Major customer complains about new process post-go-live. What do you do?**
   - Listen (understand specific complaint), assess (is system wrong, or just change resistance?), fix or adjust

## Tough Follow-up Questions

1. **You recommended slip timeline (6-8 weeks). CFO says "Not acceptable, must ship in 12 months." What now?**
   - Reality check: Can't meet 12 months with quality (acknowledged risk). Options: reduce scope, accept post-go-live issues, or force timeline and lose team trust.
   - Recommendation: Present cost of each option to CFO. "If timeline is hard constraint, scope must reduce" (defer features).
   - If forced to impossible timeline: document risk, escalate to steering committee, proceed with open eyes (manage expectations).

2. **You chose workaround (manual GL entries) for GL posting failure. But CFO says "Too manual, we need permanent fix tonight." Do you risk emergency fix?**
   - Acknowledge concern. Reality: emergency fix Friday night is high risk (tired team, no testing, potential to break more things).
   - Compromise: have developer available all weekend (if fix fails, quick rollback). But don't force emergency fix. "We can fix tonight (high risk) or Monday morning (low risk). Your call."

3. **You say distribute knowledge (don't concentrate with one person). But business says "That person knows everything, don't let them leave." How do you push back?**
   - Acknowledge: concentrating knowledge is risk (what if person gets hit by bus?). Options: (1) pay to retain key person (risk—enables blackmail), (2) force knowledge transfer (before person leaves, mandatory documentation), (3) accept concentration, manage risk (keep backup contractor on call).
   - Recommend: force knowledge transfer before person leaves (documentation, training, tests).

## SAP Transactions

- **Various:** Depends on scenario (could be any transaction)

## SAP Tables

- **Various:** Depends on scenario

## Best Practices

- Assess before deciding (don't rush)
- Acknowledge trade-offs (every option has cost)
- Communicate clearly (stakeholders need to understand)
- Make decision (with reasoning, don't be indecisive)
- Prepare for follow-ups (things rarely go as planned)

## Common Mistakes

- Panic (no structured thinking)
- Decide too quickly (no trade-off analysis)
- Indecisive (can't commit)
- Don't communicate (stakeholders surprised)
- Blame others (own your decisions)

## Interviewer's Hidden Expectations

Strong candidates: (1) **Structured thinking** (even under pressure), (2) **Business judgment** (what matters most?), (3) **Decision-making** (can commit with reasoning), (4) **Communication** (clear to stakeholders), (5) **Accountability** (own the decisions).

Weak candidates: Panic, overthink, indecisive, blame others.

## What Makes This a 10/10 Answer

- Asks clarifying questions (doesn't assume)
- Assesses situation (identifies real problem)
- Identifies multiple options (shows thinking)
- Recommends one (with reasoning)
- Acknowledges trade-offs (realistic)
- Explains communication (how to tell stakeholders)
- Calm, professional demeanor (handles pressure well)

## Red Flags

- Panics (no clear thinking)
- Decides too quickly (no analysis)
- Indecisive (can't commit)
- Doesn't communicate (surprises stakeholders)
- Blames others

## Keywords

- Scenario, decision-making, crisis
- Options, trade-offs, judgment
- Communication, stakeholders
- Pressure, timeline, risk
- Accountability, reasoning

## Related Topics

- [Project Management](../project-management/project-methodology.md)
- [Implementation Methodology](../project-types/implementation.md)
- [Post-Go-Live Support](../project-types/support.md)
