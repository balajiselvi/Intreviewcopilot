# Forensic Root Causes — BRM & PFCG (READ-ONLY)

Questions:
- A: `Why do organizations implement BRM?`
- B: `Explain how do you use PFCG?`

Provider mode during probe: **MOCK** (no paid LLM). Evidence: `forensic-brm-pfcg.json`.

---

## A. BRM — Confirmed failure chain

| Stage | Observation |
|---|---|
| Classification | Analysis domain SAP GRC; topic GRC; folders `[grc]`; family empty; procedureIntent=`configure` (from verb “implement”) |
| Retrieval | Coverage **IRRELEVANT_RETRIEVAL**. Top hits: interview banks + unrelated “Implementation Activities” (BRF+, MSMP, ARM). **`brm.md` not in top 16** despite 35 indexed chunks |
| Bank contamination | `grc-principal-architect-interview-bank.md` + `deloitte-usi-specific-gap-fillers.md` ranks 1–2 (golden +6 prefer path) |
| Verified workflow | Correctly selected `brm-business-role-lifecycle` with source `knowledge/grc/brm.md` and a substantive BRM answer |
| Integrity | **Rejected** verified answer for `bank-heading-or-coaching-leak` because regex `(?:^|[.!?]\s+)Validate\b…` matches the legitimate step “Validate the mapping…” |
| Client delivery | Inability message: “I do not have a reliable technical answer…” Route still labeled VERIFIED_WORKFLOW |
| LLM | Not invoked (verified short-circuit before GENERATION) |

### Root causes (ordered)

1. **Integrity false positive** on the word “Validate …” destroys a correct BRM verified answer → inability.  
2. **Production retrieval prefers Q&A banks** over `brm.md` for this ask; technical BRM evidence never grounds generation.  
3. **Intent “configure” from “implement”** biases scoping toward generic Implementation Activities headings (BRF+/MSMP), worsening IRRELEVANT_RETRIEVAL.  
4. Not a missing knowledge document — `brm.md` exists and is indexed.

---

## B. PFCG — Confirmed failure chain

| Stage | Observation |
|---|---|
| Classification | Analysis “Role Design / SAP Security”; **explicitProductTopics = []**; **folders = []**; family empty; procedureIntent empty |
| Topic gap | PRODUCT_TOPIC_MATCHERS map S/4 by edition name only — **bare `PFCG` does not open `security` folder** via productKnowledgeFolders |
| Retrieval | When unscoped, `pfcg.md` Overview can still rank #1, but coverage marked IRRELEVANT; coaching headings (“What Makes This a 10/10”, “Common Interview Questions”) also surface |
| Verified workflow | **Wrong playbook**: `su24-pfcg-derived-roles` selected because `requireAny` includes bare `pfcg` and task weight `["pfcg", 3]` alone reaches score ≥ 3 without SU24/derived being asked |
| Client delivery | SU24/USOBT_C/SU25/derived-role keyword accumulation — not a focused “how do you use PFCG?” explanation |
| LLM | Not invoked |

### Root causes (ordered)

1. **Verified-workflow over-match**: SU24+derived playbook fires on PFCG-only usage questions.  
2. **Product-folder gap**: bare PFCG does not resolve to Authorization/security folders in `productKnowledgeFolders`.  
3. **Coaching sections inside technical docs** compete with Overview/procedure headings (provenance purity within file).  
4. **Senior-backbone demotion (confirmed post-fix)**: With `STATED_PROFILE` containing “Principal”, `shouldPreferRetrievedProcedure` set `wrapMode=senior-backbone` for configure asks. Chat skipped `retrievedProcedureAnswer`, entered MOCK GENERATION, and `buildDeterministicMockAnswer` emitted an inability line that integrity treated as a valid answer — so a coherent `pfcg.md` procedure never reached the client.  
5. Not missing `pfcg.md` — file exists under `knowledge/security/pfcg.md`.

---

## Architecture constraints for the fix

- Do **not** add BRM/PFCG-only question families or parallel retrieval engines.  
- Prefer **general** mechanisms:
  - Exclude / demote interview-bank source categories in production technical retrieval (provenance isolation).  
  - Prefer same-stem technical docs (`brm.md`, `pfcg.md`) when product tokens match.  
  - Tighten integrity `Validate…` leak pattern so procedure steps are not false-positive.  
  - Verified workflows: require specialty anchors (SU24/derived) before selecting specialty playbooks; do not let bare product token alone select them.  
  - Map bare PFCG (and similar enforcement tools) to Authorization/security folders via universal product recognition — not a one-off BRM hack.  
- Preserve all Q&A bank files on disk; filter at retrieval/ingestion boundary.  
- Conceptual “why” asks must not be forced into configure-only procedure routes when verified conceptual content exists.

---

## Acceptance targets (post-fix)

- BRM → meaningful Business Role Management explanation (business↔technical role mapping / ARM usability), without exact Q&A match.  
- PFCG → focused Profile Generator usage (menu → SU24 proposals → auth data → generate profile → assign/compare), without unrelated SU24/derived keyword soup unless asked.  
- No new hardcoded question families for these two strings.
