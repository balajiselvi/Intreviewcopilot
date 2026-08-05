# Architecture Design Interview Scenarios

## Overview

Architecture design scenarios are interview questions that ask candidates to design SAP system architectures from scratch or evaluate existing designs. These scenarios test: technical understanding (which components needed?), trade-off analysis (cloud vs on-premise, single vs distributed), governance thinking (how enforce standards?), scalability planning (how support growth?), integration strategy (connect to external systems), and business alignment (does it meet requirements?). Architecture scenarios are common in interviews for architect/senior roles and are useful for implementation project leads. Strong architects show: structured thinking (break problem into pieces), trade-off awareness (every choice has cost), governance discipline (scale, support, security), and business context (why this choice, not that one?).

## Interview Summary

Architecture scenario: candidate designs SAP landscape (greenfield or upgrade). Evaluates: technical knowledge (right components?), trade-off thinking (cloud vs on-prem cost/benefit?), scalability (support 10x growth?), integration (connect to ERP/CRM/analytics?), governance (standards, change control?), and business alignment (meets business goals?). Strong answers show structured thinking, trade-offs articulated, and business context.

## 30 Second Interview Answer

Architecture scenario: you're asked to design SAP for a company (e.g., "design S/4HANA for a 5,000 person manufacturing company, global operations, 3 data centers"). Strong answer: (1) clarify requirements (what's the scope?), (2) propose architecture (cloud S/4HANA, Analytics Cloud for reporting), (3) address trade-offs (cloud cost vs uptime reliability, shared GL vs distributed GCs per entity), (4) mention governance (CAB for changes, quarterly updates plan), (5) acknowledge risks (data residency, migration complexity).

## 60 Second Interview Answer

Architecture scenario design process: (1) **Clarify Requirements:** Ask about scope (which entities/geographies/modules?), volume (transaction volume, users, data), and constraints (data residency, budget, timeline). (2) **Propose Components:** SAP S/4HANA Cloud (or on-prem?), Analytics Cloud, Cloud Integration, IAS for identity. (3) **Address Integrations:** Legacy systems still running? Plan integration via Cloud Integration (middleware). Cloud CRM? Commerce? Plan integration architecture. (4) **Scalability:** How does architecture handle 10x growth? Cloud auto-scales; on-premise requires sizing. (5) **Trade-offs:** Cloud (agility, cost model) vs on-premise (control, capex). Global shared GL or per-entity? (6) **Governance:** Change management, quarterly updates, security, compliance.

Strong answer: shows understanding of components, trade-offs, and business fit.

## 90 Second Interview Answer

Architecture scenario example: "Design S/4HANA for a global manufacturing company: 5,000 employees, 10 plants (8 in EU, 2 in US), 50+ countries, multiple brands, $2B revenue, complex supply chain, existing legacy ERP (20 years old)."

**Initial Clarification:**
- Scope: which modules (Finance, Supply Chain, Manufacturing, HR)?
- Timeline: greenfield or replace legacy?
- Budget: capex vs opex preference?
- Constraints: data residency (GDPR, keep EU data in EU)?
- Current state: legacy system, integrations, pain points?

**Proposed Architecture:**

1. **Core System:** S/4HANA Cloud (RISE) or on-premise S/4HANA?
   - Recommendation: S/4HANA Cloud RISE (quarterly updates, managed infrastructure, Clean Core discipline)
   - Alternative: on-premise if data residency strict (sovereign cloud, e.g., AWS EU region)

2. **Organizational Structure:**
   - Single global instance (one GL, real-time consolidation) or separate instances per region?
   - Recommendation: single global instance (integrated reporting, standardized processes)
   - Regional implications: compliance (tax, labor laws) handled via localization, not separate instances

3. **Integrations:**
   - Legacy ERP (20 years): plan 2-3 year migration (brownfield project), parallel run 6-12 months
   - External systems: suppliers (supplier portal via Cloud Portal), customers (commerce integration via Cloud Commerce)
   - Analytics: Analytics Cloud for reporting and planning
   - Middleware: Cloud Integration for all external connections (real-time data sync)

4. **Data Architecture:**
   - Master data: global (customers, vendors, products) vs regional (GL accounts per country, tax codes)
   - Real-time consolidation (Finance sees all entities in real time) vs periodic consolidation (monthly close)
   - Recommendation: real-time (better visibility)

