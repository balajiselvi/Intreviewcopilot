# SAP Requirement Gathering

## Overview

Requirement gathering is the process of understanding what an organization needs from SAP before design begins. Poor requirements lead to systems that don't meet business needs, wasted customization effort, and post-go-live disappointment. Effective requirement gathering involves interviewing business stakeholders, documenting their needs clearly, distinguishing between requirements (must-haves) and nice-to-haves (wants), and getting stakeholder agreement before design proceeds.

## Interview Summary

Requirement gathering is systematically discovering and documenting what the business needs SAP to do, distinguishing critical requirements from secondary wants, and establishing shared understanding before design begins.

## 30 Second Interview Answer

Requirement gathering is asking business users "what do you need SAP to do?" and documenting their answers clearly. You interview stakeholders, understand current processes and pain points, identify what must work and what's nice-to-have, and create a requirements document that business agrees to. This prevents misunderstandings later ("we didn't know you needed that feature").

## 60 Second Interview Answer

Requirement gathering involves interviewing stakeholders, understanding their business processes and constraints, identifying gaps in current systems, and documenting what SAP must do. Effective requirement gathering produces: functional requirements (SAP must calculate cost center allocations this way), technical requirements (system must integrate with legacy inventory system), non-functional requirements (system must support 1000 concurrent users), and constraints (must use existing database platform). A requirements document is created, reviewed by stakeholders, and used during design and testing phases. Key skill: asking good questions ("help me understand how this process works") and listening carefully to understand the "why" behind requirements.

## 90 Second Interview Answer

Requirement gathering is a structured process of discovering what the business needs. It includes: conducting workshops and interviews with business stakeholders; observing current processes (to understand pain points); documenting requirements (what must work, how, and why); categorizing requirements (must-have vs nice-to-have, functional vs technical); and validating with stakeholders (confirming we understood correctly). Common pitfalls: gathering only what stakeholders volunteer (missing implicit requirements), not understanding the business driver (why this requirement matters), not prioritizing (treating all requirements as equally critical), and waiting to gather requirements (should start in Discover phase, not during design). Effective requirement gathering produces a shared understanding of what SAP will do, preventing misunderstandings during configuration. Requirements drive the gap analysis (where does SAP standard not meet requirements?), which drives design decisions (customize or change process?).

## Architecture

Requirement gathering architecture includes:

1. **Stakeholder Identification**
   - Business users: who will use SAP daily
   - Process owners: accountable for business processes
   - Business leadership: approve requirements and trade-offs
   - IT operations: technical constraints and concerns

2. **Requirement Types**
   - Functional: what SAP must do (calculate, track, report)
   - Technical: how it must work (interfaces, integrations, scale)
   - Non-functional: performance, availability, security requirements
   - Constraints: platform, timeline, budget, skill limitations

3. **Documentation Structure**
   - Business process requirements
   - Reporting requirements
   - Integration requirements
   - Data requirements
   - Security and compliance requirements

## Runtime Flow

1. **Planning Phase**
   - Identify stakeholders to interview
   - Prepare question guides (open-ended, not leading)
   - Schedule interviews

2. **Discovery Phase**
   - Conduct individual interviews (one-on-one with stakeholders)
   - Conduct group workshops (cross-functional discussion)
   - Observe current processes
   - Document findings

3. **Analysis Phase**
   - Organize requirements by category
   - Identify conflicts (requirement A contradicts requirement B)
   - Prioritize (must-have vs nice-to-have)
   - Estimate impact (effort, complexity)

4. **Validation Phase**
   - Present requirements to stakeholders
   - Address questions and misunderstandings
   - Get stakeholder agreement/sign-off

5. **Handoff Phase**
   - Requirements document used for design and testing
   - Updated as design proceeds

## Configuration

Requirements documentation includes:

1. **Functional Requirements**
   - Business processes: how work flows through SAP
   - Transaction processing: how orders, invoices, payments processed
   - Master data: what data must be maintained (customers, vendors, materials)
   - Reports: what information must be available

2. **Technical Requirements**
   - Integrations: which systems must connect to SAP
   - Interfaces: data format, frequency, synchronous/asynchronous
   - Performance: response time targets
   - Availability: uptime requirements

3. **Non-Functional Requirements**
   - Security: who can access what data
   - Compliance: regulatory or audit requirements
   - Scale: concurrent users, transaction volume
   - Disaster recovery: backup and restoration requirements

## Implementation Activities

1. **Stakeholder Engagement**
   - Identify all stakeholders affected by SAP
   - Understand their roles and how SAP affects them

2. **Interview Preparation**
   - Develop interview guides (open-ended questions)
   - Learn stakeholder's business area before interviewing

