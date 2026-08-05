# RISE Cutover and Go-Live Execution

## Overview

A RISE cutover is the high-stakes transition moment when an organization switches from legacy systems to cloud-native S/4HANA. Unlike traditional implementations where cutover might be months long, RISE cutover typically happens in 48–72 hours (Friday evening to Monday morning for most organizations). This compressed window requires meticulous planning, clear communication, extensive testing, and a disciplined cutover team that executes without deviation. Understanding cutover strategy, communication cadence, rollback procedures, and post-go-live stabilization is essential for anyone managing or supporting RISE go-lives at enterprise scale.

## Interview Summary

A RISE cutover is a planned, choreographed transition from legacy to cloud systems occurring over a compressed weekend window. Success depends on a detailed cutover plan, clear go/no-go decision criteria, disciplined team execution, and comprehensive post-cutover validation and support.

## 30 Second Interview Answer

RISE cutover is the planned switch from legacy to cloud S/4HANA, typically executed over a weekend (Friday evening to Monday morning). Activities include final data loads, configuration transport to production, system startup validation, and hypercare support. Go-live readiness review (performed before cutover) confirms all risks mitigated and system ready. Post-cutover, reconciliation validates data completeness, and users are trained and prepared. Most RISE cutover windows are 48–72 hours; any longer risks extended business disruption.

## 60 Second Interview Answer

RISE cutover executes over a compressed window (typically Friday 6pm to Monday 6am) to minimize business disruption. The cutover team, onsite or remote, executes a detailed cutover runbook covering data loads, configuration transport, system startup, connectivity validation, and hypercare initiation. Pre-cutover, extensive testing and a go/no-go decision confirm readiness. During cutover, a war room maintains real-time communication; any critical issues trigger escalation or rollback decision. Post-cutover Monday, users log in to RISE; support team handles questions and issues. Hypercare runs 1–2 weeks post-go-live, providing intensive support and knowledge transfer. Most challenges are operational (order of operations mistakes, configuration transport delays, data load failures) rather than technical. Clear communication—daily updates to stakeholders, transparent issue escalation—is critical to maintaining confidence during the vulnerable cutover period.

## 90 Second Interview Answer