5. **Scalability:**
   - Cloud auto-scales (handle seasonal peaks, growth)
   - On-premise requires capacity planning (infrastructure refresh every 5 years)

6. **High Availability & Disaster Recovery:**
   - Cloud: multi-AZ (multiple availability zones) - SAP manages, configure retention/backup
   - On-premise: requires customer responsibility (backup facility, sync strategy)

7. **Security & Compliance:**
   - IAS (Identity & Access Management) for global directory (replaces legacy AD integration)
   - Audit trail (SAP handles automatically, access logging)
   - Data encryption (at rest, in transit) - SAP manages
   - Compliance: GDPR (EU data only in EU), SOX (audit logging), local tax (tax module config)

8. **Go-Live & Rollout:**
   - Phased approach: (1) Finance & Controlling (month 0-4), (2) Supply Chain (month 5-8), (3) Manufacturing (month 9-12)
   - Or by geography: (1) EU plants (month 0-6), (2) US plants (month 7-12)
   - Recommendation: phased by module (lower per-module risk, faster learning)

**Trade-offs:**

- **Cloud vs On-Premise:**
  - Cloud: higher opex (subscription), no capex, SAP manages infrastructure, quarterly updates mandatory, auto-scaling
  - On-premise: lower opex long-term, capex intensive, customer manages infrastructure, updates flexible, limited scaling
  - Recommendation: Cloud (modernization benefit, agility, quarterly updates)

- **Global vs Regional Instances:**
  - Single global instance: integrated reporting, standardized processes, complex consolidation, real-time GL
  - Separate regional instances: local autonomy, compliance separation, redundant data, integration complexity
  - Recommendation: single global (better for manufacturing, real-time supply chain visibility)

- **Clean Core vs Customization:**
  - Clean Core: <10% customization, quarterly updates easy, long-term agility
  - Legacy replication: 80%+ customization, upgrade rework, technical debt
  - Recommendation: Clean Core (10 year cost savings outweigh short-term redesign cost)

**Risks & Mitigation:**

- Risk: Migration complexity (20-year legacy system, 10,000+ users, 50+ countries)
  - Mitigation: phased rollout, strong program management, experienced partner

- Risk: Data quality (legacy data messy)
  - Mitigation: data assessment and cleansing early (pilot migration in dev phase)

- Risk: Process change resistance (legacy processes entrenched)
  - Mitigation: change management, training, executive sponsorship

- Risk: Regulatory changes mid-project
  - Mitigation: modular approach (can add tax/compliance without affecting core)

**Governance:**

- Steering Committee: executive sponsors (CFO, COO), strategic decisions
- PMO: project management, resource planning, tracking
- CAB: change control (customization requests evaluated)
- Architecture Board: technical decisions (which integration pattern?, which cloud region?)
- Cloud ALM: project orchestration (planning, testing, deployment, quality monitoring)

## Architecture

- **Core:** S/4HANA Cloud or on-premise, global instance
- **Analytics:** Analytics Cloud for reporting, planning, simulation
- **Integration:** Cloud Integration (middleware) for external systems
- **Identity:** IAS (cloud identity service)
- **Compliance:** SAP configuration for local requirements (tax, audit, data residency)
- **Phasing:** phased by module or geography

## Runtime Flow

1. **Clarify Requirements (Step 1)**
   - Ask about scope, volume, constraints, timeline
   - Understand business drivers and pain points
   - Document assumptions

2. **Propose Architecture (Step 2)**
   - Core system choice (cloud vs on-premise)
   - Organizational structure (single vs multiple instances)
   - Key integrations (legacy, external systems)
   - Data architecture (master data, GL structure)

3. **Address Trade-offs (Step 3)**
   - Cloud vs on-premise cost/benefit
   - Global vs regional instances
   - Clean Core vs customization
   - Make-buy-integrate decisions

4. **Scalability & HA (Step 4)**
   - How architecture handles growth
   - High availability and disaster recovery
   - Backup and retention strategy

5. **Governance & Rollout (Step 5)**
   - Change management and governance
   - Phased rollout strategy
   - Risk mitigation

6. **Implementation Approach (Step 6)**
   - Timeline (Gantt chart mentally)
   - Resource requirements
   - Critical success factors

## Configuration