3. **Conducting Interviews**
   - Ask about current processes (pain points, complexity)
   - Ask about information needs (what reports do you need?)
   - Ask about constraints (volumes, timing, compliance)
   - Listen for the "why" behind requirements

4. **Workshop Facilitation**
   - Bring cross-functional stakeholders together
   - Discuss conflicts and priorities
   - Make trade-off decisions

5. **Documentation and Validation**
   - Write clear requirement statements
   - Present to stakeholders for validation
   - Update based on feedback
   - Get sign-off

## Troubleshooting

### Issue 1: Contradictory Requirements
**Symptoms:** Finance requires centralized GL structure, business units want decentralized cost accounting

**Root Cause:** Stakeholders have different priorities, no conflict resolution process

**Resolution:** Escalate to business leadership, discuss trade-offs, make decision, document rationale

---

### Issue 2: Vague Requirements
**Symptoms:** "System must be fast" or "Reports must be comprehensive" without specifics

**Root Cause:** Stakeholder doesn't know how to articulate specific needs

**Resolution:** Ask clarifying questions, observe current process, translate into specific requirements

## Common Interview Questions

1. **What does requirement gathering accomplish?**
   Creates shared understanding of what SAP must do, preventing misalignments during design and testing.

2. **What are the different types of requirements?**
   Functional (what it does), technical (how it works), non-functional (performance, security), constraints (platform, timeline).

3. **How do you distinguish requirements from nice-to-haves?**
   Requirements are must-haves for business success. Nice-to-haves are enhancements that would be valuable but aren't critical.

4. **What's a common requirement gathering mistake?**
   Failing to understand the "why" behind requirements—just documenting what stakeholders say without understanding business drivers.

5. **How do you handle conflicting requirements?**
   Understand the business driver for each, escalate to business leadership for trade-off decision, document decision and rationale.

6. **What's the role of testing in requirements?**
   Test cases are derived from requirements—requirements are the acceptance criteria.

## Tough Follow-up Questions

1. **What if gathering requirements takes months and project is under timeline pressure?**
   Prioritize: gather requirements for Wave 1 (go-live scope), defer Wave 2 requirements to later phase.

2. **What if stakeholders don't know their requirements?**
   This is common. Use iterative approach: document what you understand, present back, refine based on feedback.

3. **How do you know requirements are complete?**
   When stakeholders confirm "yes, this covers what we need."

## SAP Transactions

- SPRO: Access configuration IMG (understand what's configurable)
- SM30: Table maintenance (understand data structures)

## SAP Tables

- Understand master data tables (MARA, KNA1, LFA1, etc.) relevant to requirements

## Best Practices

- **Start early:** Discover phase, before design
- **Involve right stakeholders:** Business users and decision-makers
- **Ask good questions:** Open-ended, understand the "why"
- **Listen carefully:** Users often volunteer implicit requirements
- **Prioritize ruthlessly:** Not all requirements are equally critical
- **Validate constantly:** Confirm understanding with stakeholders
- **Document clearly:** Requirements should be unambiguous

## Common Mistakes

- **Gathering only explicit requirements:** Users don't always state what they need
- **Not understanding business drivers:** "Why is this requirement important?"
- **Not prioritizing:** Treating all requirements equally
- **Insufficient stakeholder involvement:** Requirements without buy-in
- **Poor documentation:** Requirements that are ambiguous or unclear

## Interviewer's Hidden Expectations

- **Curiosity:** Do you genuinely want to understand business needs?
- **Clarity:** Can you translate vague needs into specific requirements?
- **Business thinking:** Do you understand why business needs drive technical design?
- **Pragmatism:** Do you know that perfect requirements take forever; good enough wins?

## What Makes This a 10/10 Answer

- Candidate explains requirement gathering as foundation for design and testing
- Discusses functional, technical, non-functional requirements and constraints
- Shares example: unclear requirement that caused rework during configuration
- Understands prioritization: must-have vs nice-to-have
- Shows listening skill: understanding "why" behind requirements
- Explains stakeholder validation is critical
- Demonstrates pragmatism: done is better than perfect

## Red Flags

- Candidate doesn't understand purpose of requirement gathering
- Confuses requirements with design
- Hasn't participated in actual requirement gathering
- No awareness of requirement conflicts or prioritization

## Keywords

- Requirement gathering
- Functional requirements
- Technical requirements
- Non-functional requirements
- Gap analysis
- Stakeholder interviews
- Requirements prioritization
- Acceptance criteria

## Related Topics

- [Blueprinting](./blueprinting.md)
- [Fit-Gap Analysis](./fit-gap-analysis.md)
- [Project Lifecycle](./project-lifecycle.md)
