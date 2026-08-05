# SAP Resource Planning

## Overview

Resource planning defines who works on the SAP project, in what role, for how long, and with what skills. Poor resource planning causes: key people overallocated, skills gaps not identified until too late, business operations understaffed (because people are pulled into project), timeline slips (because skills weren't available). Strong resource planning secures commitments from business and IT leadership, matches skills to tasks, manages conflict between project and operational demands, and keeps projects staffed appropriately.

## Interview Summary

Resource planning identifies needed skills, secures commitments from business and IT, and manages resource allocation across project and operational demands.

## 30 Second Interview Answer

Resource planning defines who you need (what roles, skills, and full-time equivalents), secures them from business and IT (negotiating availability), and manages conflict between project work and operational demands. You can't succeed if your best people are on other projects or pulled back to operations.

## 60 Second Interview Answer

Resource planning starts with defining what resources you need: consultants (configure, architect, test), business resources (requirements, testing, change management), IT resources (infrastructure, technical support), and project management. For each role, you define: responsibility (what they do), skills required (experience level), and full-time equivalent (FTE—100% means full time, 50% means half time on project). Then you secure commitments: identify individuals to fill roles, get business/IT leadership approval, negotiate availability. This is where many projects struggle: business says "we can't spare that person, they're critical to operations." You escalate to executive sponsor for decision: project needs are critical; operational needs are critical. Often compromise: 70% project, 30% operations. Resource planning also includes: ramp-up time (when do people start?), escalation (what if committed person leaves?), and skill gaps (do we need contractor help?).

## 90 Second Interview Answer

Resource planning is about getting the right people at the right time. It starts with **skills assessment:** what skills does this project need (configure FI, testing, data migration)? How many people in each role? For each role: responsibility, required experience level, FTE (full-time, part-time). Example: "FI consultant, 8 years SAP FI experience, 100% FTE, 6 months." Next: **Resource sourcing** (find people to fill roles). Internal staff or external contractors? For internal staff, you negotiate with their functional leaders (Finance CFO has IT consultant—can they spare them?). For contractors, you hire. Then: **Resource management** (keep people productive, resolve conflicts). People get interrupted by operational fires. You escalate: "This person is 100% project, operational team can't pull them." Executive sponsor makes decision. Finally: **Resource scalability** (what if key person leaves?). Cross-train backups. Document skills. Don't make project dependent on one person. Resource planning continues throughout project: "Who ramps down and when?" Discover needs full business team. Execute needs heavy testing team. Post-go-live needs smaller support team. Plan transitions.

## Architecture

Resource planning architecture includes:

1. **Resource Requirements**
   - Role (SAP Consultant, Business Analyst, Tester)
   - Skills required (FI configuration, ABAP programming)
   - Experience level (years, seniority)
   - FTE (full-time, part-time, percentage)
   - Duration (start date, end date)

2. **Resource Sources**
   - Internal staff (available from business or IT)
   - External contractors (hired through consulting firm)
   - Subject matter experts (for specific knowledge areas)

3. **Resource Allocation**
   - Workstream assignments (who works in what area)
   - Timeline (when they're needed, full project duration)
   - Conflict resolution (project vs operational demands)

4. **Skills Management**
   - Skills inventory (who has what skills)
   - Skills gaps (what's missing)
   - Training or hiring strategy to address gaps

5. **Resource Governance**
   - Resource manager: owns resource plan
   - Functional leaders: approve release of staff
   - Executive sponsor: resolves conflicts (project vs operations)

## Runtime Flow

1. **Resource Planning Phase (Week 1-2 of project)**
   - Define needed roles and skills
   - Identify resource sources (internal/external)
   - Estimate FTE and duration for each role
   - Identify potential conflicts

2. **Resource Sourcing (Week 2-3)**
   - For internal staff: meet with functional leaders, negotiate availability
   - For external: develop job descriptions, recruit consultants
   - Confirm start dates and commitment levels

3. **Resource Onboarding (Week 4+)**
   - New team members join project
   - Onboarding: project context, team members, tools/systems
   - Ramp-up: training on SAP system, project approach

4. **Ongoing Resource Management**
   - Monitor utilization: are people working as planned?
   - Manage conflicts: escalate if operational demands pull people from project
   - Identify issues: is someone overallocated? Underutilized? Not performing?
   - Cross-train: develop backups for key roles

5. **Resource Transitions**
   - As project moves from Explore (design-heavy) to Execute (config-heavy), adjust staffing
   - Deploy phase: increase support team, decrease config team
   - Post-go-live: reduce to smaller support team

## Configuration

Resource planning includes:

1. **Resource Plan**
   - By phase: who's needed in Discover, Explore, Execute, Deploy, Post-Go-Live
   - By workstream: who works in FI, MM, SD, testing, data migration
   - Timeline: start date, end date, ramp-up/ramp-down

2. **Resource Sourcing Strategy**
   - Internal vs external (cost/skills/knowledge trade-offs)
   - Hiring/contracting timeline
   - Onboarding plan

3. **Skills Assessment**
   - Skills available
   - Skills gaps (what's missing)
   - Training or hiring to address gaps

4. **Resource Governance**
   - Resource manager responsible for plan
   - Functional leaders accountable for releasing staff
   - Escalation to executive sponsor for conflicts

## Implementation Activities

1. **Resource Requirement Definition**
   - For each workstream (FI, MM, SD, testing, etc.), define roles and skills needed
   - Estimate FTE and duration
   - Document in resource plan

2. **Resource Sourcing**
   - Identify internal candidates
   - Negotiate with functional leaders for release
   - Hire external consultants if needed
   - Confirm commitments

3. **Resource Onboarding**
   - Develop onboarding program
   - Assign mentors/coaches
   - Set expectations for ramp-up time

4. **Resource Management**
   - Weekly resource status (utilization, issues)
   - Escalate conflicts to executive sponsor
   - Adjust staffing as project needs change
   - Cross-train to address single-points-of-failure

5. **Resource Transitions**
   - Plan phase transitions (who ramps down/up between phases)
   - Retrain operations team for post-go-live support
   - Document skills and procedures

## Troubleshooting

### Issue 1: Critical Resource Pulled for Operational Fire
**Symptoms:** FI consultant committed to project, but Finance department has major issue, wants consultant back

**Root Cause:** No clear escalation path, operational needs seen as more urgent

**Resolution:** Executive sponsor decides project vs operations priority. Typically: project is strategic priority, operations finds alternative solution or accepts temporary delay.

---

### Issue 2: Skills Gap Discovered Mid-Project
**Symptoms:** During Execute, realize no one knows advanced ABAP—need custom code expertise

**Root Cause:** Skills assessment insufficient during planning

**Resolution:** Hire consultant immediately (timeline impact, cost impact). Learn lesson for future projects.

---

### Issue 3: Key Person Leaves, Project Continuity at Risk
**Symptoms:** FI Lead leaves project (new job), project loses critical knowledge

**Root Cause:** Project too dependent on one person, no cross-training

**Resolution:** Immediately identify backup and accelerate cross-training. Escalate timeline risk.

## Common Interview Questions

1. **Why is resource planning important?**
   Without right people at right time, project stalls. Skills gaps cause delays. Overallocation causes burnout.

2. **What resources does an SAP project need?**
   SAP consultants (configure), business resources (requirements/testing), IT (infrastructure/support), project management.

3. **How do you handle resource conflicts (project vs operations)?**
   Escalate to executive sponsor. Project is strategic priority. Operations finds alternative solution.

4. **What's an FTE?**
   Full-Time Equivalent. 100% = full time on project. 50% = half time (other 50% on operations).

5. **How do you address skills gaps?**
   Identify gaps early. Train internal staff or hire contractors with needed skills.

6. **What's cross-training and why is it important?**
   Training backups on key roles. Reduces dependency on one person. Increases continuity.

7. **How does resource planning change across project phases?**
   Discover: heavy business involvement. Explore: heavy consultant involvement. Execute: heavy testing/config. Post-Go-Live: smaller support team.

## Tough Follow-up Questions

1. **What if you can't get commitment for a critical resource?**
   Escalate to executive sponsor. Project timeline or scope may need adjustment.

2. **What if external consultant is expensive?**
   Weigh cost vs timeline. Cheaper alternative (train internal staff) takes longer.

3. **What if staff turnover is high (people leave project)?**
   Cross-train aggressively. Document extensively. Adjust timeline for learning curve of replacements.

## SAP Transactions

- N/A (resource planning is organizational, not system-based)

## SAP Tables

- N/A

## Best Practices

- **Plan early:** define resource needs before project starts
- **Get commitments in writing:** functional leaders commit to specific people, dates, FTE
- **Cross-train:** reduce dependency on single experts
- **Document skills:** keep inventory of who knows what
- **Manage utilization:** monitor resource availability, escalate conflicts
- **Plan transitions:** staff down as project moves to operations mode

## Common Mistakes

- **Underestimating resource needs:** "we can do this with fewer people"
- **No backup for key roles:** project too dependent on one expert
- **Operational demands pull project people:** no escalation to resolve conflict
- **Skills gaps not addressed:** discover needed skill too late
- **External consultants too expensive:** hire contractors that cost more than internal staff would have

## Interviewer's Hidden Expectations

- **Pragmatism:** do you know some resource conflicts are unsolvable, need executive decisions?
- **Skills thinking:** do you match skills to work or just count headcount?
- **Continuity thinking:** do you know project shouldn't depend on one person?
- **Realism:** do you estimate resource needs accurately or wish-think?

## What Makes This a 10/10 Answer

- Candidate explains resource planning as securing right skills at right time
- Discusses role definitions, FTE, duration, skills requirements
- Shares example: resource conflict (operational demand), how it was escalated and resolved
- Understands cross-training importance for continuity
- Discusses how staffing changes across project phases
- Explains skills assessment and gap-addressing strategies

## Red Flags

- Candidate thinks team size is just about headcount, not skills
- No awareness of operational vs project resource conflict
- Hasn't experienced resource shortage or skills gap
- Thinks one expert can do multiple critical roles

## Keywords

- Resource planning
- Full-Time Equivalent (FTE)
- Skills assessment
- Skills gap
- Cross-training
- Resource sourcing
- Resource allocation
- Functional leaders

## Related Topics

- [Project Governance](./project-governance.md)
- [Project Lifecycle](./project-lifecycle.md)
- [Change Management](./change-management.md)
