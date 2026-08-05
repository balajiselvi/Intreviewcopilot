# Greenfield SAP Implementation

## Overview

A greenfield SAP implementation is a brand-new deployment of SAP on a completely new technology landscape, building from the ground up without any existing SAP systems. Organizations choose greenfield when: establishing a new business unit or company that doesn't yet run on ERP, merging operations where legacy systems need complete replacement, or building new geographies/divisions with modern infrastructure. Greenfield projects have the advantage of designing from first principles (no legacy constraints, no existing customizations to preserve) but carry risk of longer timelines and higher upfront costs because infrastructure, processes, and team expertise must all be built simultaneously. Greenfield allows organizations to implement Clean Core principles from day 1 (no legacy customizations to undo), adopt cloud-native architecture (S/4HANA Cloud, RISE), and establish governance/compliance from the start rather than retrofitting it.

## Interview Summary

Greenfield SAP implementation: building SAP on new infrastructure and processes from scratch, no legacy systems. Advantages: design cleanly (no legacy constraints), implement RISE/S4HANA Cloud (modern architecture), establish governance day 1. Disadvantages: longer timeline, higher cost, no existing knowledge transfer. Different from brownfield (existing landscape) and bluefield (hybrid).

## 30 Second Interview Answer

Greenfield SAP is implementing SAP from the ground up: new business unit, new infrastructure, new processes. No legacy systems to migrate from or integrate with—you design the entire landscape. Advantage: build Clean Core (minimal customization) from day 1, avoid legacy technical debt. Disadvantage: longer timeline (18-24 months), higher upfront cost, no existing SAP knowledge to transfer. Best for: new companies, new divisions, new geographies.

## 60 Second Interview Answer

Greenfield SAP implementation is building a complete new SAP landscape from scratch. Examples: new company being acquired, new division being built, new geography/market entry, new subsidiary. Since there's no legacy system to migrate from, you design everything: infrastructure (cloud or on-premise), processes (no need to replicate existing workflows), and organizational structure.

Key advantage: implement Clean Core philosophy from day 1. You're not constrained by legacy customizations or processes—you design optimal SAP processes and extend only for differentiation. This means quarterly updates are low-risk, innovation adoption is fast.

Timeline: typically 18-24 months (longer than upgrades). Cost: higher upfront (infrastructure, team ramp, custom development). Staffing: need experienced SAP architects, not knowledge transfer from existing system.

## 90 Second Interview Answer

Greenfield SAP implementation builds a brand-new SAP landscape for a new organization or business unit: no legacy systems, no existing data, no pre-existing processes. Common scenarios: (1) Acquisition of a company that's not currently running SAP; you're implementing S4HANA as the ERP backbone. (2) New subsidiary or division in a different market; establishes independent SAP system. (3) New business model requiring fresh ERP design (e.g., subscription SaaS vs traditional product sales).

**Key Characteristics:**

1. **No Legacy Constraints:** You design processes from scratch, not constrained by how legacy systems worked. You can implement SAP's delivered best-practice processes without customization (Clean Core).

2. **Technology Choices:** Greenfield allows modern architecture decisions: cloud (S/4HANA Cloud, RISE), hybrid (on-premise + cloud integration), or traditional on-premise. New infrastructure, no technical debt.

3. **Timing & Complexity:**
   - Longer timeline: 18-24 months (vs 12-15 months for upgrades). Reason: building infrastructure, defining processes, establishing team expertise in parallel.
   - Higher cost: new infrastructure capex/opex, full team ramp (less knowledge transfer).
   - Full design cycle: requirements → design → build → test → go-live (all phases).

4. **Organization & Governance:** Establish governance, roles, compliance from day 1. No technical debt. Can implement modern CoE (Center of Excellence) structure.

5. **Risks & Mitigation:**
   - Risk: timeline slippage (learning curve). Mitigation: strong SAP expertise, clear governance.
   - Risk: process design mistakes (no existing process to fall back to). Mitigation: extensive requirements workshops, reference implementations.
   - Risk: team ramp time (no existing SAP knowledge). Mitigation: training, early knowledge transfer, strong leadership.

