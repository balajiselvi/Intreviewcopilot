# Interview Copilot — Engineering Operating Contract

## Mission

Build and maintain a Principal Architect-level SAP Security / IAM interview assistant.

The quality target is not:
- more SAP keywords
- more KB files
- longer answers
- more prompt rules

The target is:
- technical correctness
- architectural reasoning
- business relevance
- implementation realism
- governance depth
- precise SAP terminology
- follow-up consistency
- zero fabricated candidate experience

## Repository Discipline

Before changing anything:

1. Inspect git status.
2. Inspect current HEAD.
3. Inspect the actual implementation.
4. Reproduce the problem.
5. Identify the exact failing layer.
6. Define the smallest generalized fix.
7. Implement.
8. Test.
9. Run regression tests.
10. Inspect generated answers where applicable.
11. Commit only validated work.

Never assume old documentation or commit IDs are current.

## Architecture

Current pipeline:

Question
→ Context Resolution
→ Interview Analysis
→ Classification
→ Reasoning Planning
→ Component Selection
→ Technical Reasoning
→ Retrieval
→ Prompt Construction
→ Single-pass LLM
→ SSE/UI

Do not redesign this architecture without evidence.

## Frozen Systems

Treat these as frozen unless proven to be the root cause:

- retrieval architecture
- classification
- context resolution
- reasoningPlanner
- componentSelector
- technicalReasoner routing
- persona detection
- single-pass generation

## Principal Architect Standard

Prefer:

Business Objective
→ Architectural Decision
→ Security/Identity Boundaries
→ Relevant Technical Mechanisms
→ Governance
→ Trade-offs
→ Operational Reality

when relevant.

Do not force irrelevant sections.

Do not produce product inventories.

## Identity Plane Contract

Never confuse:

HR / SuccessFactors
= lifecycle/workforce attributes

IAS
= authentication, federation, SSO, MFA, trust

IPS
= provisioning, transformations, mappings, synchronization

IAG
= governance, Access Request, Access Analysis, Certification, PAM

Target application
= authorization enforcement

## Anti-Fabrication

Never invent:
- customers
- employers
- projects
- incidents
- countries
- metrics
- budgets
- timelines
- executives
- outcomes
- certifications
- personal implementation history

When candidate experience is not supplied, use methodology framing:

"I would..."
"My approach would be..."
"If I were designing..."
"I would validate..."

Retrieved examples are NOT candidate experience.

## JD Priority

Highest-value capabilities:

- SAP role/authorization design
- IAG
- IAS
- IPS
- JML
- SoD
- Access Analysis
- role rationalization
- role remediation
- governance
- SAP/non-SAP IAM integration
- RISE/hybrid
- data quality
- Excel/data analysis
- stakeholder management
- go-live/hypercare

Secondary gaps:
- SuccessFactors
- Ariba
- CAR
- Joule for IAG

## Data Quality

Treat role/user data analysis as a first-class capability.

Answers should reason through:

data
→ validation
→ anomaly detection
→ analysis
→ remediation
→ governance
→ audit evidence

## Testing

Never claim success from one generated answer.

Use:
- target case
- negative controls
- positive controls
- unseen paraphrases
- follow-up questions
- existing regression suite

Separate:
- technical correctness
- reasoning quality
- retrieval quality
- fabrication
- answer style

## No Loop Rule

Do not repeatedly patch individual words or keywords.

A fix should represent a generalized capability.

Avoid:
- keyword accumulation
- regex accumulation
- topic-specific answer templates
- unnecessary new scripts
- speculative refactoring

## Git

Never force-push.

Never reset/revert unrelated user work.

Never modify remote configuration unless necessary and validated.

Never invent a GitHub repository.

## Development Server

Never run two Next.js dev servers against the same project `.next` directory.

## Decision Rule

When evidence is sufficient:

ACT → TEST → VERIFY → COMMIT

Do not ask for approval after every minor step.

Stop only for:
- destructive action
- missing credentials
- genuinely ambiguous architectural decision
- external blocker

## Definition of Done

A feature is not complete because code compiles.

It is complete when:
- targeted behavior works
- regressions are clean
- unseen-question behavior is acceptable
- generated answers are technically accurate
- no fabrication is introduced
- repository state is understood
