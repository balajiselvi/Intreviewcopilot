# Interview Copilot — AI Agent Handoff Prompt

Copy everything below the line into a new AI agent session to onboard it onto this
project.

**Current (2026-09-08):** Branch `feature/interview-engine-v2`. P0/V3 interview-engine
hardening is in `d367e27` and `26a5e74` (follow-up domain inheritance, JML lifecycle,
RISE Cloud Connector customer/partner ops, experience integrity, 90–120 word cap).
Default rehearsal JD lives in `utils/config.js` (Chalhoub IAM Lead targeting only —
never claim Chalhoub, retail, or Accenture experience). Frozen: retrieval,
classification architecture, single-pass generation, gpt-4o-mini. Live eval against
one Next server (`EVAL_APP_BASE_URL=http://localhost:3001` if port 3000 is taken).
Prefer `AGENTS.md` and `git log` over older sections below.

Sections 3–8 were written at an earlier handoff (`d6aa1ea`) and are historical.

---

You are picking up development on **Interview Copilot**, a production-quality,
live interview-assistance tool. Read this whole document before touching any code.

## 1. Location & Identity

- **Path:** `D:\My Projects\InterviewCopilot`
- **Git branch:** `feature/interview-engine-v2`
- **P0/V3 commits:** `d367e27`, `26a5e74`
- **Repo docs are the source of truth**, not chat history. Read in this order:
  `AGENTS.md` → `docs/PROJECT_STATE.md` → `docs/CHANGELOG.md` → `docs/ARCHITECTURE.md` →
  `docs/RESUME_GUIDE.md` → `docs/PRODUCTION_READINESS.md`. This handoff document
  summarizes and adds the JD-calibration angle; it does not replace those.

## 2. What The Product Does

Interview Copilot listens to both the interviewer (system audio) and the candidate
(microphone) via Azure Speech SDK, transcribes both in real time, and generates a
natural, spoken-style answer to the interviewer's question using a single-pass
Retrieval-Augmented Generation pipeline grounded **only** in a structured markdown
knowledge base under `knowledge/` — never raw uploaded documents, never model
general knowledge alone.

```
pages/interview.js (client, Azure Speech SDK)
  → POST /api/chat (pages/api/chat.js)
      → question analysis (interviewAnalyzer.js, reasoningPlanner.js,
        componentSelector.js, interviewerProfiler.js, technicalReasoner.js)
      → knowledge retrieval (retrievalService.js — hybrid semantic+lexical+
        component+intent scoring over knowledge/**/*.md)
      → prompt construction (lib/prompt/interviewPrompt.js)
      → single streamed LLM call (OpenAI or Gemini, model-agnostic)
      → heuristic post-answer evaluation (no second LLM call — hard constraint)
  → client renders streamed answer + AnswerQualityPanel
```

**Hard architectural constraint:** single-pass generation only. No regeneration,
no second LLM call, ever — explicitly rejected earlier as too slow for a live
interview and prone to encouraging embellishment.

## 3. Target Candidate Profile — THE Calibration Anchor

Every classification rule, knowledge domain, and reasoning-mode decision in this
codebase exists to serve interview prep for **one specific role profile**. This is
the job description the product is built against — treat it as the ground truth
for what "good coverage" means, and use it to prioritize any future knowledge or
reasoning work:

> **Technical Expertise** — Strong SAP role/authorization design across S/4HANA,
> SuccessFactors, BW/4HANA, SAP Analytics Cloud (SAC), Datasphere, Ariba, CAR, BTP.
> Strong hands-on: **SAP IAG, SAP IAS, SAP IPS**; integration of SAP IAM components
> with SAP and non-SAP systems; **HR-driven Joiner/Mover/Leaver identity lifecycle
> automation**; **Joule for IAG**; enterprise-scale role design, remediation,
> rationalization, governance programs. Retail industry experience a plus.
>
> **GRC** — SoD concepts, SAP IAG Access Analysis, SoD risk management; technical
> design/maintenance of SoD rulesets; SoD violation analysis and remediation/
> mitigation control design; firefighter/PAM, access certification, audit support.
>
> **Delivery & Data Quality** — Advanced Excel/data analysis; spotting
> inconsistencies/errors/duplicates in large role and user datasets; independent
> validation, working across parallel workstreams with limited supervision.
>
> **Stakeholder Management** — Explaining IAM/security concepts in business-friendly
> language to internal/external business and IT teams; strong documentation.
>
> **Preferred** — SAP RISE; IAG implementation in a hybrid landscape; large-scale
> SAP transformation programs; regulated/audit-driven environments; go-live,
> hypercare, production stabilization.

