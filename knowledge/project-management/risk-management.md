# SAP Risk Management

## Overview

Risk management is the discipline of identifying things that might go wrong, assessing their likelihood and impact, and planning mitigations to reduce the risk. Every project has risks: timeline pressure, resource availability, data quality, scope creep, technical challenges. Projects that manage risks actively tend to succeed. Projects that ignore risks tend to spiral into crisis mode when risks materialize. Risk management doesn't eliminate risk; it prepares you to handle risk when it occurs.

## Interview Summary

Risk management identifies potential problems, assesses likelihood and impact, develops mitigation strategies, and monitors risk throughout the project.

## 30 Second Interview Answer

Risk management identifies potential problems early (timeline pressure, resource constraints, data quality), assesses their likelihood and impact, and develops mitigation plans (what you'll do if risk occurs). This lets you handle problems proactively rather than reactively.

## 60 Second Interview Answer

Risk management progresses through: **identification** (brainstorm what might go wrong), **assessment** (how likely is it, and how bad if it happens), **mitigation** (what action can reduce the risk), **monitoring** (watch for warning signs that risk is becoming reality). Example risks: executive sponsor only available part-time (likelihood medium, impact high—project lacks decision authority). Mitigation: designate backup decision-maker. Business requirements unclear (likelihood high, impact high—design built on wrong assumptions). Mitigation: extra requirements workshops, detailed requirements document. Data quality issues (likelihood high, impact high—data migration fails or goes live with bad data). Mitigation: early data quality assessment, cleansing plan. High-severity risks (high likelihood AND high impact) get more attention and mitigation effort.

## 90 Second Interview Answer

Risk management is a continuous process: **identify risks** (workshops, past-project lessons, expert judgment), **assess risks** (probability: low/medium/high, impact: low/medium/high, severity = probability × impact), **plan mitigation** (who owns it, what action reduces risk), **monitor risks** (weekly review, watch for warning signs), **escalate** (high-severity risks escalate to steering committee). Risk identification happens throughout project, not just at start. During Discover, identify requirement-related risks (unclear requirements). During Explore, identify design/customization risks. During Execute, identify testing/resource risks. During Deploy, identify cutover/data migration risks. Risks tracked in RAID log (Risks, Assumptions, Issues, Dependencies), reviewed weekly with steering committee. When risks materialize (become issues), they move from risk log to issue log and require immediate resolution. Risk management also includes contingency planning for high-severity risks: "If this happens, here's our backup plan." Example: "If executive sponsor becomes unavailable (high-impact risk), here's our backup decision-maker." Contingency plans are prepared in advance, not developed when crisis hits.

## Architecture

Risk management architecture includes:

1. **Risk Identification**
   - Schedule risks (timeline pressure, phased timeline not feasible)
   - Resource risks (key people unavailable, skills gaps)
   - Scope risks (scope creep, requirements unclear)
   - Technical risks (complexity of customization, integration challenges)
   - Data risks (data quality, legacy data doesn't map cleanly)
   - Business risks (sponsor unavailable, business resistance to change)

2. **Risk Assessment**
   - Probability: likelihood of risk occurring (low/medium/high)
   - Impact: consequence if risk occurs (low/medium/high)
   - Severity: probability × impact (determines priority)

3. **Mitigation Planning**
   - For each high-severity risk: what action reduces probability or impact
   - Risk owner: who owns mitigation
   - Target date: when mitigation should be completed

4. **Risk Monitoring**
   - Weekly review of risks
   - Watch for warning signs (probability increasing, impact growing)
   - Escalate if risk becoming more likely or impactful
   - Close risk if mitigation successful or risk no longer relevant

5. **Contingency Planning**
   - For very high-severity risks: backup plan if mitigation fails
   - Documented in advance
   - Tested before crisis

## Runtime Flow

1. **Risk Identification Phase (Weeks 1-2)**
   - Brainstorm potential risks
   - Review past projects (what went wrong?)
   - Identify common SAP project risks
   - Create initial risk log

2. **Risk Assessment (Week 2-3)**
   - For each risk: estimate probability and impact
   - Calculate severity (probability × impact)
   - Prioritize high-severity risks

3. **Mitigation Planning (Week 3-4)**
   - For each high-severity risk: develop mitigation strategy
   - Assign risk owner
   - Define mitigation activities and target date
   - Plan contingency for very high-severity risks

4. **Risk Monitoring (Throughout Project)**
   - Weekly risk review: identify new risks, update status on existing
   - Escalate increasing risks to steering committee
   - Track mitigation progress
   - Close risks when mitigated or no longer relevant
   - Escalate risks that become issues

5. **Issue Escalation**
   - If risk materializes (becomes issue), move to issue log
   - Assign resolution owner
   - Track resolution progress

## Configuration

Risk management includes:

1. **Risk Register**
   - Risk ID, description, category, probability, impact, severity
   - Mitigation strategy, owner, target date, status
   - Contingency plan (for very high-severity risks)

2. **Risk Monitoring Cadence**
   - Weekly risk review during steering committee meeting
   - New risks identified and added to register
   - Existing risks status updated
   - High-severity risks escalated if worsening

3. **Risk Escalation Criteria**
   - High-severity risks (probability high AND impact high)
   - Increasing probability or impact trends
   - Risks that are becoming issues

## Implementation Activities

1. **Risk Identification Workshop**
   - Gather team and stakeholders
   - Brainstorm potential risks
   - Document risks with descriptions

2. **Risk Assessment**
   - For each risk: estimate probability and impact
   - Calculate severity
   - Prioritize

3. **Mitigation Planning**
   - Develop mitigation strategy for high-severity risks
   - Assign owners
   - Define activities and timeline

4. **Contingency Planning**
   - For very high-severity risks: develop contingency plan
   - Ensure contingency plan is feasible and ready

5. **Ongoing Monitoring**
   - Weekly risk review
   - Update risk status
   - Escalate as needed
   - Close mitigated risks

## Troubleshooting

### Issue 1: Risk Identified But No Mitigation Assigned
**Symptoms:** Risk log has many risks, but no one owns mitigation, no progress

**Root Cause:** No accountability for mitigation

**Resolution:** Assign mitigation owner for every high-severity risk. Track progress weekly.

---

### Issue 2: Risks Ignored, Materialize as Crises
**Symptoms:** Known risks not mitigated, become issues mid-project, require emergency response

**Root Cause:** Risk management not enforced, mitigation not prioritized

**Resolution:** Executive sponsor prioritizes risk mitigation. High-severity risks are steering committee agenda items.

---

### Issue 3: Risk Register Becomes Stale
**Symptoms:** Risk log created early, never updated, becomes irrelevant to current project status

**Root Cause:** No discipline to maintain and review log

**Resolution:** Risk review is mandatory agenda item in steering committee meeting. Updated weekly.

## Common Interview Questions

1. **Why is risk management important?**
   Identifies problems early when they're cheaper to fix. Prevents crisis mode.

2. **What are common SAP project risks?**
   Timeline pressure, resource constraints, data quality, unclear requirements, technical complexity, scope creep.

3. **How do you assess risk severity?**
   Probability × impact. High probability + high impact = high severity.

4. **What's a mitigation strategy?**
   Action that reduces either probability (less likely to happen) or impact (less bad if happens).

5. **When should risks escalate?**
   When probability or impact increases. When risk becomes critical to project success.

6. **What's a contingency plan?**
   Backup plan for very high-severity risks. Prepared in advance, executed if risk materializes.

7. **How often should risks be reviewed?**
   Weekly at minimum. More frequently if risks are increasing.

## Tough Follow-up Questions

1. **What if executive sponsor (high-impact risk) becomes unavailable?**
   Contingency: execute backup decision-maker plan. Escalate to next level of leadership.

2. **What if data quality much worse than expected (high-impact risk)?**
   Increase data cleansing scope. Delay cutover if needed. Escalate cost/timeline impact.

3. **What if critical resource leaves unexpectedly?**
   Activate cross-training plan (backup person ramps up). If backup not available, hire contractor immediately.

## SAP Transactions

- N/A (risk management is organizational, not system-based)

## SAP Tables

- N/A

## Best Practices

- **Identify risks early:** start in Discover phase
- **Assess realistically:** honest probability and impact assessment
- **Assign mitigation owners:** every high-severity risk has clear owner
- **Monitor continuously:** weekly risk review mandatory
- **Escalate appropriately:** high-severity risks escalate to steering committee
- **Plan contingencies:** very high-severity risks have backup plan
- **Close risks:** don't let risk log accumulate closed risks

## Common Mistakes

- **Risk identification without mitigation:** identify risks but don't act on them
- **Unrealistic assessment:** underestimate probability or impact
- **No risk owner:** risk identified but no one responsible for mitigation
- **Risk log never reviewed:** becomes stale document, loses value
- **No contingency planning:** crisis hits and no backup plan available
- **Escalation ignored:** steering committee aware of risk but takes no action

## Interviewer's Hidden Expectations

- **Proactive thinking:** do you identify problems before they happen?
- **Realistic assessment:** can you assess severity accurately or do you minimize risk?
- **Action orientation:** do you see risk as requiring action or just documentation?
- **Crisis prevention:** do you understand good risk management prevents crises?

## What Makes This a 10/10 Answer

- Candidate explains risk management as identifying and mitigating potential problems
- Discusses probability, impact, severity assessment
- Shares example: risk identified, mitigation assigned, risk successfully mitigated
- Understands high-severity risks need more attention and escalation
- Explains contingency planning for very critical risks
- Shows awareness: good risk management prevents crises, enables proactive response

## Red Flags

- Candidate confuses risk with issue
- No awareness of probability/impact assessment
- Thinks risk identification alone is enough (without mitigation)
- Hasn't participated in actual risk management

## Keywords

- Risk management
- Risk identification
- Risk assessment
- Risk severity
- Mitigation
- Contingency planning
- Risk owner
- Risk escalation
- Risk monitoring

## Related Topics

- [RAID Log](./raid-log.md)
- [Project Governance](./project-governance.md)
- [Project Lifecycle](./project-lifecycle.md)
