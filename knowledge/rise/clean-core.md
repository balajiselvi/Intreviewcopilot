# Clean Core SAP S/4HANA RISE

## Overview

"Clean Core" is the guiding architectural principle for RISE implementations: adopt SAP's standard business processes and delivered functionality out-of-the-box with minimal customization, instead of forcing S/4HANA to replicate legacy ECC customizations. Clean Core means: keep the system aligned with SAP's standard codebase (fewer custom modifications), use SAP's extension frameworks (extensions, not classic modifications) for truly differentiating business logic, and accept process changes where SAP's solution is superior to legacy ECC processes. The benefit: quarterly SAP updates are lower-risk (less custom code to test and re-certify), performance is better (SAP's delivered code is optimized), and innovation adoption is faster (don't have to rewrite customizations for each new SAP feature). The tradeoff: business process redesign is required (sometimes significant), and some legacy workflows must change. Clean Core is controversial in enterprises with 20+ years of customization; it represents a philosophical shift from "customize the software to our way of working" to "change our processes to fit the software."

## Interview Summary

Clean Core means: minimize customization in S/4HANA RISE by adopting SAP's standard processes. Use extensions only for truly differentiating business logic, not for replicating legacy ECC workflows. Benefit: faster innovation, lower risk updates, better performance. Tradeoff: business process redesign required. This is the RISE philosophy; traditional S/4HANA projects often skipped this rigor.

## 30 Second Interview Answer

Clean Core is the RISE principle: adopt SAP's delivered business processes instead of customizing S/4HANA to replicate legacy ECC. Keeps custom code to <10% of system (vs 80% in old ECC projects). Benefit: SAP updates are quarterly without major customization rework, innovation is continuous. Tradeoff: business has to change processes. This is a business and technical decision, not just technical.

## 60 Second Interview Answer

Clean Core is RISE's core tenet: design S/4HANA to use SAP's standard business processes, not customized ones replicating legacy ECC. The philosophy is: if business process is generic (invoice processing, PO management, etc.), use SAP's delivered solution unchanged. Only customize/extend for truly differentiating processes (unique to your business competitive advantage).

Example: Traditional ECC project: "How do we configure S/4HANA to match our current invoice approval workflow?" Answer: customize MM (Materials Management) module. Clean Core: "What's SAP's delivered invoice approval workflow?" Answer: use it as-is, retrain team on the new workflow, save customization budget for features that truly differentiate (supply chain optimization, demand forecasting, etc.).

Real impact: Traditional ECC with 80% customization: each major upgrade (every 3-5 years) requires 6-12 months of rework to re-certify custom code against new ECC version. RISE with <10% customization: quarterly updates (not major upgrades) and most of the system needs no testing (SAP handles it).

## 90 Second Interview Answer

