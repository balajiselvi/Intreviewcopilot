# RISE Project Management and Governance

## Overview

RISE projects represent a fundamental shift in how SAP implementations are executed. Unlike traditional implementations that could take 2–3 years, RISE projects adopt a cloud-centric, agile, pre-configured approach designed to accelerate time-to-value. A RISE project involves not just software deployment but organizational transformation: moving from on-premise to cloud, adopting new processes, building new skills, and establishing governance structures for a cloud-native SAP environment. Understanding project governance, phasing, resource models, and change management is critical for anyone supporting or leading RISE initiatives at enterprise scale.

## Interview Summary

RISE projects use pre-built industry packages, accelerated methodologies, and cloud-native governance to compress implementation timelines from years to months. Success depends on clear business case alignment, executive sponsorship, experienced partner selection, and structured change management.

## 30 Second Interview Answer

RISE is a cloud implementation model where SAP provides a pre-configured, industry-specific S/4HANA system with built-in best practices, reducing customization and shortening go-live from years to months. A RISE project includes infrastructure (SAP Cloud Infrastructure), proven implementation methods (RISE methodology), and managed services. The key difference from traditional implementations: less design, more adoption of SAP's standard processes.

## 60 Second Interview Answer

RISE projects follow a structured methodology tailored by industry: Financial Services, Manufacturing, Public Sector, etc. The approach involves business case development, team formation, process adoption workshops, and phased go-live. SAP provides the cloud infrastructure through BTP and/or SAP Cloud Infrastructure; the customer provides business leadership, subject-matter experts, and change champions. The project timeline typically spans 6–12 months from kickoff to go-live, compared to 24–36 months for traditional implementations. Critical success factors include executive sponsorship, willingness to adopt SAP standard processes rather than force customization, and skilled partner guidance.

## 90 Second Interview Answer

A RISE project is a complete engagement: business case development, organizational readiness assessment, team ramp-up, process workshops, configuration, testing, hypercare, and knowledge transfer. SAP's methodology is pre-built and proven, reducing guesswork about what works. The customer's role is to understand their business, identify gaps with SAP standard processes, and make deliberate decisions about which processes to change versus customize. A skilled project manager ensures clear scope, manages stakeholder expectations, and keeps the team focused on adoption over customization. Most RISE implementations adopt 70–80% of SAP standard processes, customize 15–20%, and leave 5% for future phases. The phased go-live approach—typically Wave 1 (core financials), Wave 2 (operations), Wave 3+ (analytics, advanced features)—spreads risk and builds organizational capability incrementally. Success is measured not by go-live date but by adoption quality, user satisfaction, and business value realization 3–6 months post-go-live.

## Architecture

RISE projects operate within a governance structure that includes:

1. **Steering Committee** — Executive leadership (CFO, COO, CIO) providing strategic direction and resolving escalations
2. **Program Management Office (PMO)** — Overseeing timeline, budget, resource allocation
3. **Project Core Team** — Project Manager, Business Analyst, Solution Architect, Technical Lead, Change Manager
4. **Workstream Leads** — Finance, Supply Chain, Manufacturing, HR, etc. (by industry/company structure)
5. **Partner Organization** — Implementation partner (Deloitte, Accenture, SAP Consulting) providing methodology and experts
6. **SAP RISE Support** — Managed service provider offering cloud infrastructure, Proactive Client Services (PCS), and escalation support

The project phases align with RISE methodology:
- **Discover** (Weeks 1–4): Business case, gap analysis, team formation
- **Explore** (Weeks 5–12): Process workshops, configuration design, test strategy
- **Execute** (Weeks 13–32): Configuration, build, testing (system/integration/user acceptance)
- **Deploy** (Weeks 33+): Go-live preparation, cutover, hypercare, knowledge transfer

## Runtime Flow

1. **Initiation Phase** (Executive decision)
   - Executive sponsor identified
   - Business case approved (ROI, timeline, budget)
   - RISE package and cloud option selected (SAP Cloud Infrastructure vs BTP)

