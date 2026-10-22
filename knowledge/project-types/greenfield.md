# Greenfield SAP Implementation

## Overview

A new implementation, also called a greenfield implementation, is a new installation of SAP S/4HANA. Confirm the configuration against the SAP Best Practices content for the chosen edition. Use the Migration Cockpit path for approved master data and open transactional data, and use the Software Update Manager path only for a system conversion. Completed, closed, and partially closed transactional data cannot be migrated on this path. Do not quote a universal duration or a universal cost. Security confirms the authorization scope in Explore, builds and tests roles in Realize, and validates access before the Deploy go/no-go.

## Interview Summary

New implementation means a new system and a redesign. The data path is the Migration Cockpit, not Software Update Manager. Closed transactional history stays behind unless a different, verified transition path is selected.

## 30 Second Interview Answer

Use a new implementation when the target is a fresh SAP S/4HANA system. Confirm the configuration from SAP Best Practices, load selected master and open transactional data with the Migration Cockpit, and complete authorization testing before cutover. Do not promise to migrate closed history, and do not invent an 18-month duration.

## 60 Second Interview Answer

In Discover and Prepare, confirm the business case, the edition, and the landscape. In Explore, confirm fit-to-standard gaps and the authorization scope. In Realize, configure the approved scope, build roles, and complete integration and test evidence. In Deploy, rehearse the cutover, complete the go/no-go review, and run hypercare. In Run, hand the service to operations. The security workstream owns role design, build, test, cutover access checks, and hypercare triage inside those phases.

## 90 Second Interview Answer

Choose a new implementation when the organisation wants new processes and a clean core, not a one-to-one reuse of the old system. The technical method is a new software installation plus data migration. It can be a big-bang or a phased rollout, but that choice comes from the approved plan. Security does not wait until the last test cycle: confirm identity, role ownership, organizational levels, and emergency access while the process scope is still open. After go-live, hypercare handles access defects as production incidents. A redesign waits for change control.

## Source

Checked 2026-10-20. SAP Learning, Describing the Customer Transition Paths to SAP S/4HANA Cloud Private Edition: a new implementation is a new installation, also called greenfield. Data migration uses the SAP S/4HANA Migration Cockpit. Completed, closed, and partially closed transactional data cannot be migrated. https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-private-edition/describing-the-customer-transition-paths-to-sap-s-4hana-cloud-private-edition_b8aa0951-21d6-44d0-b9f5-81cd24b2b8bb


## Architecture

The lifecycle follows SAP Activate: Discover, Prepare, Explore, Realize, Deploy, and Run. Do not publish a universal month count. The approved plan owns the schedule. A new implementation uses a new installation and the Migration Cockpit. A system conversion uses Software Update Manager for one existing ERP system. Selective data transition uses the verified company-code and time-slice scenario, or a separately contracted tool. Security confirms scope in Explore, builds and tests in Realize, and joins the Deploy go/no-go review.

## Runtime Flow

Confirm the path before naming a tool. A new implementation is a new installation and uses the SAP S/4HANA Migration Cockpit. A system conversion uses Software Update Manager, or Software Update Manager with the database migration option, for one existing ERP system. Selective data transition uses the verified company-code and time-slice scenario. An upgrade moves the same product to a new base release. An update applies a feature or support package. A lift and shift is a system copy without a functional change. Security confirms scope in Explore, tests roles in Realize, and brings the access evidence to the Deploy go/no-go review. Do not quote a universal duration.

## Configuration

- **Infrastructure Setup:** Cloud or on-premise environment configuration
- **SAP Configuration:** IMG (Implementation Guide) for all modules in scope
- **Master Data:** Define structure, quality standards, governance
- **Integrations:** Point-to-point or middleware-based integration design
- **Customization:** Extensions only for differentiating business logic
- **Governance:** Change management, release processes, compliance

## Implementation Activities

- Requirements gathering and process design (no existing processes to analyze)
- Infrastructure provisioning (new cloud or data center)
- SAP configuration and customization
- Master data design and governance
- Integration architecture and implementation
- Testing strategy and execution
- Training and change management
- Data cutover planning (if transitioning from legacy/manual processes)

## Migration Activities

- If greenfield replaces legacy system: plan cutover from old to new (parallel run, data validation)
- If greenfield is new business: no migration, direct go-live

## Rollout Activities

- Multi-phased rollout: Finance/Core first, then Supply Chain, then HR, etc. (phased by module or by geography)
- Or big bang: all modules, all entities go-live simultaneously (riskier, requires stronger team)

## Production Support Activities

- Post-go-live support: 24/7 for first month, then scaled down
- Issue tracking and resolution
- Performance monitoring and optimization
- User support and training extensions
- Continuous process refinement based on user feedback

## Troubleshooting

**Common issue:** Scope creep; too many customizations requested during build phase.
Root cause: Business wants to add requirements throughout project.
Resolution: Strict change control gate; defer non-critical customizations to post-go-live phases.

**Common issue:** Infrastructure not ready when configuration complete; timeline slips.
Root cause: Infrastructure team and SAP team not synchronized.
Resolution: Establish joint governance; infrastructure provisioning happens in parallel with SAP config, not after.

**Common issue:** Master data quality poor; go-live delayed by data validation failures.
Root cause: Master data governance not established early; ad-hoc data entry.
Resolution: Establish master data governance day 1; cleanse and validate in advance (pilot with sample data).

**Common issue:** Team turnover during long project; knowledge loss, timeline slips.
Root cause: a long programme can lose named owners. The control is role ownership and a documented handover, not a fixed month count.
Resolution: Strong documentation, knowledge transfer, mentoring of junior team members.

