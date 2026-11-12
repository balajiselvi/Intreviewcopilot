# Final Targeted Refinements — Go/No-Go Report

**Branch:** `feature/interview-engine-v2`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2` (unchanged; no commit/push)  
**Contract:** Global SAP Technical Answer Quality (domain-wide; GRC not default)

## Verdict: **CONDITIONAL GO**

Ready for separately authorized live-provider validation. Mock/disabled isolation, retrieval tech-ref prefer, FF admission, ST03N methodology grounding, offline 54/54, and mock-GENERATION six-question proof are verified.

---

### A. Provider isolation (MOCK / DISABLED / LIVE)
| Check | Result |
|---|---|
| `lib/providerMode.js` + `config/appConfig.llm.providerMode` | Present |
| Unknown mode → disabled (fail-closed) | PASS |
| Chat SDK entry points call `assertLiveTransportAllowed` | PASS (≥5) |
| Mock/disabled strip client/env API keys | PASS |
| E2E MOCK via real `pages/api/chat.js` | **liveTransportInvocations=0**, openaiCalls=0 |
| E2E DISABLED | **liveTransportInvocations=0**, openaiCalls=0 |
| Body spoof (`providerMode: live`, `forceLocalFallback`) ignored for mode | PASS |

Evidence: `eval/results/_acceptance/provider-mode-isolation.json`, `provider-mode-chat-e2e.json`

### B. Retrieval — technical refs over banks
Seven-family probe after ranking fix:

| Family | techTop8 | tech rank | bank in top8 |
|---|---|---|---|
| Critical Actions | true | 1 | 1 |
| Critical Permissions | true | 1 | 1 |
| Critical Access Risks | true | 1 | 0 |
| ARA hierarchy | true | 1 | 1 |
| **Rule Set Components** | true | **1** | 0 |
| Mitigation Lifecycle | true | 2 | 0 |
| **FF logs** | true | **1** | 3 |

Evidence: `eval/results/_acceptance/retrieval-seven-families.json`

### C. ST03N experience grounding
Dover card spoken uses methodology framing (“I would mine usage — typically ST03N… CV does not document a specific ST03N window”). No invented % role cut. Prompt tense discipline retained.

### D. Firefighter admission
Exact inputs ANSWER + procedureIntent=`troubleshoot`:
- What if Firefighter Logs are Not Generated?
- Why are Firefighter logs not generated?
- Firefighter logs are missing — how do you troubleshoot?
- What do you check when EAM firefighter session logs are not created?

Evidence: `firefighter-admission.json`

### E. Mock-GENERATION six-question (:3103)
Server: `LLM_PROVIDER_MODE=mock`, `INTERVIEW_SAFE_MODE=0`, `NEXT_DIST_DIR=.next-mock-3103` (does not share `:3102` `.next-dev`).

| ID | Route | OK |
|---|---|---|
| Critical Actions | GENERATION (mock) | PASS |
| Mitigation Lifecycle | GENERATION (mock) | PASS |
| Rule Set Components | GENERATION (mock) | PASS |
| FF logs | RETRIEVED_PROCEDURE | PASS |
| What if | DEFER / waiting | PASS |
| S/4 experience | GENERATION (mock) | PASS |

Browser UI on `:3103`: Critical Actions displayed; “What if” → waiting. Remaining four covered by API harness against same mock server.

### F. Offline non-regression
**54/54 PASS** (`node eval/runOffline.js`)

Transient failures during ST03N/provider wiring (phase5ContractAssert, providerStreamAssert) fixed without weakening isolation:
- Power Query / 10k asks rank `data-quality` (stale claim filtered)
- Stream harness injects live-allowed provider-mode stubs

### G. Quality contract compliance notes
- Ranking boost for tech refs is scoped to GRC definitional/FF-log asks when GRC folders are in scope — not a global GRC default for unrelated domains.
- Mock answers use integrity/principle fallbacks; no invented personal metrics.
- Artifact rule unchanged: never invent T-codes/tables.

### H. What changed (production-adjacent)
- `lib/providerMode.js` (new)
- `config/appConfig.js` — `providerMode`
- `pages/api/chat.js` — guards, key strip, mock/disabled/live branches, SSE stats
- `lib/productKnowledgeScope.js` — tech-ref prefer for definitional/FF
- `lib/procedureRetention.js` — FF-log troubleshoot intent
- `eval/lib/expertiseCards.js` — ST03N methodology + Power Query ranking
- `lib/prompt/interviewPrompt.js` — tense/ST03N wording (prior)
- `next.config.mjs` — honor `NEXT_DIST_DIR` for parallel mock Next
- Eval harnesses under `eval/*providerMode*`, `firefighterAdmissionAssert.js`, `mockGenerationSixQuestionAssert.mjs`

### I. What did NOT change
- No commit / push
- No index rebuild
- No paid live provider calls
- Frozen pipeline architecture (classification/retrieval/planner/selector) intact
- Dirty tree preserved

### J. Remaining uncertainty
- Live-provider quality and latency not evaluated (by design).
- Browser exercised 2/6 questions visually; 6/6 via mock API on same process.
- FF browser path returned RETRIEVED_PROCEDURE (valid); mock GENERATION still proven on definitional asks.

### K. Go / No-Go matrix
| Gate | Status |
|---|---|
| MOCK/DISABLED zero live transport | **GO** |
| Retrieval tech-ref prefer (Rule Set + FF) | **GO** |
| FF admission | **GO** |
| ST03N methodology grounding | **GO** |
| Mock-GENERATION six-Q | **GO** |
| Offline 54/54 | **GO** |
| Browser UI (partial visual + full API) | **GO** (soft: 2 visual / 6 API) |
| Live paid provider | **NO-GO / not run** |

### L. Next authorized step
User-authorized **live** provider validation on a dedicated process (`LLM_PROVIDER_MODE=live`), then optional commit when asked.