2. **Team Assembly**
   - Project Manager hired/assigned
   - Partner engaged (formal SOW signed)
   - Core team formed: Business Analyst, Solution Architect, Technical Lead, Change Manager
   - Workstream leads assigned from customer organization

3. **Discover Phase**
   - As-is process documentation (current state)
   - To-be process design (SAP standard processes)
   - Gap analysis (what requires customization vs process change)
   - Team enablement (training on RISE methodology, SAP basics)

4. **Explore Phase**
   - Detailed process workshops with business users
   - Configuration template applied (industry-specific best practices)
   - Design documents prepared (system, security, integration, reporting)
   - Test strategy and test cases developed

5. **Execute Phase**
   - Configuration in sandbox environment
   - Build (customization, custom development if necessary)
   - Unit testing by development team
   - System testing by technical team
   - Integration testing with interfaces and extensions
   - User acceptance testing (UAT) with business users

6. **Deploy Phase**
   - Production environment setup
   - Cutover planning (data migration, manual processes for delta period)
   - Go-live readiness review
   - Cutover execution (data load, configuration transport, system startup)
   - Hypercare (1–2 weeks of intensive post-go-live support)
   - Knowledge transfer and hand-off to operations

7. **Post-Go-Live**
   - Operational support period (typically 2–3 months with partner/SAP support)
   - Business value realization review (6 months post-go-live)
   - Future enhancement planning (Wave 2, advanced analytics, etc.)

## Configuration

RISE projects use SAP's RISE methodology, which is delivered through:

1. **SAP Activate Methodology** — Accelerated, best-practice-driven approach with predefined roles, templates, and checklists
2. **RISE Package Scope** — Industry-specific configuration templates that pre-populate 70% of typical configuration
3. **Solution Configuration and Implementation** (SCI) tool — Cloud-based collaboration platform where RISE scope is documented, assigned, and tracked

Key configuration elements:

- **Business Processes:** Identified and matched to SAP standard (APQC framework)
- **Roles and Authorizations:** Pre-built role templates by industry, customized per organization
- **Transports and Change Control:** Configuration transported through dev → test → prod environments
- **Extension Strategy:** Custom fields, custom logic, and APIs documented and prioritized
- **Data Migration Strategy:** Legacy system integration, data cleansing, and validation rules
- **Reporting and Analytics:** BW/4HANA or Embedded Analytics configured based on industry needs

Project governance artifacts include:
- Business Case (ROI, business value drivers)
- Scope Statement (what's included, what's deferred)
- Gap/Fit Analysis (SAP standard vs customer requirement)
- Project Schedule (phases, milestones, resource allocation)
- Communications Plan (stakeholder updates, status reviews)
- Risk Register (risks identified, mitigation strategies, owners)
- Change Control Log (scope change requests and approvals)

## Implementation Activities

1. **Business Case Development**
   - Quantify business drivers (cost reduction, revenue growth, time-to-market, compliance)
   - Estimate investment required (software, infrastructure, implementation services, internal resources)
   - Model financial ROI (payback period, NPV, internal rate of return)
   - Identify success metrics (operational KPIs, user adoption, business outcome targets)

2. **Partner Selection and Engagement**
   - Evaluate implementation partners (Big 4, SAP Consulting, regional specialists)
   - RFP process (detailed scope, methodology, team experience, references)
   - Contract negotiation (fixed price vs time-and-materials, risk allocation, governance)
   - Partner kickoff (team introductions, methodology overview, communication cadence)

3. **Organization Readiness**
   - Assess current-state capability (process maturity, technical skills, change readiness)
   - Identify capability gaps and training needs
   - Establish governance structure (steering committee, PMO, workstreams)
   - Secure executive sponsorship and resource commitment

4. **Discovery and Design**
   - Document as-is processes with business users
   - Facilitate to-be workshops (what SAP standard processes look like)
   - Gap/fit analysis (what requires customization, what can be simplified)
   - Design decisions (centralized vs decentralized processes, master data governance)