This explains, in retrospect, several fixes made this session: the IAG-vs-IAS-vs-IPS
category/component-derivation bug (`22304e6`), the SAP-security ROLE plural-support
fix (`c89138b`), and the ROLE/PROFILE false-positive fixes (`61bf869`) all exist
because this exact JD's core competency — role design/governance across IAG/IAS/IPS
— was producing wrong or misattributed answers.

## 4. Current Status (as of handoff)

- **Knowledge platform:** 113 markdown files across 23 domains (grew from the
  originally-planned 20 — `iag/`, `sac/`, `hana/` were added later). Retrieval,
  chunking, embeddings, indexing, and classification/domain-routing are **frozen**
  — see `docs/PROJECT_STATE.md`'s "Frozen Components" list before touching any of
  it. Bug fixes only, no redesigns, without a demonstrated production-blocking
  defect.
- **Current development phase:** "Principal Architect reasoning & answer-quality
  layer" (started 2026-09-06) — a minimal deterministic reasoning contract
  (`lib/reasoningPlanner.js`'s `buildReasoningContract`) injects a compact
  `REQUIRED ANSWER ELEMENTS` prompt section. A/B-evaluated: materially helps
  Troubleshooting/Architecture/SAP+PMP-hybrid modes, small help for Factual,
  negligible for Behavioral (already covered by its own template) and for
  misrouted-to-General questions. Next step (evaluation-only, not yet decided):
  whether to build further on the contract or first fix mode-assignment
  robustness. **Tier 2** (rewriting `CATEGORY_TEMPLATES.General`) is scoped but
  explicitly deferred, not approved.
- **Also fixed this session, committed through `d6aa1ea`:** category-aware SAP
  component/objective derivation; hybrid-safe technical-evidence gating for
  generic delivery language ("resolve"/"escalation" false positives); ROLE vs.
  PROFILE domain-level false-positive divergence (two separate mechanisms, two
  separate fixes); ROLE plural support (`role`→`roles?`); a `technicalReasoner.js`
  fallback gate for uncorroborated `General`-category questions.
- **Investigated, NOT yet implemented (awaiting approval):**
  - Anti-fabrication / retrieved-example contamination — a live-reproduced
    fabrication (fake first-person "Finance/CFO" incident) traced to unlabeled
    first-person `Example:` quotes in 11 KB files (e.g.
    `knowledge/project-management/stakeholder-management.md`,
    `knowledge/behavioral/self-introduction.md`). Full A-F report delivered to
    the user; no fix approved yet.
  - Plural support for `authorization`/`connector`/`mitigation` — deferred after
    the ROLE plural work showed real risk of extending false positives; needs a
    dedicated design pass, not a copy-paste of the ROLE fix.
- **Operational note:** this session diagnosed and recovered from a blank
  white-page incident caused by `.next` build-cache corruption — root-caused to
  running two concurrent Next.js dev servers against the same project directory
  (and therefore the same shared `.next` folder). See **Section 7** before
  starting any second dev server for isolated testing.

## 5. Verified Knowledge-Coverage Gaps Against This JD

These were checked directly against the live `knowledge/` tree at handoff time —
not assumed from documentation, which is stale in places:

| JD requirement | Coverage | Evidence |
|---|---|---|
| SAP IAG hands-on / Access Analysis / SoD rulesets | **Strong** | `knowledge/grc/{ara,rulesets,risk-analysis,mitigation,firefighter}.md` all populated; `knowledge/iag/iag-overview.md` exists |
| SAP IAS / IPS | **Strong** | `knowledge/btp/{ias,ips,cloud-identity}.md` populated |
| HR-driven Joiner/Mover/Leaver, identity lifecycle | **Gap — high priority** | `knowledge/idm/*.md` — **all 4 files are 0 bytes** (`idm-architecture.md`, `idm-overview.md`, `idm-provisioning.md`, `idm-troubleshooting.md`). This is the JD's second named competency and has zero real content. |
| SAP IAG depth beyond overview | **Thin** | `knowledge/iag/` has exactly 1 file (`iag-overview.md`, 9KB) — no dedicated content on IAG access-request workflows, IAG-SoD integration depth, or IAG-specific role governance beyond what's covered generically in `grc/` |
| Joule for IAG | **Missing entirely** | Zero matches anywhere in `knowledge/` or `lib/` |
| SAP SuccessFactors | **Missing entirely** | No directory, no file, no code reference |
| SAP Datasphere | **Missing entirely** | Same |
| SAP Ariba | **Missing entirely** | Same |
| SAP CAR (Customer Activity Repository) | **Missing entirely** | Same |
| SAP Analytics Cloud (SAC) | **Thin** | `knowledge/sac/sac-security.md` — 1 file only |
| SAP BW/4HANA | **Partially stubbed** | `knowledge/bw/bw-security.md` populated (12.6KB), but `analysis-authorizations.md` and `infoproviders.md` are **still 0 bytes** (a known, previously-flagged, still-unresolved gap) |
| Retail industry context | **Missing** | No retail-flavored scenario content anywhere (JD lists this as "good to have," not mandatory) |
| Advanced Excel / role-dataset data-quality scenarios | **Not directly covered** | No knowledge file addresses "spot inconsistencies in a role/user dataset" as an interview scenario |
| RISE, hybrid landscape, transformation programs, hypercare | **Strong** | `knowledge/rise/` (8 files), `knowledge/cutover/`, `knowledge/hypercare/` all populated |

**If resuming knowledge-content work, the highest-leverage next action per this JD
is populating `knowledge/idm/` (currently 100% empty) and thickening `knowledge/iag/`
and `knowledge/sac/`** — these map directly to the JD's named "strong hands-on"
requirements, not to nice-to-haves. `SuccessFactors`/`Datasphere`/`Ariba`/`CAR` are
listed as broader/"good to have" in the JD and are lower priority than IDM/IAG/SAC.

Do not treat this table as authorization to start writing content — confirm
priority and scope with the user first, per the project's own approval discipline
(see Section 8).

## 6. Frozen Components — Do Not Redesign

From `docs/PROJECT_STATE.md`, current as of handoff:
- Markdown parsing, chunking, embedding generation, indexing (`services/*.js`)
- Hybrid retrieval/ranking (`services/retrievalService.js`) — query-aware; never
  reintroduce content-only (query-independent) scoring bonuses, a regression class
  that has recurred more than once
- Knowledge folder semantic structure
- Interview generation prompt shape and single-pass architecture
- Domain/category routing (`lib/interviewAnalyzer.js`, `pages/api/chat.js`)
- SAP-component selection/fallback (`lib/componentSelector.js`,
  `lib/technicalReasoner.js`) — gated on genuine domain evidence, not a category
  blacklist, as of 2026-09-06
- `lib/interviewerProfiler.js` persona regexes (word-boundary-fixed)
- The current minimal reasoning contract's *shape* (bug-fixing its
  `requiredElements` wording is fine; redesigning the contract or reactivating
  `reasoningPlanner.js`'s old dead code is not)

Bug fixes within these are fine. Architectural rewrites require a demonstrated
production-blocking defect, not a preference.

## 7. Operating Rules (Lessons Already Paid For — Don't Relearn Them)

1. **Diagnose → design → test → get explicit approval → implement → validate →
   commit.** This is not a style preference; every fix this session followed
   exactly this sequence, with the user approving each step before code changed.
   Do not implement, and never commit, without explicit approval.
2. **Test before implementing, on real source, not toy examples.** This project's
   established technique: load the real `.js` source files directly (strip
   `import`/`export`, compile via `Module._compile`) rather than hand-reproducing
   logic — hand-reproductions drift out of sync with the real source.
3. **Never run two Next.js dev servers against the same project directory.**
   Confirmed root cause of a `.next` build-cache corruption incident this session
   (selective deletion of compiled page bundles while the primary server kept
   running, causing a 500/blank-page failure). If a second, isolated dev server
   is ever needed for diagnostic testing, it must use a separate `.next` output
   directory (e.g. `next dev -p 3001` with `distDir` reconfigured, or a separate
   working-tree checkout) — never the same build folder as the live server.
4. **No fabricated candidate experience.** Knowledge files must describe
   implementation/rollout/support activities as generic consultant
   responsibilities, never first-person specific claims (a named person, a named
   employer, a specific dollar figure). An anti-fabrication investigation this
   session found 11 files violating this via unlabeled first-person `Example:`
   quotes — flagged, not yet fixed; be aware retrieval can still surface these
   until that fix is approved and implemented.
5. **Generalize, never hardcode per-question.** Any answer-quality fix must work
   across the category/domain in general, not special-case specific wording from
   whatever test question exposed the bug.
6. **Preserve git hygiene.** Clean working tree in, clean working tree out. Use
   the scratchpad directory for throwaway test scripts, never the project tree.
   Never delete/reset without checking `git status` first.

## 8. How To Resume

1. Run `git status --short` and `git log --oneline -10` to confirm you're at (or
   past) `d6aa1ea` and the tree is clean.
2. Read `docs/PROJECT_STATE.md` for the authoritative current-phase detail this
   document only summarizes.
3. Ask the user what's next: continue the Principal Architect reasoning-layer
   evaluation (Section 4), pick up one of the deferred items (Section 4), or
   prioritize knowledge-content gaps against this JD (Section 5) — do not assume;
   this project's whole history this session was user-directed, task by task.
4. Start the dev server via the project's existing `interview-copilot-dev`
   launch config (`npm run dev`, port 3000) to verify any change live before
   reporting it done — this is a UI-facing product; type-checking alone does not
   verify feature correctness.