**Comparison to Brownfield:**
- **Greenfield:** new infrastructure, new processes, new organization. Clean slate.
- **Brownfield:** existing infrastructure, existing processes, existing customizations. Redesign carefully.

**Comparison to Bluefield:**
- **Bluefield:** hybrid approach. Some existing infrastructure/processes preserved, other areas rebuilt. Mid-point between greenfield and brownfield.

## Architecture

- **Infrastructure:** New cloud or on-premise environment (no legacy constraints)
- **Processes:** Designed to match SAP best practices (Clean Core philosophy)
- **Integrations:** Plan all integrations to external/legacy systems (if any)
- **Organization:** New CoE, new roles, new governance
- **Data:** No legacy data migration (only configuration, setup data, master data)

## Runtime Flow

1. **Phase 1: Plan & Design (Months 1-4)**
   - Define scope and business requirements
   - Design organizational structure and SAP team
   - Design processes (Finance, Supply Chain, HR, etc.)
   - Select technology (cloud vs on-premise, which SAP solution)
   - Establish governance and change management

2. **Phase 2: Build & Configure (Months 5-12)**
   - Set up infrastructure (cloud or on-premise)
   - Configure SAP (IMG, master data, custom development for differentiators)
   - Build integrations to any legacy/external systems
   - Establish data governance, quality processes
   - Train core team

3. **Phase 3: Testing & Validation (Months 13-18)**
   - Unit testing (configurations)
   - Integration testing (processes end-to-end)
   - UAT (business users validate processes)
   - Production readiness testing
   - Performance tuning

4. **Phase 4: Go-Live & Stabilization (Months 19-24)**
   - Go-live (cutover from any legacy systems or manual processes)
   - Post-go-live support (24/7 issue resolution)
   - Data validation (master data, initial transactions)
   - Stabilization and optimization

5. **Phase 5: Operations**
   - Ongoing support and optimization
   - Continuous process improvement
   - Quarterly updates (if S4HANA Cloud/RISE)

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
Root cause: Greenfield projects are long (18-24 months); team members move on.
Resolution: Strong documentation, knowledge transfer, mentoring of junior team members.

## Common Interview Questions

1. **What's the difference between greenfield and brownfield SAP implementations?**
   Greenfield: new landscape, new processes, no legacy constraints, can implement Clean Core. Brownfield: existing landscape, existing customizations, redesign carefully. Greenfield longer timeline (18-24 mo), brownfield faster (12-15 mo).

2. **Why would an organization choose greenfield over acquiring an existing SAP company?**
   Greenfield for: new markets, new business models requiring different architecture. Acquire for: speed to market (buy existing customer base + team).

3. **What are the biggest risks in greenfield SAP projects?**
   Timeline slippage (long project, learning curve), process design mistakes (no existing reference), team ramp (no knowledge transfer), scope creep (everyone adds requirements).

4. **How long does a greenfield implementation typically take?**
   18-24 months. Longer than upgrades because infrastructure, processes, and team expertise built in parallel. Can be accelerated to 12-15 months with strong team and clear scope.

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

Strong answers show: (1) **understanding greenfield is fundamentally different** (not just "implementing SAP," but building entire landscape), (2) **realistic timeline expectations** (18-24 months is normal), (3) **Clean Core mindset** (opportunity to avoid legacy customizations), (4) **team/expertise awareness** (success depends on team quality), (5) **risk mitigation** (scope control, parallel workstreams, phased rollout).

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
- Underestimating timeline (assuming 12 months when 18-24 is normal)
- No mention of Clean Core or customization discipline
- Not recognizing team/expertise as critical success factor
- Assuming you can add customizations throughout project (scope creep)

## Keywords

- Greenfield, new landscape, new processes
- Clean Core, minimal customization
- Infrastructure, 18-24 months, phased rollout
- Master data governance, requirements discipline
- Reference implementation, stage gates

## Related Topics

- [Brownfield Implementation](brownfield.md)
- [Bluefield Implementation](bluefield.md)
- [Clean Core](../rise/clean-core.md)
- [Project Methodology](../project-management/project-methodology.md)
- [S/4HANA Implementation](../s4hana/s4hana-overview.md)