5. **Configuration and Customization**
   - Apply RISE industry template
   - Configure additional modules (Finance, Supply Chain, Manufacturing, HR)
   - Develop custom code (user exits, enhancements, API integrations)
   - Build data migration jobs and validation rules

6. **Testing Coordination**
   - Develop test cases (functional, integration, performance, security)
   - Plan UAT cycles and user participation
   - Establish defect logging and resolution process
   - Conduct go-live readiness review (all risks mitigated, known issues documented)

## Migration Activities

1. **Legacy System Integration**
   - Identify data to be migrated (master data, transactional data, historical data)
   - Define data cleansing and enrichment rules
   - Design migration architecture (batch jobs, real-time replication if needed)
   - Test migration scenarios (full migration, parallel run, delta load)

2. **Parallel Run Approach**
   - Run legacy system and SAP system in parallel for a defined period (typically 1 pay cycle)
   - Compare results (reconciliation of financial data, inventory, customer orders)
   - Use parallel run for final validation before cutover

3. **Cutover Planning**
   - Define cutover window (weekend, month-end, or targeted window)
   - Document all manual processes for the transition period
   - Plan production environment setup (HA/DR, backup/recovery, monitoring)
   - Develop rollback procedures if cutover fails

4. **Data Migration Execution**
   - Load master data (GL accounts, cost centers, customers, vendors, materials)
   - Load transactional data (open orders, open invoices, inventory)
   - Validate all data loads (reconciliation, completeness, data quality)
   - Perform final close-out of legacy system transactions

## Rollout Activities

1. **Phased Go-Live Strategy**
   - Wave 1: Core financials (GL, AP/AR, cost accounting)
   - Wave 2: Operational modules (Procurement, Inventory, Sales)
   - Wave 3+: Advanced features (Analytics, SuccessFactors, Ariba)
   - Each wave is 4–8 weeks apart, allowing team learning and stabilization

2. **Regional Rollout Planning**
   - If multi-regional, plan go-live sequence (pilot region, then roll out to others)
   - Use pilot learnings to optimize cutover for subsequent regions

3. **Training and Enablement**
   - End-user training (2–3 days before go-live, hands-on in sandbox)
   - Support team training (basis, functional support, change management)
   - Train-the-trainer approach (business power users become second-level support)

4. **Go-Live Execution**
   - Issue management (hotline during go-live for urgent issues)
   - Data validation (reconciliation of opening balances, account balances)
   - User support (dedicated support desk for first week)
   - Executive reporting (daily status updates during go-live week)

5. **Hypercare Support**
   - Extended support for 1–2 weeks post-go-live
   - On-site presence (partner consultants available for critical issues)
   - Daily sync calls (issues identified, workarounds, patches)
   - Knowledge transfer (support team learning operational procedures)

## Production Support Activities

1. **Post-Go-Live Stabilization** (Weeks 1–4)
   - Defect triage and resolution
   - Performance monitoring and tuning
   - Data validation and reconciliation
   - Issue escalation (L1 support → partner → SAP if necessary)

2. **Operational Handoff** (Weeks 5–12)
   - Transition from implementation partner to internal IT operations
   - Establish support SLAs (response time, resolution time)
   - Document operational procedures (backup/restore, patch management, user provisioning)
   - Establish change management process for post-go-live changes

3. **Ongoing Operations** (Post-go-live)
   - Monitor system availability, performance, security
   - Manage monthly/quarterly patches and updates (SAP Update)
   - Process new user onboarding
   - Support business process refinements and process optimization
   - Plan future enhancements (Wave 2, advanced features, new modules)

