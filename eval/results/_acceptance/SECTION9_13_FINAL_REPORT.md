# §9–§13 Final Report — Source Provenance, Validation, Provider Modes, BRM/PFCG, Universal Coverage

**Branch:** `feature/interview-engine-v2`  
**HEAD (unchanged):** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Provider tests:** MOCK / DISABLED only — no paid live LLM  
**Commit/push:** none (not requested)

---

## Verdict

| Requirement | Result |
|---|---|
| §9 Source provenance & KB purity (bank exclusion / stem prefer / no parallel engine) | Met in pipeline (prior + retained) |
| §10 Validation independence (inability ≠ validated technical answer) | Met |
| §11 Provider MOCK/DISABLED isolation | Met (21/21 matrix + E2E) |
| §12 BRM meaningful GRC BRM explanation | **PASS** `VERIFIED_WORKFLOW` |
| §12 PFCG focused usage, no keyword soup | **PASS** `RETRIEVED_PROCEDURE` soup=0 |
| §13 Universal / multi-domain smoke | **PASS** (IAM, outside-inventory, experience, PFCG paraphrase) |

---

## Confirmed PFCG root cause (this session)

After earlier folder/coverage/SU24 fixes, isolated retrieval still showed `prefer=true` with a coherent Menu→Authorizations→Generate spoken procedure. Full chat still returned inability via `GENERATION` because:

1. `STATED_PROFILE` includes **Principal** → `wrapMode=senior-backbone` for configure asks  
2. Chat demoted the procedure to backbone-only (no `retrievedProcedureAnswer`)  
3. MOCK `buildDeterministicMockAnswer` returned an **inability** line (no PFCG family fallback)  
4. Inability was treated as a usable/validated answer, blocking procedure recovery  

BRM was unaffected because conceptual “why” skips configure prefer and serves `brm-business-role-lifecycle` verified workflow directly.

---

## Changes implemented (evidence-backed only)

| File | Change |
|---|---|
| `lib/procedureRetention.js` | Configure/how-to intents always `wrapMode=direct` (senior-backbone only for non-configure); broaden usage intent to “how do you work in/with …” |
| `lib/generationGuard.js` | Inability phrases are meta (non-usable); experience asks skip procedure/local-KB checklist recovery |
| `lib/answerIntegrityGate.js` | Inability lines fail integrity as non-technical answers |
| `lib/providerMode.js` | Deterministic mock experience answers use CV-methodology framing (no Activate checklist dump) |
| `eval/brmPfcgAcceptanceAssert.mjs` | Expanded universal acceptance cases |

Q&A bank files preserved. No parallel retrieval engine. No BRM/PFCG-only question families.

---

## Acceptance evidence (MOCK)

```
brmPfcgAcceptance: PASS
  PASS brm-why route=VERIFIED_WORKFLOW
  PASS pfcg-usage route=RETRIEVED_PROCEDURE soup=0
  PASS cross-domain-iam-concepts
  PASS zero-kb-outside-inventory
  PASS experience-s4-methodology
  PASS no-exact-bank-pfcg-paraphrase

section910AcceptanceMatrix: PASS (21/21)
providerModeChatE2e: PASS
```

Artifacts:
- `eval/results/_acceptance/brm-pfcg-acceptance.json`
- `eval/results/_acceptance/forensic-brm-pfcg-root-causes.md`
- `eval/results/_acceptance/section910-acceptance-matrix.json`

---

## What did NOT change

- Frozen pipeline architecture (classification → retrieval → single-pass → integrity)  
- Git HEAD / remote  
- Live/paid provider runs  
- Q&A bank files on disk  

---

## Remaining notes

- `eval/mockGenerationSixQuestionAssert.mjs` targets an external Next server (`:3103`); in-process handler covers the same S/4 experience contract via `brmPfcgAcceptanceAssert`. Restart that server before trusting the HTTP harness against these edits.  
- MOCK answers are not proof of live LLM accuracy (§11).  
- Outside-inventory / invented-product asks correctly refuse fabrication without treating that as a provider failure.