Clean Core is the architectural decision that defines RISE success: determine which processes are standard (adopt SAP's delivered solution) vs differentiating (customize/extend). This requires business and IT alignment on a uncomfortable question: "Which of our current processes are truly unique competitive advantages?"

**Standard vs Differentiating:**
- **Standard (Don't customize):** Invoice processing, PO management, expense approval, payroll, inventory management, financial reporting, tax compliance. Most companies do these the same way; SAP's solution is optimized; customization adds cost with no competitive benefit.
- **Differentiating (Extend/customize):** Supply chain optimization, demand forecasting, product configuration, pricing logic, sales process (if you have a unique sales model). These genuinely differentiate; worth customizing.

**Clean Core Architecture:**
1. Map 100% of ECC processes
2. Categorize each: standard (use SAP delivered) vs differentiating (extend)
3. For standard processes: accept process change (retraining required)
4. For differentiating: develop extensions (not classic modifications)
5. Minimize custom code through extensions, not core modifications

**Why It Matters for Quarterly Updates:**
Traditional ECC with 80% customization: SAP releases upgrade. 80% of code must be retested (regression testing nightmare). Probably takes 3-6 months of testing + rework. Business pressure to defer upgrade.

RISE with <10% customization: SAP releases quarterly update. 90% of system untouched (SAP certifies it). Only 10% of custom extensions need testing. Takes 1-2 weeks. Business can adopt continuously.

**The Business Case Conflict:**
Business says: "Our current invoice approval workflow is how we work; don't change it." IT says: "Changing to SAP's workflow costs retraining time but saves $500K/year in upgrade rework." Leadership decides: cost of retraining vs cost of long-term customization. Usually retraining wins.

**Implementation Practice:**
- Discovery: document all ECC processes (hundreds, even thousands)
- Analysis: categorize each (standard vs differentiating)
- Decision: business approves which processes will change
- Design: for changing processes, SAP's delivered solution becomes design spec
- Build: for differentiating, build extensions using SAP's frameworks
- Change management: train teams on new standard processes

**Measurement:**
Success = customization ratio. Target: <10% custom code. Typical: 5-15% (best-in-class). Failure: >20% custom code (you're still trying to replicate ECC, not embracing Clean Core).

**Real-World Challenges:**
- Business resistance: "We've done invoice approval this way for 20 years; why change?" Answer: because SAP's way is optimized for their platform, your legacy way works against the platform.
- Legacy system dependencies: some custom processes depend on discontinued ECC functionality (no equivalent in S/4HANA). Hard choices: rearchitect the business process or build extension to replicate legacy behavior (expensive).
- Regulatory/compliance processes: sometimes regulatory requirements drove customization. S/4HANA may have built-in compliance (use it) or may require extension (justified cost).

## Architecture

- **Standard Process Repository:** SAP's delivered business processes (invoice, PO, payroll, etc.) defined as baselines
- **Differentiating Process Repository:** Custom/extended processes unique to organization
- **Extension Framework:** SAP's tools for extending delivered functionality (ABAP extensions, Fiori extensions, workflow extensions) without modifying core code
- **Process Documentation:** Map legacy ECC processes, categorize, define target S/4HANA processes (standard + extensions)
- **Governance:** Change advisory board evaluates process changes, approves customization budget

## Runtime Flow

1. **Process Inventory:** Document all ECC processes (100s-1000s)
2. **Categorization:** Identify which are standard (generic across industries) vs differentiating (unique to company)
3. **Process Redesign:** For processes changing to SAP standard, redesign and document new workflow
4. **Extension Design:** For differentiating processes, design extension (using ABAP, Fiori, workflow engine)
5. **Build:** Develop extensions using SAP's frameworks (not core modifications)
6. **Testing:** Regression testing for extensions, acceptance testing for changed processes
7. **Training:** Business training on new standard processes, IT training on supporting extensions
8. **Go-live:** Cutover from ECC customizations to S/4HANA standard + extensions
9. **Ongoing:** Quarterly updates: SAP updates standard processes (no customer code changes needed); extensions tested against new SAP release

## Configuration

- **Process Configuration:** S/4HANA IMG (Implementation Guide) for standard processes (company code, plant, GL accounts, etc.)
- **Extensions:** Developed in customer's development environment, tested, transported to production
- **Governance:** CAB (Change Advisory Board) reviews process changes and customization requests
- **Documentation:** Process definitions, extension code, training materials

## Implementation Activities

- Conduct process inventory: catalog all ECC processes
- Categorize each process: standard (use SAP's) vs differentiating (customize)
- Analyze each differentiation: is it truly competitive or legacy inertia?
- Design process changes for standard processes
- Design extensions for differentiating processes
- Build extensions using SAP's frameworks
- Test end-to-end processes (standard + extended)
- Train business on changed processes
- Plan cutover from ECC to S/4HANA Clean Core architecture

## Migration Activities

- Validate that S/4HANA's standard processes can accommodate regulatory/compliance requirements
- Rearchitect any legacy ECC processes that don't have S/4HANA equivalents
- Migrate data with changed process definitions (e.g., invoice routing changes, approval chain changes)
- Test processes with real data and real user workflows

## Rollout Activities

- For multi-entity rollout: apply same Clean Core principles (consistent process across entities)
- Localize extensions for regional differences (not core process changes)

## Production Support Activities

- Monitor extension performance and stability
- Support business use of new standard processes
- Maintain extension code as S/4HANA updates quarterly
- Evaluate quarterly SAP updates for impact on extensions
- Process optimization: continuous improvement of both standard and custom processes

## Troubleshooting

**Common issue:** Business insists on replicating legacy ECC process in S/4HANA; Clean Core is rejected.
Root cause: Change resistance, lack of understanding of long-term maintenance burden.
Resolution: Cost-benefit analysis: cost of retraining vs cost of 10 years of supporting legacy customization. Usually retraining wins. Executive sponsor makes final call.

**Common issue:** Extension breaks after SAP quarterly update; business process impacted.
Root cause: Extension code assumes previous SAP API/behavior; new release changes it.
Resolution: Test extensions in advance against new release (SAP provides pre-release access). Fix extension before release deployment. Or defer release adoption (but loses clean core benefit).

**Common issue:** Process changed to SAP standard, business unhappy; wants to revert to ECC way.
Root cause: Change management failure; business not trained or convinced of new approach.
Resolution: Retraining, support, process optimization, demonstration of value (faster reports, better analytics). Escalate if truly unworkable; then make exception (but cost is customization + ongoing support).

## Common Interview Questions

1. **What does "Clean Core" mean in RISE?**
   Adopt SAP's delivered standard processes; customize only for truly differentiating logic. Benefits: quarterly updates are low-risk, innovation is continuous, performance is optimized. Tradeoff: business process changes.

2. **How do you decide what to customize in Clean Core RISE?**
   Map all ECC processes. Categorize: standard (generic, use SAP's) vs differentiating (unique, extend). Standard: no customization, retrain on SAP's way. Differentiating: extend (not modify core).

3. **What percentage of customization is a "clean core"?**
   Target: <10% custom code. Typical range: 5-15%. Failure: >20% (you're still replicating ECC, not embracing clean core).

4. **What's the business case for Clean Core?**
   One-time cost: process redesign + retraining. Ongoing saving: faster quarterly updates (1-2 weeks vs 3-6 months), lower testing cost, faster feature adoption. 10-year ROI usually strong (saves millions in upgrade rework).

5. **Can you use classic ABAP modifications in Clean Core?**
   Discouraged. Clean Core means extensions (Fiori extensions, ABAP extensions using extension frameworks), not core modifications. Modifications are harder to maintain across releases.

6. **What if SAP's standard process doesn't meet regulatory requirements?**
   Validate against SAP Help. Often S/4HANA has regulatory options built in (GDPR, SOX, etc.). If truly missing: extend (justified cost). Document regulatory justification.

7. **How do you handle legacy systems that depend on ECC customizations?**
   Integration issue, not clean core issue. Plan integration architecture: if legacy system requires ECC's custom behavior, either migrate legacy or build extension in S/4HANA to replicate behavior (while planning eventual legacy decommission).

8. **Can you partially adopt Clean Core (some standard, some custom)?**
   Yes, and most organizations do. The question is ratio: are you 80% standard (good) or 20% standard (bad)? Push towards higher ratio over time.

## Tough Follow-up Questions

1. **You've done the analysis. 40% of ECC is truly differentiating. Do you accept 40% customization?**
   Probably not all 40% is worth customizing (cost/benefit). Push back: "Which of the 40% is actually competitive advantage? Which is legacy inertia?" Typical outcome: <20% survives scrutiny.

2. **After go-live, business requests revert one changed process back to ECC way. How do you handle it?**
   Escalate to sponsor: cost to revert is customization (x months, $x cost). Accept the new process or pay for customization. Forces business to commit (not just complain).

3. **SAP's quarterly release breaks your extension (critical process). Business can't wait for fix. What do you do?**
   Option 1: Fix extension immediately (best). Option 2: Revert to previous SAP release until extension fixed (acceptable short-term). Option 3: Disable extension, revert to SAP standard temporarily (last resort). Then fix and re-enable.

4. **You're at 25% customization. Can you realistically reduce to <15%?**
   Analysis: which 10% are lowest-value customizations (highest cost-to-maintain, lowest competitive value)? Rearchitect or accept cost of maintaining them. Gradual approach: improve over 2-3 release cycles.

## SAP Transactions
- **IMG** (Implementation Guide) — SAP's tool for configuring standard processes
- **SE38/SE80** — Develop custom code (for extensions, not core modifications)
- **PFCG** — Role configuration (standard and custom roles)

## SAP Tables
- **Standard tables:** Determined by SAP's delivered data model; customization minimal

## Best Practices
- Do the hard work upfront: comprehensive process analysis and categorization
- Make business own the decision: "Accept new process or pay for customization"
- Treat process change as change management project (training, communications, support)
- Use extensions (ABAP extensions, Fiori extensions), not core modifications
- Measure success: track custom code ratio (target <10%)
- Establish governance: CAB reviews customization requests
- Plan for continuous improvement: after go-live, optimize processes (don't revert to legacy)

## Common Mistakes
- Underestimating process change management effort (business doesn't like change; requires strong leadership)
- Deferring process redesign to post-go-live (becomes harder to change after people start using system)
- Accepting high customization ratio too early (then stuck with it for 10 years)
- Not building business case for clean core (why change if you don't understand value)
- Treating clean core as technical decision (it's business decision with technical implications)

## Interviewer's Hidden Expectations

Strong answers show: (1) understanding clean core is **business, not technical** (process redesign, change management, not just less code), (2) **cost-benefit thinking** (one-time change cost vs long-term savings), (3) **pragmatism** (not all processes can be standard; what % is realistic?), (4) **change management** awareness (business resistance, training, support), (5) **governance** (how do you enforce clean core?).

Listen for: "We pushed back on business's customization requests with ROI analysis" or "We deferred customization decision post-go-live; became hard to change" — signs of real experience.

## What Makes This a 10/10 Answer
- Clear distinction: standard (adopt SAP) vs differentiating (customize)
- Business case: cost of process change vs long-term savings
- Governance: how you enforce clean core (CAB reviews)
- Change management: recognizing it's organizational change, not just technical
- Pragmatism: acknowledging some customization is necessary
- Experience example with lesson learned

## Red Flags
- Treating clean core as "no customization allowed" (unrealistic)
- Not understanding it's business decision (thinking it's IT decision)
- Accepting >20% customization without strong justification
- No mention of change management (business resistance ignored)
- Thinking classic modifications are acceptable (they're not in clean core)

## Keywords
- Clean Core, standard processes, extension framework
- Customization ratio, <10% target
- Process redesign, ABAP extensions, Fiori extensions
- Change management, business case, ROI
- Governance, Change Advisory Board, extensions vs modifications

## Related Topics
- [RISE Overview](rise-overview.md)
- [Cloud ALM and Delivery Methodology](cloud-alm.md)
- [RISE Project Methodology](rise-project.md)
