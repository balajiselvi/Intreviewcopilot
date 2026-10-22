# SAP Project Lifecycle

## Overview

SAP Activate uses six phases: Discover, Prepare, Explore, Realize, Deploy, and Run. Discover confirms the business case and the high-level scope. Prepare completes the plan, the governance, and the initial landscape. Explore confirms fit-to-standard gaps and the authorization scope. Realize configures the solution and completes test evidence. Deploy completes the cutover, the go/no-go review, and hypercare. Run completes the operational handover. Do not replace Realize with an Execute phase, and do not drop Prepare or Run. A customer programme may add its own gates. Those gates do not rename the phases, and they do not create a universal duration.

## Interview Summary

SAP Activate progresses through Discover, Prepare, Explore, Realize, Deploy, and Run. Confirm the configuration and the cutover evidence in the phase that owns them.

## 30 Second Interview Answer

Use the SAP Activate sequence. Discover confirms scope. Prepare completes the plan and the team. Explore confirms the fit-to-standard design and the authorization scope. Realize configures and tests. Deploy completes the cutover and hypercare. Run operates the solution. Do not call the build phase Execute.

## 60 Second Interview Answer

SAP Activate has six phases. Discover confirms the business case and the high-level scope. Prepare completes the plan, the governance, and the initial landscape. Explore confirms fit-to-standard gaps, extension decisions, and the authorization scope. Realize configures the approved scope and completes integration and test evidence. Deploy completes cutover rehearsal, the go/no-go review, production cutover, and hypercare. Run completes the operational handover. Do not attach a universal week count to a phase.

## 90 Second Interview Answer

Use the six SAP Activate phases and the evidence that closes each one. Discover confirms the business case, the scope, and the deployment choice. Prepare completes the plan, the owners, the RAID log, and the initial landscape. Explore confirms the fit-to-standard gaps, the extension decisions, and the authorization scope. Realize configures the approved scope and completes integration and test evidence. Deploy rehearses the cutover, completes the go/no-go review, executes the production cutover, and runs hypercare. Run completes the operational handover. Do not assign a universal week count. A customer gate can be added, but it does not rename Realize to Execute and it does not remove Prepare or Run.

## Architecture

SAP project lifecycle architecture includes:

1. **Five Project Phases**
   - Discover: understand requirements and current state
   - Explore: design SAP solution and make build/buy/configure decisions
   - Execute: build solution (configure, test)
   - Deploy: prepare and execute go-live
   - Post-Go-Live: stabilize and optimize

2. **Phase Gates (Decision Points)**
   - Discover gate: requirements approved
   - Explore gate: blueprint and design approved
   - Execute gate: UAT passed
   - Deploy gate: cutover successful
   - Post-Go-Live gate: stabilization complete

3. **Workstreams (Running Across Phases)**
   - Configuration (Explore through Execute)
   - Testing (Execute through Deploy)
   - Data migration (Execute through Deploy)
   - Change management (Discover through Post-Go-Live)
   - Technical infrastructure (Explore through Post-Go-Live)

4. **Resource Intensity**
   - Discover: high business involvement (workshops, interviews)
   - Explore: high consultant involvement (design), business review
   - Execute: high technical involvement (config/testing), moderate business
   - Deploy: high all-hands effort (cutover, training, support)
   - Post-Go-Live: moderate (support, optimization)

## Runtime Flow

### Discover Phase (Weeks 1-8)

1. **Kickoff**
   - Establish governance: sponsor, steering committee, workstream structure
   - Introduce project: scope, timeline, budget, risks

2. **Requirements Gathering**
   - Conduct workshops: business processes, information needs, constraints
   - Interview stakeholders: understand current pain points
   - Document requirements: functional, technical, non-functional, constraints

3. **Current State Analysis**
   - Map current processes: how work flows today
   - Identify inefficiencies: what's broken, what's manual
   - Document master data: volume, quality, structure

4. **Discover Gate**
   - Business approves requirements
   - Executive sponsor confirms scope/timeline/budget/risk tolerance
   - Proceed to Explore

### Explore Phase (Weeks 9-20)

1. **Blueprint Design**
   - Workshops with business and SAP architects
   - Design future-state processes: how SAP will work
   - Document process flows, transaction mappings, system interactions
   - Identify configuration requirements