4. **Business Value Realization**
   - Track KPIs identified in business case (cost reduction, efficiency gains)
   - Identify value leakage (where expected savings aren't realized)
   - Plan corrective actions (additional training, process refinement)
   - Communicate success to executive stakeholders

## Troubleshooting

### Issue 1: Scope Creep and Budget Overrun
**Symptoms:** Project timeline extends beyond planned go-live, budget consumed faster than planned, team frustrated by constant new requirements.

**Root Cause:** Weak scope management, unclear prioritization of requirements, business stakeholders requesting enhancements during execution phase, underestimated customization needs.

**Resolution:**
- Establish clear scope gate at end of Discover phase; any new requirements must go through formal change control
- Categorize requirements as Wave 1 (go-live), Wave 2, or Future; defer non-critical work
- Implement change control board with executive authority to approve/reject scope changes
- Track all changes with associated impact (cost, timeline, resource)
- Use RISE discipline: adopt standard processes rather than customize

---

### Issue 2: Team Turnover and Knowledge Loss
**Symptoms:** Key team members leave during project (partner consultant, project manager, key business analyst), continuity disrupted, project timeline impacts.

**Root Cause:** Long project timelines, burn-out, competing priorities, external job opportunities, inadequate backup/cross-training.

**Resolution:**
- Conduct knowledge-transfer sessions continuously (not just at end)
- Cross-train team members on critical roles (project management, architecture decisions)
- Document all design decisions in shared wiki/repository
- Establish incentive for key team members to stay through go-live (bonus, recognition)
- Partner engagement agreement should include guaranteed resource continuity

---

### Issue 3: User Adoption Resistance
**Symptoms:** Users reluctant to use new system, work-arounds being created, support tickets spike after go-live, business leaders frustrated by low adoption.

**Root Cause:** Inadequate change management, users not involved in design, training insufficient, fear of job loss, system doesn't match how they work.

**Resolution:**
- Establish change management workstream from day one (not an afterthought)
- Involve business users in process design and configuration decisions
- Provide role-based training before go-live (hands-on, not just lectures)
- Use business change champions to drive adoption (incentivize participation)
- Collect user feedback and respond quickly (shows their voice is heard)
- Plan post-go-live optimization (allow 1–2 months for stabilization, then gather improvement ideas)

---

### Issue 4: Data Quality and Migration Failures
**Symptoms:** Data loads fail repeatedly, reconciliation mismatches discovered during UAT or after go-live, customers complaining about incorrect data, financial close delayed.

**Root Cause:** Incomplete as-is data assessment, data cleansing inadequate, migration logic errors, insufficient testing of migration jobs.

**Resolution:**
- Audit legacy system data before project starts (identify data quality issues early)
- Establish data governance team responsible for data cleansing
- Test migration jobs with realistic data volumes and complexity
- Reconcile manually extracted data vs system data (use LSMW or XI to validate)
- Plan delta migration for cut-over period (capture transactions between final load and go-live)
- Document all data assumptions and limitations in Data Migration Plan

---

### Issue 5: Technical Performance Issues Post-Go-Live
**Symptoms:** System is slow during peak hours, batch jobs fail due to locks, reports run for hours instead of minutes, users complain about productivity loss.

**Root Cause:** Inadequate performance testing before go-live, database not sized for production load, custom code has performance issues, poor index strategy.

**Resolution:**
- Conduct performance testing during Execute phase with production-like data volumes
- Identify and optimize slow-running reports/batch jobs before go-live
- Baseline system performance (response times, throughput) during UAT
- Monitor actual performance post-go-live and compare to baseline
- Engage SAP Basis team or partner for performance tuning (index strategy, system parameters)
- Have performance testing expertise available during hypercare period

## Common Interview Questions

1. **What is RISE and how does it differ from traditional SAP implementations?**
   RISE is a cloud-centric, pre-configured implementation model that leverages industry-specific best practices to reduce timeline and customization. Traditional implementations could take 2–3 years with significant custom development; RISE targets 6–12 months with 70–80% adoption of SAP standard processes, reducing cost and risk.

2. **What are the key phases of a RISE project?**
   Discover (gap analysis, team formation), Explore (process design, configuration planning), Execute (build, testing), Deploy (go-live preparation, cutover), and Post-Go-Live (hypercare, optimization).

3. **What is the role of the Steering Committee in a RISE project?**
   The Steering Committee provides executive oversight, approves business case, resolves escalations beyond project management, and ensures executive sponsorship. Typically includes CFO, COO, CIO, and key business line leaders.

4. **What are the critical success factors for a RISE project?**
   Clear business case alignment, strong executive sponsorship, willingness to adopt SAP standard processes, experienced partner, skilled project manager, effective change management, and adequate training/enablement.

5. **How is scope managed in a RISE project?**
   RISE uses a formal Scope Statement and change control process. New requirements beyond Discover phase require formal change request, impact analysis, and steering committee approval. Wave-based approach defers non-critical work.

6. **What is the typical team structure for a RISE project?**
   Steering Committee (executive leadership), PMO (program oversight), Project Core Team (PM, BA, Architect, Tech Lead, Change Manager), Workstream Leads (by functional area), and partner organization providing methodology and expertise.

7. **What is RISE methodology and why does it accelerate implementation?**
   RISE methodology is SAP's proven best-practice approach (similar to SAP Activate). It includes predefined roles, templates, and checklists that eliminate design rework. Industry-specific RISE packages provide 70% pre-built configuration, reducing customization effort.

8. **How are waves used in RISE projects?**
   Waves are phased go-lives (Wave 1: core financials, Wave 2: operations, Wave 3+: advanced features). Typically 4–8 weeks apart, waves spread risk and allow organizational learning between go-lives.

9. **What is the role of change management in a RISE project?**
   Change management addresses user adoption, organizational transformation, and resistance. Includes communications, training, stakeholder engagement, and culture change activities. Critical for driving adoption and realizing business value post-go-live.

10. **What is hypercare and why is it important?**
    Hypercare is 1–2 weeks of intensive post-go-live support with partner consultants on-site. Focuses on immediate issue resolution, user support, data validation, and knowledge transfer to internal operations team.

11. **How is risk managed in a RISE project?**
    Risks are identified during Discover, tracked in Risk Register with ownership and mitigation strategies. Executive sponsor and PMO review risks weekly. Go-live readiness review confirms all high-risk items mitigated.

12. **What is the data migration strategy in RISE?**
    RISE includes data migration planning during Explore phase. Strategy includes master data identification, data cleansing, migration job development, parallel run (for validation), and delta migration for cutover period.

13. **How is testing organized in a RISE project?**
    RISE uses structured testing approach: Unit testing (developer), System testing (technical team), Integration testing (with interfaces), Performance testing (to validate system sizing), and UAT (business users). Each phase has defined entry/exit criteria.

14. **What is the role of the business analyst in a RISE project?**
    Business analyst documents as-is processes, facilitates to-be workshops with users, translates business requirements into configuration, develops UAT test cases, and supports hypercare.

15. **What are the typical timelines for each RISE phase?**
    Discover: 4–6 weeks, Explore: 8–10 weeks, Execute: 20–24 weeks, Deploy: 2–4 weeks (includes cutover + hypercare). Total project duration: typically 6–12 months from kickoff to stable operations.

16. **What is cutover and what must be planned for it?**
    Cutover is the switch from legacy system to SAP system (typically over a weekend or month-end). Planning includes data loads, configuration transport, system startup, manual processes documentation, and rollback procedures.

17. **How is business value measured post-go-live?**
    KPIs established in business case (cost reduction, efficiency gains, time-to-market) are tracked 3–6 months post-go-live. Variance from plan indicates where adoption is weak or processes need refinement.

18. **What is the typical SAP RISE contract structure?**
    RISE bundles software (S/4HANA), cloud infrastructure (SAP Cloud Infrastructure or BTP), managed services (PCS), and optional implementation partner services. Pricing is subscription-based (monthly or annual).

19. **How are custom developments handled in RISE?**
    RISE methodology prioritizes standard processes; custom development is deferred to Wave 2 or later. Custom code must be documented, tested, and managed through configuration transport process.

20. **What is the role of Proactive Client Services (PCS) in RISE?**
    PCS is SAP's managed service providing cloud operations (backup, patching, monitoring), proactive support (early issue detection), and recommended actions. Included in RISE subscription, helps reduce customer operational overhead.

## Tough Follow-up Questions

1. **What would you do if the project is 3 months behind schedule one month before planned go-live?**
   Assess what's causing the delay (requirements unclear, testing finding major issues, resourcing problems). Evaluate options: compress timeline (extend working hours, add resources), descope (defer non-critical work to Wave 2), or extend go-live (communicate impact to business). Escalate to steering committee with impact analysis and recommendation.

2. **How would you handle a situation where the business stakeholder wants a significant customization that conflicts with RISE best practices?**
   First, understand the business driver (regulatory requirement, unique competitive advantage, legacy system limitation). Facilitate design workshop to explore SAP standard process and gap analysis. If customization is still justified, submit formal change request with cost/timeline impact. Use go/no-go decision process (steering committee approves based on ROI).

3. **What if key partner consultants leave the project during critical Execute phase?**
   Immediately activate backup resources from partner (contractual obligation). Conduct knowledge transfer with departing consultants. Accelerate cross-training of internal team on critical tasks. If necessary, bring in interim resources to backfill. Document all design decisions in shared repository to reduce knowledge loss.

4. **How would you address user adoption resistance if UAT reveals widespread discomfort with the new system?**
   Acknowledge concerns and involve users in solution design. Assess whether concerns reflect inadequate training (fix training approach) or genuine process misalignment (may require design modification). Extend UAT period to build confidence. Establish post-go-live user feedback loop. Don't ignore adoption risks; they often materialize as support overload after go-live.

5. **What would you do if data migration testing reveals unexpected data quality issues in the legacy system?**
   Pause migration timeline, conduct deep data audit in legacy system. Establish data cleansing task force to fix root causes (data entry errors, missing master data, unreconciled transactions). Re-test migration with cleaned data. Update data governance plan to prevent recurrence. Communicate delay impact to steering committee.

6. **How would you approach a situation where the implementation partner is not delivering to expected quality standards?**
   Document specific quality issues (scope gaps, missed deadlines, rework needed). Meet with partner leadership and account executive to discuss concerns. Request corrective action plan with clear expectations. If partner fails to improve, escalate to contract terms (possible termination, replacement, penalty clauses).

7. **What if a post-go-live production issue is severe (e.g., system down, data integrity problem) and both partner and SAP support are unavailable immediately?**
   Declare P1 incident, activate incident response team. Engage on-call support from SAP. Document all troubleshooting steps. If rollback is necessary, execute rollback procedure (revert to backup, run legacy system parallel if available). Communicate status to executive leadership and affected business units frequently.

8. **How would you manage a project where the customer wants to keep doing things differently from SAP best practices?**
   Validate the business case for deviation. Use SAP Industry Reference Model to show how other companies handle similar scenario. Facilitate design workshop with customer to identify concerns. Compromise: adopt SAP standard where possible, customize only high-value or genuine business needs. Document decision rationale for future reference.

9. **What if testing discovers a critical defect that requires major rework days before scheduled go-live?**
   Assess defect severity and scope of rework. If go-live can proceed with workaround or manual process, document the temporary solution and plan permanent fix for Wave 2. If defect prevents go-live, communicate impact to business, escalate to steering committee. Consider brief delay (48–72 hours) to fix critical defect vs proceeding with risk.

10. **How would you approach cost and timeline estimation for a RISE project if the business case assumptions prove wrong during Discover phase?**
    Update business case with new insights. Recalculate ROI based on new timeline and cost estimates. Present options to steering committee: proceed with updated assumptions, reduce scope to maintain timeline, or delay start. Decisions should be informed by updated business case, not optimistic assumptions.

11. **What if the customer has unrealistic expectations about what RISE can deliver vs what they think they need?**
    Early in Discover, conduct gap analysis and present findings to business leadership. Use SAP Industry Reference Model to show what similar companies achieve with RISE. Set expectations: RISE delivers best practices, not custom functionality. Agree on Wave approach (core in Wave 1, customization in Wave 2) to manage expectations.

12. **How would you handle a situation where the executive sponsor loses interest or changes priorities mid-project?**
    Escalate immediately to PMO. Assess sponsor replacement (new C-level owner or transition sponsor). Re-establish executive steering committee cadence. Emphasize business case ROI to keep leadership engaged. Use wins and milestones to build momentum and executive confidence.

13. **What if post-go-live business metrics show the project didn't deliver expected ROI?**
    Conduct detailed variance analysis (what changed, why was ROI not achieved). Common reasons: lower adoption than planned, processes not followed as designed, insufficient training, external market factors. Develop corrective action plan (additional training, process refinement, phase 2 enhancements). Communicate findings and plan to steering committee.

14. **How would you address a situation where team members disagree about the best technical architecture for RISE?**
    Facilitate architecture design workshop. Present options with trade-offs (cost, complexity, performance, maintainability). Document decision rationale. Make decision; don't let indecision delay project. Revisit if new constraints emerge (e.g., performance testing reveals architecture issue).

15. **What if the customer wants to defer critical wave 1 scope to wave 2 due to budget constraints, but wave 1 is already minimal?**
    Assess business impact of deferral (which business users are affected, what manual workarounds would be necessary). Model impact on Wave 1 ROI. Discuss with steering committee: defer scope vs accept higher budget. Often, minimal Wave 1 with strong execution is better than delayed, half-baked Wave 1.

## SAP Transactions

- SM50: Monitor active sessions (performance monitoring)
- SAP Solution Manager: Project tracking and issue management
- RSPARAM: Display system parameters (performance tuning)
- SMLT: Load Testing Tool (performance testing)
- LSMW: Legacy System Migration Workbench (data migration)
- SE01: Transport Organizer (configuration transport)
- SM30: Table Maintenance (data entry/editing)
- SU01: User maintenance (user provisioning)
- PFCG: Profile Generator (authorization assignment)
- VA01: Create Sales Order (transaction example for testing)
- MIGO: Goods Receipt (transaction for inventory testing)
- FB01: Post General Ledger Entry (transaction for finance testing)
- ME21: Create Purchase Requisition (procurement testing)
- S_ALR_87012013: Material Ledger report
- FBL1N: Vendor line items report
- FBL5N: Customer line items report

## SAP Tables

- TSTC: SAP Transactions (transaction code definitions)
- TCODE: Transaction code table (similar to TSTC)
- USR01: User master data
- PFCG: Role definitions
- AGR_1249: Role/authorization assignment
- MARA: Material master
- KNA1: Customer master
- LFA1: Vendor master
- BKPF: General Ledger header
- BSEG: General Ledger line items
- VBAK: Sales order header
- VBAP: Sales order line items
- MKPF: Material Document header
- MSEG: Material Document line items
- EKKO: Purchase order header
- EKPO: Purchase order line items

## Best Practices

- **Start with clear business case:** Quantify business drivers, ROI, success metrics before project kickoff. Revisit during Discover phase to confirm assumptions.
- **Executive sponsorship is non-negotiable:** Project without strong C-level sponsor is 3x more likely to fail. Invest in sponsor engagement, ensure they remove obstacles.
- **Adopt RISE discipline:** Resist customization pressure. Most customization is wants, not needs. Use Wave approach to defer non-critical customization to Wave 2+.
- **Invest in change management from day one:** Don't treat change management as an afterthought. Business process change is harder than software deployment.
- **Balance speed with quality:** RISE timelines are aggressive. Don't compromise on UAT quality or hypercare coverage to meet timeline.
- **Establish clear governance:** Weekly status to steering committee, issue escalation process, change control board for scope. Governance prevents surprises.
- **Cross-train team members:** Don't rely on single point of knowledge. Document all design decisions, facilitate knowledge transfer early and often.
- **Use waves strategically:** Wave 1 should be minimal, achievable, and deliver core business value. Waves 2+ allow organizational learning and advanced features.

## Common Mistakes

- **Underestimating business process change effort:** Companies expect fast implementation like software installation; actually requires organizational change, training, adoption work.
- **Treating RISE like traditional implementation:** RISE has different expectations (adopt standard processes, less customization). Using traditional methodology on RISE leads to scope creep and schedule overrun.
- **Weak executive sponsorship:** Executive sponsor visible only at kickoff and go-live. Without ongoing sponsor engagement, project lacks authority to drive change.
- **Insufficient change management:** Business users resent imposed change; adoption suffers. Invest in communications, training, stakeholder engagement, change champions.
- **Data migration as afterthought:** Postponing data migration planning until Execute phase causes rework. Plan data migration in Discover, execute pilots during Explore.
- **Inadequate testing discipline:** Skipping performance testing, integration testing, or UAT cycles leads to post-go-live surprises and support overload.
- **Customization instead of adoption:** Every customization request becomes an argument; each custom development slows delivery and increases maintenance. Default to "adopt standard."
- **No Wave planning:** Trying to deliver everything in Wave 1 leads to scope creep and missed timelines. Wave approach distributes work, spreads risk, allows learning.

## Interviewer's Hidden Expectations

- **Understand business drivers:** A candidate who can articulate ROI, business case drivers, and success metrics demonstrates thinking beyond technology.
- **Practical RISE experience:** Have you managed or participated in a RISE project? Can you speak to real decisions, challenges, outcomes?
- **Change management awareness:** Do you treat RISE as a people/process change initiative or just a software project? Change management skills are critical.
- **Governance discipline:** Can you describe project governance, escalation processes, and how you keep projects on track despite chaos?
- **Realistic timeline expectations:** RISE timelines are tight (6–12 months). A candidate who acknowledges this and discusses trade-off decisions shows maturity.
- **Team leadership:** Can you describe how you built, motivated, and retained a high-performing project team?
- **Wave strategy:** Understanding why waves are strategic (not an afterthought) shows depth of project thinking.

## What Makes This a 10/10 Answer

- Candidate explains RISE business model and why it accelerates implementation
- Discusses executive sponsorship, change management, team structure as critical success factors
- Can articulate RISE phasing (Discover, Explore, Execute, Deploy) and Wave approach with specifics
- Shares concrete example from real project (challenge faced, how it was resolved, outcome)
- Mentions data migration, testing, hypercare, and post-go-live support as non-negotiable aspects
- Acknowledges trade-offs and constraints (can't customize everything, must adopt standard processes)
- Demonstrates understanding of organizational change (not just technical implementation)
- Shows knowledge of RISE tools and SAP Activate methodology

## Red Flags

- Treats RISE like traditional SAP implementation ("I can do 5-year implementation in 6 months")
- Focuses only on technical aspects (configuration, testing) and ignores change management
- No mention of business case, ROI, or business value
- No awareness of RISE phasing, Waves, or accelerated methodology
- Hasn't participated in actual RISE project but claims deep expertise
- Proposes extensive customization ("we'll customize 50% of configuration") — misunderstands RISE approach
- No understanding of executive sponsorship or governance
- Treats hypercare as optional or minimal ("1 week should be enough")

## Keywords

- RISE (Recognized, Implemented, Supported, Empowered)
- SAP Activate methodology
- Industry-specific package
- Phased go-live / Wave approach
- Gap/Fit analysis
- Scope creep
- Executive sponsorship
- Change management
- Hypercare
- Business case ROI
- Master data governance
- Data migration
- Cutover
- Adoption
- Business value realization

## Related Topics

- [RISE with SAP Overview](./rise-overview.md)
- [RISE Cloud Infrastructure](./public-cloud.md)
- [RISE Implementation](./private-cloud.md)
- [RISE Security](./rise-security.md)
- [Cutover and Go-Live](../cutover/cutover.md)
- [Project Management](../project-management/project-mgmt.md)
- [Change Management](../project-management/change-mgmt.md)
- [Data Migration](../project-types/data-migration.md)