- System sizing (users, transaction volume, data volume)
- Cloud region selection (data residency)
- Master data structure (global vs local)
- GL chart of accounts (consolidated vs distributed)
- Integration architecture (middleware, APIs)
- Security model (IAS, roles, audit)

## Implementation Activities

- Requirements gathering and architecture design
- Proof-of-concept (small pilot to validate approach)
- Detailed rollout planning (phasing, parallel run strategy)
- Resource allocation and team structure
- Risk assessment and mitigation planning

## Architecture Activities

- Propose overall system architecture
- Design data architecture (master data, GL structure)
- Design integration architecture (external systems)
- Design governance and change management
- Design scalability and high availability

## Production Support Activities

- Ongoing architecture optimization
- Performance tuning
- Scaling as business grows
- Quarterly update planning and execution
- Architecture reviews (what's working, what needs change?)

## Troubleshooting

**Common issue:** Candidate proposes architecture without asking clarifying questions.
Root cause: Rushing to show technical knowledge instead of understanding requirements.
Resolution: Start with requirements clarification (scope, constraints, timeline). Architecture flows from requirements.

**Common issue:** Candidate ignores trade-offs (says "cloud is better" without cost/benefit analysis).
Root cause: Oversimplification, not thinking through implications.
Resolution: Every choice has cost and benefit. Cloud has cost (opex, less control, mandatory updates). On-premise has cost (capex, ops burden, slower innovation). Articulate both.

**Common issue:** Candidate proposes architecture with 80% customization (violates Clean Core).
Root cause: Not understanding RISE philosophy or not applying discipline.
Resolution: Justify customization (is it truly competitive?). Push back on legacy replication. Target <10% custom.

**Common issue:** Candidate forgets about integrations (says "data flows magically" between systems).
Root cause: Not thinking through how systems connect in real world.
Resolution: Plan integration architecture upfront (Cloud Integration, APIs, data sync strategy). Don't handwave.

## Common Interview Questions

1. **Design S/4HANA for a global company (5,000 employees, 10 locations, $2B revenue).**
   - Clarify scope, propose architecture (cloud S/4HANA, Analytics Cloud, Cloud Integration), address trade-offs (cloud vs on-prem, global vs regional, Clean Core), plan governance and rollout.

2. **Should this company upgrade ECC to S/4HANA, or stay on ECC (on-premise)?**
   - Timeline of ECC support (SAP stopping support eventually). Cost of staying on ECC (no innovation, manual patches). Cost of upgrading (12-18 months, customization rework). RISE philosophy (quarterly updates, Clean Core, modernization). Recommend S/4HANA Cloud RISE (if data residency allows).

3. **How would you integrate legacy ERP with S/4HANA during parallel run?**
   - Parallel run: both systems live 6-12 months (ECC sending data to S/4HANA during testing, or S/4HANA sending data to ECC for reconciliation). Middleware (Cloud Integration) syncs master data (customers, vendors, products) in real time. Transactions created in ECC, mirrored to S/4HANA for validation. After cutover, ECC archived.

4. **What's the difference between a single global S/4HANA instance vs separate regional instances?**
   - Single global: integrated reporting (all regions in real time), standardized processes (lower customization), real-time consolidation, complex to manage. Separate regional: local autonomy, lower risk per region, data silos (must consolidate), redundant infrastructure. Recommend single global for most companies (better finance integration).

5. **How do you handle data residency requirements (GDPR, must keep EU data in EU) in cloud architecture?**
   - Cloud region selection: AWS EU Frankfurt, Azure EU regions. Data stays in region physically. Backup/DR: can replicate to other EU regions (if allowed), not outside EU. Compliance: SAP certifies GDPR for EU regions. Document data flows (what data leaves EU, when). Recommendation: AWS Frankfurt or Azure EU regions (both GDPR-compliant).

## Tough Follow-up Questions

1. **Candidate proposes cloud, but CFO says capex preferred (cloud is opex). What's the recommendation?**
   - Acknowledge CFO's concern. Explain 10-year TCO (total cost of ownership): Cloud has higher opex, but lower capex, lower ops overhead. On-premise has lower opex, but massive capex, ongoing ops cost. Usually cloud is cheaper long-term (unless very large, mature company with efficient ops). Provide cost model (cloud vs on-premise, 5/10 year projection). Let CFO decide based on data.

2. **Candidate's phased rollout plan: Finance first, then Supply Chain. What if Finance needs Supply Chain data before rollout?**
   - During parallel run (both systems live), integrate: Finance SAP gets purchase orders from legacy Supply Chain system (via middleware). Or: defer Finance cutover until Supply Chain ready (different timeline). Or: plan for workarounds (manual data entry from legacy during transition). This is why integration architecture matters upfront.

3. **Your cloud architecture has data in Frankfurt (EU region). Now business needs to expand to China. How does architecture scale?**
   - Challenge: China has data sovereignty rules (no data outside China). Options: (1) separate S/4HANA Cloud instance in Alibaba Cloud (China region), federated reporting with Frankfurt instance (via Cloud Integration). (2) On-premise S/4HANA in China (Chinese vendor, less integrated). (3) Don't expand to China (geopolitical risk). China architecture complicates global view (not one GL). Recommendation: discuss with stakeholders (is China expansion worth complexity?).

4. **Legacy ECC has 50,000 GL accounts (consolidated into 2,000 in S/4HANA). How do you design GL architecture without losing audit trail?**
   - Mapping: old GL accounts → new GL accounts (document mapping). Parallel run: both GLs reconciled (totals match). Data migration: legacy balances loaded to new GL (by account mapping). Audit trail: SAP preserves transaction history (cost, profit center, etc.). Old GL accounts archived (reference-only). Recommendation: simplify GL during migration (saves 80% of accounting work post-go-live).

## SAP Transactions

- **IMG** (Implementation Guide) — Architecture and configuration
- **SPRO** — Project preparation (architecture planning)
- **SOLMAN** (Solution Manager) — Architecture documentation

## SAP Tables

- **T001** (Company Codes) — Organization structure
- **T024** (Plants) — Manufacturing locations

## Best Practices

- Start with requirements (don't assume architecture without understanding business)
- Articulate trade-offs (every choice has cost and benefit)
- Think about integration (how do systems talk to each other?)
- Plan for scalability (how does architecture handle 10x growth?)
- Governance upfront (change control, CAB, quality gates)
- Document assumptions (if requirements change, architecture may change)
- Pilot architecture (proof-of-concept validates approach before full rollout)

## Common Mistakes

- No requirements clarification (assume architecture)
- Ignoring trade-offs (saying "cloud is always better" without thinking)
- Over-customization (80%+ custom code, violates Clean Core)
- Missing integrations (don't think about how systems connect)
- Insufficient HA/DR planning (single point of failure)
- Ignoring governance (change control, standards enforcement)
- No rollout plan (say "we'll deploy" without timeline/phasing)

## Interviewer's Hidden Expectations

Strong architects show: (1) **Structured thinking** (break problem into pieces, address each systematically), (2) **Trade-off awareness** (every choice has cost/benefit, articulate both), (3) **Business alignment** (architecture serves business, not the reverse), (4) **Governance discipline** (standards, change control, quality gates), (5) **Scalability thinking** (not just "works today," but "works in 5 years").

Weak architects: no requirements, oversimplify trade-offs, ignore integration, too much customization, no governance.

## What Makes This a 10/10 Answer

- Clarifies requirements before proposing architecture (shows discipline)
- Proposes architecture with clear components (core system, analytics, integration, identity)
- Articulates trade-offs (cloud vs on-prem, global vs regional, customization discipline)
- Addresses scalability (how handles growth)
- Governance and change management (standards, CAB, quarterly updates)
- Phased rollout strategy (risk management)
- Acknowledges risks and mitigations
- Experience example (designed similar architecture, lessons learned)

## Red Flags

- No clarification questions (jumping to solution)
- Over-customization (violates Clean Core)
- Missing integration architecture (systems don't talk)
- Weak governance (no change control, no standards)
- No rollout plan
- No trade-off thinking (oversimplifying choices)

## Keywords

- Architecture, design, components, scalability
- Trade-offs, cloud vs on-premise, governance
- Integration, middleware, data architecture
- Clean Core, customization discipline
- Phased rollout, risk management
- Business alignment, requirements

## Related Topics

- [Greenfield Implementation](../project-types/greenfield.md)
- [Brownfield Implementation](../project-types/brownfield.md)
- [Implementation Methodology](../project-types/implementation.md)
- [Clean Core](../rise/clean-core.md)
