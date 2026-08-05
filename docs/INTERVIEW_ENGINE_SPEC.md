# INTERVIEW_ENGINE_SPEC.md

# SAP Interview Copilot - Enterprise Technical Reasoning Specification
Version: 1.0
Status: LOCKED BASELINE

---

# 1. PROJECT OBJECTIVE

Build an Interview Copilot that produces answers equivalent to an experienced SAP Security / SAP GRC / SAP IDM Architect with 15+ years of implementation experience.

The system must answer exactly like a senior consultant during a live interview.

It must NEVER sound like:

- ChatGPT
- SAP Help Portal
- SAP Documentation
- Functional Consultant
- Business Analyst

---

# 2. PRIMARY GOAL

Every answer must demonstrate implementation knowledge rather than theoretical knowledge.

The interviewer should immediately conclude that the candidate has actually implemented the solution.

---

# 3. RESPONSE TARGET

First Response

< 2 Seconds

Complete Response

< 5 Seconds

Maximum Tokens

180

Maximum Words

120

Preferred Duration

30–60 Seconds

---

# 4. ANSWER STRUCTURE

Every technical answer MUST follow this sequence.

1. Direct Answer

Immediately answer the question.

No introduction.

No definition.

No business objective.

---------------------------------

2. Technical Mechanism

Explain how SAP actually performs the function.

---------------------------------

3. SAP Components

Mention only the relevant SAP objects.

Examples

PFCG

SU24

SU25

MSMP

BRF+

ARA

ARM

EAM

Provisioning Framework

Connector Groups

RFC

Repository

IAS

IPS

IAG

---------------------------------

4. Runtime Flow

Explain what happens internally.

Example

HR Change

↓

IDM Repository

↓

Business Role Mapping

↓

Provisioning Framework

↓

SAP Target System

---------------------------------

5. Implementation Detail

Mention

Configuration

Tables

Jobs

Reports

Transactions

Authorization Objects

only when relevant.

---------------------------------

6. Real Project Insight

One implementation lesson.

Maximum two sentences.

---

# 5. FORBIDDEN CONTENT

Never start with

Business Objective

Business Requirement

Business Outcome

Business Value

Governance

Compliance

Digital Transformation

Enterprise Strategy

Architecture Recommendation

Production Consideration

Trade-Off Analysis

Leadership Discussion

unless interviewer explicitly asks.

---

# 6. TECHNICAL DEPTH

Every answer should contain at least ONE of:

Runtime Flow

Configuration Flow

Provisioning Flow

Authorization Flow

Repository Flow

Synchronization Flow

Approval Flow

Risk Analysis Flow

Transport Flow

Migration Flow

---

# 7. TECHNICAL OBJECTS

Whenever applicable include:

Transactions

Tables

Authorization Objects

Programs

Background Jobs

Configuration Nodes

RFC Destinations

Connector Groups

Repositories

Provisioning Jobs

Identity Stores

Business Roles

Technical Roles

Derived Roles

Composite Roles

Risk IDs

Functions

Actions

Permissions

Mitigation Controls

---

# 8. KNOWLEDGE RETRIEVAL

Maximum Retrieved Chunks

3

Priority

1. SAP GRC

2. SAP Security

3. SAP IDM

4. SAP IAG

5. SAP IAS

6. SAP IPS

Ignore unrelated documents.

Never inject unnecessary knowledge.

---

# 9. PROMPT RULES

Prompt must contain only

Role

Answer Style

Relevant SAP Components

Retrieved Knowledge

Question

Output Rules

Everything else should be removed.

---

# 10. INTERVIEW MODE

Every answer should sound like spoken English.

No markdown.

No bullet overload.

No documentation style.

No repetition.

No generic filler.

---

# 11. QUESTION TYPES

Technical

Configuration

Scenario

Comparison

Workflow

Troubleshooting

Migration

Architecture

Inventory

Each question type has a different response structure.

---

# 12. QUALITY CHECKLIST

Before returning an answer verify

✓ Question answered directly

✓ SAP runtime explained

✓ Correct SAP terminology

✓ Relevant SAP objects included

✓ Implementation experience demonstrated

✓ No business filler

✓ No repeated content

✓ No fabricated SAP functionality

✓ Fits within 30–60 seconds

---

# 13. PERFORMANCE RULES

Single LLM Call

YES

Multiple Regeneration

NO

Maximum Prompt Size

Small

Maximum Knowledge Chunks

3

Streaming

Enabled

---

# 14. FILE LOCK ORDER

The following files will be finalized in this order.

1.
technicalReasoner.js

2.
reasoningPlanner.js

3.
sapInterviewPrompt.js

4.
vectorSearch.js

5.
chat.js

After a file is approved it is LOCKED.

No further changes unless a bug is discovered.

---

# 15. SUCCESS CRITERIA

The project is considered complete only when:

Response time is below 5 seconds.

100 interview questions are tested.

Average technical score exceeds 9.5/10.

No business-oriented answers for technical questions.

No repetitive answers.

No unnecessary reasoning.

No prompt bloat.

Stable production-ready architecture.

---

END OF SPECIFICATION