RISE cutover is meticulously planned execution: every team member knows their role (who loads master data, who starts batch jobs, who validates GL balance), timing is precisely choreographed (data load starts at 7pm, configuration transport at 8pm, system startup at 9pm, validation at 10pm), and escalation paths are clear (if data load fails, does team retry, or escalate to steering committee for rollback decision?). Pre-cutover, a comprehensive go-live readiness review confirms all major risks mitigated: testing passed UAT, data migration parallel run validated, training completed, support team ready. The cutover runbook (step-by-step playbook) guides the team minute-by-minute. War room culture is critical: transparent communication (daily updates to stakeholders, hourly updates during cutover), rapid decision-making (if issue discovered, decide in minutes whether to proceed or rollback), and blame-free culture (focus on solving problems, not assigning fault). Post-go-live Monday, users enter RISE; support team monitors for urgent issues (system down, missing data, critical process failures). Hypercare runs 1–2 weeks: partner consultants on-site or on-call, intensive support for configuration issues, and knowledge transfer to internal operations team. Real-world cutover complexity often comes from low probability scenarios: data load takes 2x longer than estimated, configuration transport fails and must be re-run, a critical custom development has a bug discovered too late to fix, or an unexpected dependency between systems surfaces. Mature RISE teams prepare contingencies: rollback procedures (how to revert to legacy if necessary), parallel workarounds (if a process can't run in RISE temporarily, what manual process takes its place), and communication templates (stakeholder notification if cutover extends beyond planned window).

## Architecture

RISE cutover operates within a structured architecture:

1. **Cutover Team Structure**
   - Cutover Manager — Overall coordination, escalation authority
   - Data Manager — Oversees final data loads and validation
   - Technical Manager — Configuration transport, system startup, infrastructure
   - Support Manager — Hypercare team coordination, issue triage
   - Functional Leads — Finance, Supply Chain, Operations (business process validation)
   - Business Sponsor — Executive accountability, go/no-go decision authority

2. **Environments**
   - Sandbox/Dev → Test → Staging (pre-production-ready) → Production (live system)
   - Configuration transported through each environment; final transport to Prod during cutover
   - Production environment pre-built, monitored, ready for system startup

3. **Communication Structure**
   - War Room — Central command during cutover (in-person or virtual)
   - Escalation Matrix — Clear path for escalating issues (Cutover Manager → Business Sponsor → Steering Committee)
   - Stakeholder Updates — Executive dashboard updated hourly during cutover, daily post-go-live
   - User Support Hotline — Support desk available for user questions during first week

4. **Support Infrastructure**
   - Hypercare team (partner + customer) onsite or on-call during first 1–2 weeks
   - Monitoring/alerting setup (proactive detection of issues vs reactive user reports)
   - Backup/restore procedures (if critical data corrupted, restore from backup)
   - Rollback procedures (how to revert to legacy system if necessary)

## Runtime Flow

1. **Pre-Cutover Phase (Weeks 1–2 before cutover)**
   - Execute final system testing in staging environment (final simulation of cutover)
   - Conduct go-live readiness review: all major risks documented and mitigated, sign-off from steering committee
   - Prepare cutover runbook (step-by-step sequence of activities, responsible owners, estimated durations)
   - Conduct cutover rehearsal (dry-run cutover process, identify timing issues, refine runbook)
   - Final training for cutover team and support staff

2. **Go-Live Readiness Review**
   - All UAT defects resolved (no known critical issues)
   - Data migration parallel run validated (GL balances match, reconciliation signed off)
   - All configurations deployed to staging/test (known to be correct, ready to transport to production)
   - Support team trained and ready (knows common issues, escalation procedures)
   - Go/no-go decision: Steering Committee formally approves cutover to proceed

3. **Cutover Window (Friday 6pm to Monday 6am typical)**
   - Friday 6pm: War room convenes; cutover team reviews runbook one final time; final confirmation all prerequisites met
   - Friday 6pm–7pm: Legacy system transactions halted; final delta capture (any transactions created after last data load)
   - Friday 7pm–11pm: Final data loads (delta transactions, any final adjustments); configuration transport to production
   - Friday 11pm–12am: Production system startup (database startup, batch job scheduler startup)
   - Midnight–1am: System validation (connectivity checks, key transactions can be entered, GL posting works)
   - 1am–2am: User access verification (few test users logged in, confirm system responsive)
   - Saturday/Sunday: Hypercare team monitors; any issues during quiet period identified and documented
   - Monday 6am: System opens to all users; support desk activated; daily status updates to stakeholders

4. **Post-Cutover Support (Monday–Friday of go-live week)**
   - Monday 6am: All users log in to RISE; support desk handles questions
   - Daily: Reconciliation of key balances (GL, AR, AP) vs. legacy system
   - Daily: War room sync (issues identified, resolutions tracked, escalation if necessary)
   - EOD Monday–Thursday: Executive status update (green/yellow/red status, key metrics)
   - Friday: First-week retrospective (what went well, what needs improvement)

5. **Hypercare Phase (Week 2–3 post-go-live)**
   - Intensive support continues (partner consultants available)
   - Configuration refinements (users request tweaks, implemented and deployed)
   - Knowledge transfer (support team learning operational procedures, troubleshooting)
   - Business value assessment (early signs system is delivering expected benefits)

## Configuration

Cutover configuration includes:

1. **Cutover Runbook**
   - Activity sequence (data load → configuration transport → system startup → validation)
   - Owner for each activity
   - Estimated duration (data load 3 hours, config transport 1.5 hours, etc.)
   - Success criteria (data load completes with 0 errors, config transport shows 0 conflicts)
   - Rollback trigger (if data load not complete by 11pm, escalate to steering committee)
   - Contact information (who to call if activity fails)

2. **Go/No-Go Criteria**
   - UAT sign-off: all medium/high defects resolved
   - Data parallel run: GL balances match to penny, reconciliation signed off
   - Cutover team trained: all team members walked through runbook at least once
   - Support team ready: support team trained on RISE navigation, escalation process established
   - Infrastructure ready: production environment built, monitoring/alerting enabled
   - Executive approval: business sponsor and steering committee formally approve go-live

3. **Risk Mitigation Plan**
   - Top 5 risks documented with mitigation (e.g., "Risk: Data load takes longer than expected; Mitigation: parallelize load jobs if necessary, extend cutover window by 4 hours")
   - Contingency decisions pre-determined (if critical issue discovered Monday morning, can system stay up or must we rollback?)
   - Rollback triggers identified (if GL balances don't reconcile Monday AM, rollback to legacy for 24 hours while we investigate)

4. **Communication Plan**
   - War room setup (virtual or in-person, how to connect)
   - Daily standup cadence (Monday–Friday of go-live week, 8am call with all stakeholders)
   - Escalation process (if issue can't be resolved in 30 minutes, escalate to Cutover Manager; if Cutover Manager can't decide in 30 min, escalate to Business Sponsor)
   - Stakeholder update frequency (hourly during cutover window, daily Monday–Friday post-go-live)

## Implementation Activities

1. **Go-Live Readiness Review**
   - Confirm UAT completion (all test cases executed, critical defects resolved)
   - Confirm data migration complete (parallel run validated, reconciliation signed off)
   - Confirm infrastructure ready (production environment built, monitoring enabled, backup/restore procedures tested)
   - Confirm team readiness (cutover team walked through runbook, support team trained)
   - Formal steering committee approval (business sponsor signs off on go/no-go)

2. **Cutover Runbook Development**
   - Timeline: start with estimated times for each activity (data load 3 hours based on testing, config transport 1.5 hours)
   - Ownership: assign owner for each activity (Data Manager owns data load, Technical Manager owns config transport)
   - Success criteria: define what "complete" means (data load successful = 0 errors, all records loaded)
   - Escalation: if activity runs behind, who decides to accelerate (skip validation steps?) or delay (extend cutover window?)
   - Contingencies: if activity fails, do we retry, skip, or rollback?

3. **Cutover Team Preparation**
   - Roles and responsibilities: each team member knows their role (who restarts what, who monitors what)
   - Runbook walkthrough: team practices executing runbook (first rehearsal often identifies timing issues)
   - Decision-making authority: who has authority to make go/no-go decisions, escalation triggers

4. **Support Team Enablement**
   - Hypercare training: support team trained on RISE navigation, key transactions, common issues
   - Escalation procedures: support team knows when to escalate (system down = immediate escalation, user password reset = support can handle)
   - Knowledge repository: team has access to FAQs, configuration documentation, contact lists

5. **Contingency Planning**
   - Rollback decision tree: if critical issue discovered, what are conditions for rollback (GL balances don't match, key transaction fails, system unusable)
   - Rollback procedure: documented steps to revert to legacy system (restore database, switch user traffic, etc.)
   - Parallel workarounds: if specific process can't run in RISE Monday, what's the temporary manual process?
   - Communication templates: "Due to unexpected issue, system go-live delayed 4 hours; users will access RISE at 10am instead of 6am"

## Migration Activities

1. **Delta Migration Execution**
   - Identify transactions created between final data load and cutover start (typically Friday afternoon transactions)
   - Run delta extraction (pull transactions from legacy system that weren't in final load)
   - Transform and load delta data to RISE (same mapping as final load)
   - Validate delta load (reconcile counts, amounts match expected)
   - Complete by Friday midnight (so system ready for Monday opening)

2. **Cutover Communication**
   - Friday: communicate to users that legacy system shutting down at 6pm, RISE opening Monday 6am
   - Monday 6am: communicate system opening, initial performance expectations
   - Monday EOD: share go-live status (system up, initial support volume, any outstanding issues)

3. **Phased Activation**
   - Wave 1 cutover: core financials (GL, AR/AP) go-live Friday; users access Monday
   - Wave 2 cutover: operations modules (procurement, inventory) go-live following week (if using wave approach)
   - Each wave has its own cutover plan; learnings from Wave 1 inform Wave 2 approach

## Rollout Activities

1. **Regional Cutover Planning**
   - If multi-regional: pilot region cuts over first (typically simplest region)
   - Use pilot cutover learnings to optimize subsequent regional cutover sequences
   - Stagger regional cutover (e.g., Region A (Week 1), Region B (Week 3), Region C (Week 5)) to spread support load

2. **User Enablement Pre-Cutover**
   - Final training (2 days before go-live): hands-on training in staging environment
   - Train-the-trainer: business power users become go-live ambassadors
   - Job aids and quick-reference guides: available for users on Day 1
   - Helpdesk setup: phone line, email, chat for users to reach support

3. **Go-Live Week Support**
   - Extended support hours (24/7 during first week vs. typical business hours after)
   - On-site support team (available to help users directly during first days)
   - War room operation (daily syncs, escalation tracking, issue resolution)

## Production Support Activities

1. **Day 1 (Monday) – Immediate Post-Go-Live**
   - System opening: monitor system performance (response times, batch job processing)
   - User support: helpdesk answers first-hour questions (login issues, navigation questions)
   - Reconciliation: begin validating GL balances, AR aging, AP aging (should match legacy as of cutover)
   - Escalation: any critical issues (system performance degradation, missing data) escalated immediately

2. **Week 1 – Stabilization**
   - Daily war room sync: issues identified, root causes analyzed, solutions deployed
   - Performance monitoring: identify and optimize slow-running reports, batch jobs
   - User feedback: collect and prioritize user-reported issues (missing function, unexpected behavior)
   - Business reconciliation: finance confirms GL balances, supply chain confirms inventory reconciliation
   - Support volume tracking: monitor support ticket volume (spike expected first week, should trend down)

3. **Weeks 2–3 – Hypercare**
   - Intensive support continues: partner consultants available for complex issues
   - Configuration refinements: user-requested tweaks (additional fields, workflow modifications) implemented and deployed
   - Knowledge transfer: internal IT operations learning procedures, troubleshooting approach
   - Business value assessment: early indications of whether expected benefits (cost reduction, efficiency gains) materializing

4. **Post-Hypercare – Transition to Operations**
   - Support model transition: from partner-led to customer-led (internal IT operations primary, partner on-call)
   - Operational procedures documented: backup/restore, patch management, user provisioning
   - Escalation matrix updated: which issues go to internal support vs. SAP support vs. partner
   - Future roadmap planning: Wave 2 scope, known issues requiring resolution, performance optimization priorities

## Troubleshooting

### Issue 1: Data Load Takes Significantly Longer Than Expected
**Symptoms:** Data load expected 3 hours; after 4 hours, only 60% complete. Cutover schedule slipping.

**Root Cause:** Data volume underestimated. Database performance slower than test environment (production database has less memory, more contention). Batch size too large (causing memory swaps).

**Resolution:**
- Immediately assess completion rate: if on pace to finish by midnight, monitor and let run. If clearly won't finish by deadline, escalate.
- Escalation triggers: if data load won't complete by 11pm, notify Cutover Manager and Business Sponsor (decision point: extend cutover window, reduce load scope to critical data only, or rollback).
- Parallel execution: if load is single-threaded job, start second parallel job for different data type (customer load on Job 1, GL on Job 2) to accelerate.
- Contingency: if must accelerate, reduce batch size (load 5,000 records per batch instead of 50,000), sacrifice some performance for speed.
- Post-cutover: investigate performance difference (production database parameter tuning, index additions) and optimize for future waves.

---

### Issue 2: Critical Defect Discovered During Final Testing, Days Before Cutover
**Symptoms:** UAT complete; final testing discovers sales order process broken (orders not creating delivery documents). Known critical functionality failure.

**Root Cause:** Configuration error (sales document flow configured incorrectly). Or: custom development has bug (sales order enhancement not handling specific scenario).

**Resolution:**
- Assess severity: can workaround exist (manual process for creating delivery docs Monday)? Or is this blocker for go-live?
- If workaround viable: document temporary procedure (support team creates delivery docs manually for first week), fix permanently in Wave 2, proceed to cutover.
- If no workaround: must fix before cutover. Assess effort (can configuration be fixed in 24 hours? does custom development require rebuild?).
- If fixable in 24 hours: accelerate fix, re-test, proceed.
- If not fixable: escalate to steering committee (defer cutover, descope Wave 1, or accept known risk and document in go-live communication).
- Avoid the trap: "we'll fix it post-go-live" only works if workaround exists. If no workaround and functionality is core to business, cutover shouldn't proceed.

---

### Issue 3: GL Reconciliation Fails Post-Cutover
**Symptoms:** Monday AM reconciliation: legacy GL balance $5M, RISE GL balance $4.95M. Difference of $50k unexplained.

**Root Cause:** Delta migration missed transactions. Rounding error in currency conversion. Duplicate load (same transactions loaded twice, one then reversed). Mapping error not caught in parallel run.

**Resolution:**
- Immediate investigation (Monday morning, before user access): trace high-value transactions (find the $50k transaction that's missing or double-counted).
- Check delta migration log (were all transactions captured and loaded?).
- Check for duplicates (query GL for any duplicate transaction IDs).
- Check GL mapping (is a GL account posting to wrong account in RISE?).
- If quick fix available (reload delta, correct GL posting): execute immediately, re-validate.
- If investigation takes >1 hour with no resolution: escalate to Cutover Manager → Business Sponsor (decision: can business work with $50k discrepancy while we investigate, or must we rollback?).
- Post-resolution: update reconciliation procedure for subsequent waves to catch this earlier.

---

### Issue 4: Cutover Extends Well Beyond Planned Window
**Symptoms:** Expected cutover completion Friday midnight. Still loading data Saturday 2am. System still not ready for user access Monday morning.

**Root Cause:** Data load performance much worse than estimated. Configuration transport took longer than expected (network issues, multiple retry attempts). Validation discovered additional issues requiring rework.

**Resolution:**
- Communicate immediately (Saturday 2am): notify Cutover Manager, Business Sponsor, Steering Committee. Update stakeholders (Monday 6am system opening at risk).
- Escalate decision: extend cutover window (system opens Tuesday instead of Monday)? Descope data (don't load non-critical data, proceed with what's loaded)? Rollback?
- If extending: communicate to users immediately (emails, announcements) with new timeline.
- If descoping: identify which data is critical for Monday opening (GL, AR/AP must be loaded; non-critical reference data can wait).
- Post-cutover: document what slowed cutover (data load performance, process delays), optimize for next wave.

---

### Issue 5: User Access Issues Monday Morning
**Symptoms:** Users can't log in Monday morning ("user doesn't exist"), or system very slow (response time 30+ seconds), or batch jobs failing.

**Root Cause:** User master not loaded or incorrect. System resources exhausted (not enough memory allocated for production load). Database statistics out of date (query optimizer making poor choices).

**Resolution:**
- User access: validate user load completed correctly (query USR01 table, confirm user count matches expected). If users missing, re-run user load.
- System slow: check database statistics (run DBSTATC to refresh), check system load (SM04 to monitor sessions), check batch job status (SM37 to see failed jobs).
- Batch jobs failing: common causes are background job queues not started (SM36), or insufficient resources. Check work process status (SM50).
- Prioritize: if users can't log in, that's P1 (immediate fix). If system is slow but accessible, that's P2 (monitor, optimize, but not a blocker).

## Common Interview Questions

1. **What is the purpose of a go-live readiness review?**
   Go-live readiness review confirms the organization is prepared to go live (UAT complete, data migration validated, team trained, risks mitigated). It's the formal steering committee approval to proceed with cutover.

2. **What should a cutover runbook include?**
   Step-by-step sequence of activities (data load, configuration transport, system startup, validation), owner for each activity, estimated duration, success criteria, escalation triggers, and contingency procedures.

3. **What is meant by "go/no-go decision"?**
   A formal decision point (usually Friday before cutover) where steering committee decides whether to proceed (go) or delay/cancel (no-go) based on readiness criteria. Go decision authorizes cutover to proceed.

4. **What is a parallel run and why is it critical?**
   Parallel run operates legacy and RISE systems simultaneously for 1–2 cycles to validate RISE produces identical results. It's the last validation before cutover; if parallel run results don't match, don't proceed.

5. **What is delta migration?**
   Delta migration captures transactions created after final data load but before cutover (typically Friday afternoon transactions). These must be loaded to RISE so no transactions are lost during system switch.

6. **What is hypercare and what does it include?**
   Hypercare is 1–2 weeks of intensive post-go-live support. Includes partner consultants on-site/on-call, immediate issue resolution, configuration refinements, and knowledge transfer to internal operations.

7. **How long should a RISE cutover window be?**
   Typically 48–72 hours (Friday evening to Monday morning). Any longer risks extended business disruption; any shorter risks rushing through critical validation steps.

8. **What is a rollback decision tree?**
   A pre-determined decision framework: if specific condition occurs (GL balances don't reconcile, system doesn't start, critical functionality fails), organization automatically rolls back to legacy system. Avoids ad-hoc decisions during crisis.

9. **What metrics should be tracked during go-live week?**
   System performance (response time, batch job status), support volume (tickets/hour), business metrics (GL balance reconciliation status, AR aging validation), user adoption (# of users logged in vs. expected).

10. **What is the role of the cutover manager?**
    Cutover manager oversees all cutover activities, escalates issues, makes go/no-go decisions (or escalates to Business Sponsor if decision required), and maintains communication with stakeholders.

11. **What should be communicated to users before cutover?**
    Legacy system shutdown time, RISE go-live time, access procedures, known limitations, where to find help, go-live training completion confirmation.

12. **How do you handle critical issues discovered Monday morning post-go-live?**
    Triage immediately (P1 = system down, P2 = major function broken, P3 = workaround available). For P1, declare incident, notify all stakeholders, activate incident response. For P2/P3, log in support system, escalate if needed.

13. **What is the difference between planned cutover and emergency cutover?**
    Planned cutover is scheduled for specific date (Friday evening typically) with full preparation. Emergency cutover is unplanned (legacy system fails, forcing immediate migration) with limited preparation time. Emergency cutover higher risk.

14. **What is the purpose of a cutover rehearsal?**
    Cutover rehearsal (dry-run in test environment) identifies timing issues, process mistakes, and gaps in runbook before actual cutover. Usually performed 1–2 weeks before actual cutover.

15. **How do you monitor system stability post-go-live?**
    Monitor database (memory, CPU utilization), batch jobs (are they completing on time?), user response time (SAP transaction execution time), and critical business processes (GL posting, invoice creation).

## Tough Follow-up Questions

1. **What would you do if go-live readiness review reveals UAT sign-off is incomplete with 2 days before cutover?**
   Escalate immediately. Assess which defects remain (are they critical for go-live, or can they wait for Wave 2?). For critical defects, must either: fix in 48 hours (accelerate development), or defer cutover. Recommend: defer cutover if critical defects present. Going live with known critical defects is high risk.

2. **If mid-cutover (Saturday morning) you realize data load will take until Monday, how do you handle it?**
   Escalate to Cutover Manager and Business Sponsor immediately (decision point). Options: (1) extend cutover window (users wait until Tuesday to access RISE), (2) load only critical data now (GL, AR/AP), defer non-critical data to post-go-live, (3) rollback and investigate. Recommend: load critical data, proceed with cutover, defer non-critical data load.

3. **What if reconciliation Monday AM shows $100k discrepancy in GL balances, and you can't identify root cause?**
   Assess business impact: can finance operate with documented discrepancy while you investigate? If yes, proceed, track issue resolution. If no, escalate to steering committee (consider partial rollback to legacy for specific GL accounts while RISE operates for other accounts). Document investigation findings for next wave.

4. **If critical custom development is discovered to have a bug Monday evening after go-live, and can't be fixed immediately, what's the contingency?**
   Assess: can business operate with workaround (manual process), or is functionality required for daily operations? If workaround exists, document and train users. If required for operations, escalate (may require rollback specific GL codes or processes until fix deployed). Prioritize permanent fix for deployment immediately post-hypercare.

5. **What if users report system is extremely slow Monday morning (5-minute response time for queries)?**
   Triage immediately: is slowness everywhere, or specific modules? Check database (memory pressure, CPU), check batch jobs (any long-running jobs consuming resources), check active sessions (SM04 to see if users executing heavy queries). Identify and stop resource-intensive jobs if necessary. Engage SAP Basis team for performance tuning. If slowness prevents business operations, escalate.

6. **If cutover manager becomes unavailable Friday evening (sudden illness), how do you handle transition?**
   Pre-plan backup: alternate Cutover Manager identified before cutover begins, has reviewed runbook, knows escalation procedures. On Friday 6pm, if cutover manager unavailable, activate backup immediately. Backup reviews runbook with team (1 hour), then proceeds with cutover. Avoid relying on single point of failure.

7. **What if you're Monday AM, system is green/operational, but you realize a critical master data file wasn't loaded?**
   Identify impact: which business processes need this data? If impacting Monday operations, prioritize load (can you run mini-load of just this data Monday morning?). If not critical Monday (e.g., materials for manufacturing, but manufacturing doesn't run Mondays), load Tuesday. Communicate to affected business units.

## SAP Transactions

- SM37: Batch job monitoring (check if batch jobs completed post-cutover)
- SM50: Active sessions (monitor system load, response times)
- SM04: User activity (see who's logged in, what they're doing)
- DB02: Database statistics (space usage, growth monitoring)
- DBSTATC: Database statistics (refresh statistics for performance optimization)
- ST03: Workload analysis (response time monitoring)
- AL08: User list (confirm user load completed correctly)
- FBL5N: Customer line items (reconcile AR post-cutover)
- FBL1N: Vendor line items (reconcile AP post-cutover)
- OABC: Opening balance reconciliation (confirm GL opening balances match legacy)
- SM36: Define background job (schedule batch jobs for post-go-live operations)
- SUTE: Workload statistics (monitor transaction load/performance)

## SAP Tables

- USR01: User master (confirm users loaded)
- BKPF: GL header (reconcile GL balance)
- BSID: AR open items (reconcile customer balances)
- BSIK: AP open items (reconcile vendor balances)
- VBAK: Sales order header (confirm open orders loaded)
- EKKO: PO header (confirm open POs loaded)
- MARA: Material master (confirm materials loaded)
- KNA1: Customer master (confirm customers loaded)
- LFA1: Vendor master (confirm vendors loaded)
- MARD: Material warehouse stock (confirm inventory balances)

## Best Practices

- **Cutover runbook is sacred:** Document every step, assign owners, test in rehearsal, don't deviate during actual cutover.
- **Go/no-go criteria must be objective:** Define clear criteria (UAT sign-off, parallel run reconciliation) not subjective ("team feels ready").
- **Contingencies pre-determined:** Before cutover, agree on decision tree (if X happens, we do Y) so real-time decisions are faster.
- **War room discipline:** Single source of truth for status, rapid escalation, blame-free culture (focus on solving, not fault-finding).
- **Communication early and often:** Don't wait until Monday to tell stakeholders about Saturday delays. Real-time transparency builds confidence.
- **Hypercare is non-negotiable:** First 1–2 weeks post-go-live are most vulnerable; don't skimp on support.
- **Rollback procedures tested:** Before cutover, you must have validated rollback (if you need it Monday, you need to know it works).
- **Reconciliation discipline:** Don't sign off Monday AM until you've validated GL balance, AR, AP reconciliation (not just "totals look close").

## Common Mistakes

- **Inadequate go-live readiness review:** Formal review becomes checkbox (UAT "signed off" but defects remain). Review must be rigorous.
- **Cutover runbook too vague:** "Load data" (when, how much, success criteria?). Runbook must be step-by-step, not high-level.
- **No contingency planning:** "If data load takes too long, we'll just see what happens Monday." Must pre-determine decisions.
- **Cutover team not trained:** Team hasn't walked through runbook; discovers process gaps during actual cutover.
- **No parallel run:** Proceed to cutover without validating RISE produces equivalent results to legacy (highest risk).
- **Poor communication:** Stakeholders unaware of Saturday delays, Monday surprises (users angry, confidence eroded).
- **Hypercare understaffed:** Going live Monday; partner scales back support by Friday (users have issues, no one available to help).
- **No post-cutover monitoring:** Assume system works Monday, find issues Tuesday (GL balance off, batch jobs failing, discovered too late).

## Interviewer's Hidden Expectations

- **Appreciate stakes:** Go-live is high-stakes; business can't operate if system fails. Show you take this seriously.
- **Discipline and planning:** Cutover succeeds through detailed planning and disciplined execution, not heroics.
- **Risk management:** Understand top risks (data load, system startup, user access), mitigation strategies, contingencies.
- **Communication:** Go-live success depends on transparent, real-time communication with stakeholders.
- **Decision-making under pressure:** Can you make sound decisions (go/no-go, rollback) when stressed, information incomplete?
- **Team leadership:** Have you led a cutover team? Can you describe how you coordinated, motivated, handled conflict?

## What Makes This a 10/10 Answer

- Candidate articulates go-live readiness criteria and why they matter
- Discusses cutover runbook with specific activities, owners, durations, success criteria
- Mentions parallel run validation and reconciliation as non-negotiable pre-cutover
- Explains delta migration and why it's critical
- Addresses contingencies: "If data load takes 2x longer, we extend window or reduce scope"
- Shares concrete example from real cutover (challenge, how it was handled, outcome)
- Demonstrates understanding of post-cutover support (hypercare, reconciliation, user enablement)
- Shows awareness of communication strategy (stakeholder updates, escalation processes)

## Red Flags

- Treats cutover as simple "flip switch" (no mention of planning, readiness review, validation)
- No awareness of go/no-go criteria or readiness review
- Hasn't participated in actual cutover but claims expertise
- No contingency planning ("we'll handle issues Monday morning")
- Focuses only on technical aspects (data load, system startup) and ignores change management, communication
- Assumes parallel run is optional ("we can skip it if we're tight on schedule")
- No understanding of hypercare or post-cutover support
- Treats rollback as impossible ("once we go live, there's no going back")

## Keywords

- Cutover
- Go-live
- Go/no-go decision
- Readiness review
- Cutover runbook
- War room
- Hypercare
- Delta migration
- Parallel run
- Reconciliation
- Rollback
- Escalation
- Business continuity

## Related Topics

- [RISE Project Management](./rise-project.md)
- [RISE Data Migration](./rise-migration.md)
- [Hypercare and Stabilization](../project-management/hypercare.md)
- [Testing Strategy and UAT](../project-types/testing.md)
- [Business Continuity and Disaster Recovery](../compliance/business-continuity.md)