## Common Interview Questions

1. **What's the difference between greenfield and brownfield SAP implementations?**
   Greenfield: new landscape, new processes, no legacy constraints, can implement Clean Core. Brownfield: existing landscape, existing customizations, redesign carefully. A new implementation is a new installation. A system conversion reuses one existing ERP system. Do not quote a universal duration.

2. **Why would an organization choose greenfield over acquiring an existing SAP company?**
   Greenfield for: new markets, new business models requiring different architecture. Acquire for: speed to market (buy existing customer base + team).

3. **What are the biggest risks in greenfield SAP projects?**
   Timeline slippage (long project, learning curve), process design mistakes (no existing reference), team ramp (no knowledge transfer), scope creep (everyone adds requirements).

4. **How long does a greenfield implementation typically take?**
   There is no universal duration. The approved plan sets the schedule after scope, landscape, and data-migration evidence.

5. **Can you implement Clean Core in a greenfield project?**
   Yes, greenfield is ideal for Clean Core. No legacy customizations to undo; design for minimal customization from day 1.

6. **What's the cost of a greenfield SAP implementation?**
   High upfront: infrastructure capex (millions for on-premise), SAP licenses, consulting (implementation team), training. Typical: $10-30M+ depending on scope and geography. No legacy system migration costs.

## Tough Follow-up Questions

1. **You're 12 months into a greenfield SAP project. Timeline slipping; go-live at 18 months looks risky. How do you accelerate?**
   Options: (1) Reduce scope (defer non-critical modules to post-go-live). (2) Add more testing/development resources (costs more). (3) Reduce customization (strip to core SAP processes, defer enhancements). Best approach: strategic scope reduction + targeted team expansion.

2. **Business says they want all their legacy processes replicated in new SAP. That violates Clean Core. How do you push back?**
   Cost-benefit analysis: "Replicating legacy adds 30% customization cost + ongoing maintenance. Alternative: retrain team on SAP process (2 weeks) + save that cost. Leadership decision."

3. **You've completed design; infrastructure provisioning is 2 months behind. Do you delay SAP config start, or start SAP config and hope infrastructure catches up?**
   Parallel path: start SAP config in dev/sandbox environment (not dependent on prod infrastructure). When prod infrastructure ready, configurations promoted. Keeps timeline on track.

4. **Greenfield project, new team, no SAP expertise. How do you reduce delivery risk?**
   Hire experienced SAP architect/partner for leadership. Establish strong governance (regular reviews, stage gates). Use reference implementations (copy from similar industry greenfield). Invest in training early (team ramping is critical).

## SAP Transactions

- **IMG** (Implementation Guide) — Primary tool for configuring SAP
- **SE38/SE80** — Development tools for custom code (extensions, not modifications)
- **SPRO** — Project preparation/configuration planning

## SAP Tables

- **T001** (Company Codes) — Defined during configuration
- **T024E** (Plants) — Defined during organizational design

## Best Practices

- Do requirements upfront; design once, build once (don't redesign mid-project)
- Hire experienced SAP architects (greenfield success depends on team quality)
- Establish governance early (change control, release management)
- Implement Clean Core philosophy day 1 (discipline on customization)
- Use reference implementations from similar industries
- Invest in training throughout project (team ramping is critical)
- Parallel infrastructure + SAP config (don't sequence sequentially)
- Define master data governance before build phase starts
- Plan for phased rollout if multi-entity (reduces go-live risk)

## Common Mistakes

- Underestimating timeline (assuming it's like an upgrade; it's not)
- Allowing too much customization (violates Clean Core, adds cost and risk)
- Not hiring experienced SAP leadership (team quality is critical)
- Sequencing infrastructure after SAP design (causes delay; do in parallel)
- Under-investing in training (team needs to learn; takes time)
- Scope creep (no discipline on requirements; keep adding)
- Not establishing master data governance early (quality issues at go-live)

## Interviewer's Hidden Expectations

Strong answers show: (1) **understanding greenfield is fundamentally different** (not just "implementing SAP," but building entire landscape), (2) a schedule owned by the approved plan, (3) **Clean Core mindset** (opportunity to avoid legacy customizations), (4) **team/expertise awareness** (success depends on team quality), (5) **risk mitigation** (scope control, parallel workstreams, phased rollout).

## What Makes This a 10/10 Answer

- Clear distinction between greenfield, brownfield, bluefield
- Realistic timeline and cost expectations
- Understanding of Clean Core opportunity
- Recognition that team quality/expertise is critical
- Parallel workstreams (infrastructure + config, not sequential)
- Risk mitigation strategies (scope control, phasing, testing rigor)
- Experience example with lesson learned

## Red Flags

- Thinking greenfield is "just like an upgrade, but new infrastructure" (wrong mindset)
- Quoting a universal duration instead of the approved plan
- No mention of Clean Core or customization discipline
- Not recognizing team/expertise as critical success factor
- Assuming you can add customizations throughout project (scope creep)

## Keywords

- Greenfield, new landscape, new processes
- Clean Core, minimal customization
- New installation, Migration Cockpit, and the approved rollout plan
- Master data governance, requirements discipline
- Reference implementation, stage gates

## Related Topics

- [Brownfield Implementation](brownfield.md)
- [Bluefield Implementation](bluefield.md)
- [Clean Core](../rise/clean-core.md)
- [Project Methodology](../project-management/project-methodology.md)
- [S/4HANA Implementation](../s4hana/s4hana-overview.md)
