# Enterprise Interview Intelligence Platform - Architectural Philosophy

## Core Mission

Every generated answer must convince an experienced SAP interviewer that the candidate has genuine enterprise implementation experience.

**Technical correctness is mandatory.** But implementation credibility, architectural reasoning, troubleshooting ability, business understanding, and natural conversational delivery are what distinguish production-grade Interview Copilot from documentation-based chatbots.

## What Real Interviewers Evaluate

When interviewing a Senior SAP GRC Consultant:

1. **Concept Understanding** — Not just definitions, but deep business context
2. **Implementation Experience** — Sequence, configuration, dependencies, real issues  
3. **Consultant Thinking** — "In our implementation..." not "Connector is..."
4. **Troubleshooting Ability** — "One issue we encountered..." not "Rulesets identify SoD"
5. **Architecture Understanding** — "Without repository synchronization..." system-level thinking
6. **Follow-up Question Mastery** — Distinguishes 8 years' experience from memorization

## Interview Experience Model (IEM) Template

Every markdown file should follow this structure:

```
1. What is it? (Concept)
2. Why is it needed? (Business context)
3. How does it work? (Technical mechanism)
4. Where is it used? (Enterprise context)
5. How have I implemented it? (Real project experience)
6. What problems occur? (Real issues encountered)
7. How do I solve them? (Troubleshooting approach)
8. Best practices (Lessons learned)
9. Interview follow-up questions (Prepare for deeper dives)
```

Not the old 24-section template. Not documentation. **Interview experience models.**

## Required Knowledge Components (9 Sections)

Every topic must capture:

- **Concept** — Definition with business purpose
- **Enterprise Context** — Why Fortune 500 companies care
- **Implementation Lifecycle** — Design → configure → test → deploy → maintain
- **Real Project Experience** — Actual implementations with context
- **Common Mistakes** — What fails in practice
- **Troubleshooting** — Systematic real-issue resolution
- **Architecture** — System-level implications
- **Business Impact** — Compliance, risk, operations, cost
- **Interview Traps & Follow-ups** — What experienced interviewers probe

## Engineering Philosophy

Every decision—knowledge authoring, retrieval, prompting, generation, optimization—must move closer to this objective:

**The candidate sounds like someone who has actually delivered SAP Security and GRC projects.**

## From Documentation to Experience

**Old:** Store facts → retrieve matching facts → generate answer  
**Result:** Sounds like documentation  
**Problem:** Fails interview credibility  

**New:** Store enterprise experience models → retrieve relevant experience → synthesize authentic answer  
**Result:** Sounds like experienced consultant  
**Success:** Passes interview credibility  

## Knowledge Authoring Guideline

When writing, ask:
- Can I tell a story about implementing this?
- What went wrong in real deployments?
- How would I explain this to a steering committee?
- What would an experienced GRC architect challenge me on?
- Can I answer follow-up questions the interviewer will ask?

If you can't answer these, the knowledge file isn't deep enough.

## Success Criteria (9.8/10)

- Technical accuracy verified ✓
- Sounds like real implementation experience ✓
- Shows architectural thinking ✓
- Demonstrates troubleshooting capability ✓
- Natural conversational tone ✓
- Ready for follow-up questions ✓
- Business impact clear ✓
- Mistakes/pitfalls acknowledged ✓
- Shows genuine enterprise context ✓

## Product Identity

**Not a knowledge platform.**  
**Not a documentation chatbot.**  

An **Enterprise Interview Intelligence Platform** that transforms SAP GRC candidates into architects who can convince experienced interviewers they've delivered real projects at enterprise scale.

## Permanent Principle

This architectural philosophy remains constant across all roadmap execution, knowledge population, prompt engineering, and enhancement decisions. Every engineering choice is evaluated against one test:

**Does this make the candidate sound more like someone who has genuinely delivered SAP Security and GRC projects?**

If yes: prioritize it.  
If no: defer it.  
If unclear: that decision belongs with the user, not the system.