2. **Fit-Gap Analysis**
   - For each requirement, identify SAP standard capability
   - Document gaps (where SAP doesn't meet requirement)
   - Decide gap resolution: customize, change process, or workaround

3. **Blueprint Finalization**
   - Process architecture: end-to-end processes in SAP
   - System architecture: modules, interfaces, integrations
   - Functional architecture: specific configurations needed
   - Scope decisions: what's building, what's buying, what's configured

4. **Explore Gate**
   - Technical architect reviews and approves blueprint
   - Business stakeholders approve designed processes
   - Customization scope and cost estimated
   - Proceed to Execute

### Execute Phase (Weeks 21-36)

1. **System Setup**
   - Install and configure SAP system
   - Set up development, test, and production environments
   - Configure security and user roles

2. **Configuration**
   - Configure SAP modules per blueprint (FI, CO, MM, SD, etc.)
   - Develop custom code if needed (user exits, enhancements)
   - Set up interfaces with legacy systems
   - Configure reports and extracts

3. **Testing**
   - Unit testing: individual transaction testing by developers
   - Integration testing: transactions across modules (order to invoice)
   - UAT (User Acceptance Testing): business users test processes, validate results

4. **Data Migration Planning**
   - Assess master data: customer, vendor, material, GL (what's needed, condition)
   - Design data cleansing: remove duplicates, standardize formats
   - Plan data load: phased or big-bang cutover approach

5. **Execute Gate**
   - UAT sign-off: business confirms SAP works as designed
   - System performance acceptable
   - Data migration strategy confirmed
   - Proceed to Deploy

### Deploy Phase (Weeks 37-40)

1. **Cutover Planning**
   - Final data loads
   - Security access provisioning: users added to SAP
   - Training completion: all users trained on their processes
   - Support structure: help desk staffed and ready

2. **Parallel Run**
   - Legacy system and SAP both running (typically 1-4 weeks)
   - Validate: legacy and SAP produce same results
   - Identify and fix discrepancies
   - Build confidence: everyone sees SAP working

3. **Cutover Execution**
   - Legacy system shut down
   - Final data loads complete
   - SAP goes live (users switch from legacy to SAP)
   - Support team ready for immediate issue resolution

4. **Deploy Gate**
   - Cutover successful
   - System operational
   - Users able to transact in SAP
   - Proceed to Post-Go-Live

### Post-Go-Live Phase (Weeks 41-48)

1. **Hypercare (Week 1)**
   - Intensive support: consultants and super-users available 24/7
   - Daily issue triage: prioritize and resolve
   - Build user confidence

2. **Issue Resolution (Weeks 2-4)**
   - Resolve issues identified during hypercare
   - Conduct training reinforcement: additional training for struggling users
   - Monitor system performance

3. **Adoption Monitoring (Weeks 4-8)**
   - Track system usage: logins, transactions, adoption metrics
   - Identify low-adoption areas: additional training if needed
   - Optimize processes: fine-tune configurations based on actual usage

4. **Stabilization Gate**
   - System stable and performing
   - Users adopted new processes
   - Support transitioned to business-as-usual model
   - Post-go-live complete

## Configuration

Lifecycle phases include:

1. **Discover Deliverables**
   - Business requirements document
   - Process mapping (current state)
   - Stakeholder interviews summary
   - Executive summary (scope, timeline, cost, risks)

2. **Explore Deliverables**
   - Blueprint (process, system, functional architecture)
   - Fit-gap analysis and resolution decisions
   - Customization scope and estimate
   - Training plan outline
   - Change management strategy

3. **Execute Deliverables**
   - Configured SAP system
   - Test results (unit, integration, UAT)
   - Custom code (if any)
   - Data migration scripts
   - Training materials

4. **Deploy Deliverables**
   - Trained user base
   - Cutover plan executed
   - Data loaded to production
   - Support structure operational
   - System live

5. **Post-Go-Live Deliverables**
   - Issues resolved from go-live
   - Adoption metrics documented
   - Lessons learned captured
   - Optimization recommendations

## Troubleshooting

### Issue 1: Discover Phase Extends, Delaying Project Start
**Symptoms:** Requirements gathering takes 4 months, scope keeps changing, project start delayed

**Root Cause:** Stakeholders unclear on requirements, requirements constantly refined

**Resolution:** Time-box requirements: 6-8 weeks max, then proceed. Refine later if needed. Prioritize: must-have vs nice-to-have requirements.

---

### Issue 2: Explore Phase Produces Design That Doesn't Match Actual SAP
**Symptoms:** During Execute, team discovers designed configuration doesn't work as expected, rework needed

**Root Cause:** Designers unfamiliar with actual SAP, insufficient prototyping

**Resolution:** Senior SAP architect reviews design early. Build prototypes for risky areas during Explore.

---

### Issue 3: Execute Phase Slips Because Testing Incomplete
**Symptoms:** UAT not finished on schedule, business users have other priorities

**Root Cause:** Testing started late, insufficient time allocated, business users not released for testing

**Resolution:** Testing starts early (unit testing during config), business prioritizes testing participation, clear testing schedule agreed up front.

---

### Issue 4: Deploy Phase Cutover Fails, System Down
**Symptoms:** Cutover executed, but system has major issues, legacy system still needed

**Root Cause:** Parallel run too short, data issues not caught, support unprepared

**Resolution:** Sufficient parallel run (validate data quality), cutover readiness gate (checklist verification), adequate support staff trained and ready.

## Common Interview Questions

1. **What are the five phases of an SAP project?**
   Discover (requirements), Explore (design), Execute (configure/test), Deploy (go-live), Post-Go-Live (stabilize).

2. **What's the main deliverable of each phase?**
   Discover: requirements. Explore: blueprint. Execute: configured system. Deploy: live system. Post-Go-Live: stable system.

3. **Why is parallel run important?**
   Validates SAP produces same results as legacy, builds user confidence, catches data quality issues before full cutover.

4. **What's the difference between UAT and user testing?**
   User testing is UAT: business users test processes in configured SAP system to confirm it meets requirements.

5. **How long does each phase typically take?**
   Discover 4-8 weeks, Explore 6-12 weeks, Execute 8-16 weeks, Deploy 2-4 weeks, Post-Go-Live 4-8 weeks (24-48 weeks total).

6. **Can phases overlap?**
   Some: Explore and Execute can overlap (configure while designing). But Discover must finish before Explore, Deploy after Execute.

7. **What causes projects to slip?**
   Late requirements finalization, blueprint rework, testing delays, data quality issues, insufficient parallel run.

## Tough Follow-up Questions

1. **What if Discover takes longer than expected?**
   Time-box it. At 8 weeks, finalize what you have, proceed to Explore. Refine later if needed.

2. **What if you discover during Execute that the design won't work?**
   Address immediately: adjust design or customize to match requirements. Escalate if major rework needed.

3. **What if users aren't ready for go-live at scheduled date?**
   Delay go-live if users unprepared. Forcing go-live with unprepared users creates post-go-live chaos.

4. **How do you handle scope change mid-project?**
   Use change control: assess impact on timeline/cost/resources, steering committee approval required, adjust plan.

## SAP Transactions

- SPRO: Navigate phases, understand configuration options
- Transaction-specific (varies by module configuration)

## SAP Tables

- Varies by phase and module

## Best Practices

- **Follow the phases:** each phase builds on prior deliverables
- **Clear gates:** each phase ends with decision gate (proceed/rework/stop)
- **Adequate time allocation:** don't rush phases to save time initially
- **Early testing:** start testing early in Execute, not at the end
- **Sufficient parallel run:** typically 2-4 weeks minimum
- **Resource continuity:** key people stay through project lifecycle
- **Regular steering committee:** decisions made promptly, keeps project moving

## Common Mistakes

- **Skipping Explore (design):** jumping straight to configuration, causes rework
- **Insufficient testing:** cutting corners on UAT, issues appear post-go-live
- **Insufficient parallel run:** cutting cutover timeline, data issues not caught
- **Unprepared support:** support team not trained and ready at go-live
- **Phase overlap without management:** overlapping phases without clear coordination causes rework

## Interviewer's Hidden Expectations

- **Structured thinking:** do you understand projects follow phases?
- **Realistic timelines:** do you know each phase takes realistic time?
- **Decision gates:** do you understand phases end with decisions (proceed/rework)?
- **Pragmatism:** do you know shortcuts (skipping Explore) cause problems later?

## What Makes This a 10/10 Answer

- Candidate explains the six SAP Activate phases and the evidence that closes each one
- Discusses realistic timeline for each phase
- Shares example: phase issue (design problem, testing overrun) and how it was managed
- Understands phase gates and decision criteria
- Explains why phases can't be skipped (Explore informs Realize)
- Discusses resource needs variation across phases
- Shows awareness: skipping phases creates rework later

## Red Flags

- Candidate doesn't know the phases or their sequence
- Confuses Explore with Realize, or calls the build phase Execute
- Hasn't participated in a structured project lifecycle
- Thinks timeline can be cut by combining phases

## Keywords

- Project lifecycle
- Discover phase
- Explore phase
- Realize phase
- Deploy phase
- Run phase
- Phase gates
- Parallel run
- Cutover

## Related Topics

- [Blueprinting](./blueprinting.md)
- [Project Governance](./project-governance.md)
- [Change Management](./change-management.md)
