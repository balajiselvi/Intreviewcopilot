# V23 LIVE Replay Manifest

Updated: 2026-11-03T12:36:00Z

## Project baseline (preserved)

| Field | Value |
|---|---|
| Branch | `feature/interview-engine-v2` |
| HEAD | `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2` |
| Working tree | Dirty (~407 porcelain entries) — **preserved** (no reset/stash/clean/commit/push) |
| Persistence | `data/interview-sessions/*.json` via `lib/interviewSessionStore.js` |
| `eval/sessions/` | Not present |

## Provider configuration

| Item | Value |
|---|---|
| Mode | `LLM_PROVIDER_MODE=live` (forced for audit) |
| Model | `gpt-4o-mini` |
| Transport | OpenAI SDK (`openai-sdk`) |
| OPENAI_API_KEY | present in `.env.local` (not logged) |
| Silent MOCK fallback | Forbidden; harness aborts on mock leak |
| Genuine harness | `node --import ./eval/harness/registerNextResolveLive.mjs eval/results/_acceptance/_liveAuditReplay.mjs` |
| Contaminated harness (do not use) | `registerNextResolve.mjs` (redirects openai → empty mock) |

## Historical recovery

| Metric | Count |
|---|---|
| Session files | 523 |
| VERIFIED_LIVE | 23 |
| Selected sessions | 5 (4 VERIFIED_LIVE + 1 weak) |
| Eligible historical questions | **128** |
| Represents real interview usage | Yes (microphone + model + usage/latency) |

## Execution runs

### A — Contaminated (INVALID for quality)

| Field | Value |
|---|---|
| Tag / artifact | `V23_LIVE_REPLAY_RESULTS_CONTAMINATED_MOCK_HARNESS.jsonl` |
| Cause | mock resolve hook |
| Use | Forensic only |

### B — Genuine baseline LIVE

| Field | Value |
|---|---|
| Tag | `genuine` |
| Artifact | `V23_LIVE_REPLAY_RESULTS_genuine.jsonl` (also copied to `V23_LIVE_REPLAY_RESULTS.jsonl`) |
| Meta | `V23_LIVE_REPLAY_RUN_META_genuine.json` |
| Window | ~2026-11-03T12:02–12:11Z |
| Planned / completed | 141 / 141 (128 hist + 3 defect + 10 bench) |
| liveFailed / mock / shortCircuit | 0 / 0 / 0 |
| Avg latency / chars | ~4044 ms / ~1023 |
| Tokens (hist subset) | ~2.08M prompt + ~24.5k completion |
| Est. USD (list gpt-4o-mini) | ~$0.33 historical + defect/bench |

### C — Postfix defect+benchmark (WELL_KNOWN keep)

| Field | Value |
|---|---|
| Tag | `postfix` |
| Artifact | `V23_LIVE_REPLAY_RESULTS_postfix.jsonl` |
| Window | 2026-11-03T12:14:25Z – 12:15:14Z |
| Count | 13 / 13 |
| liveFailed | 0 |

### D — Postfix2 defect+benchmark (MSMP KB + plane prompt)

| Field | Value |
|---|---|
| Tag | `postfix2` |
| Artifact | `V23_LIVE_REPLAY_RESULTS_postfix2.jsonl` |
| Meta | `V23_LIVE_REPLAY_RUN_META_postfix2.json` |
| Window | 2026-11-03T12:33:56Z – 12:34:56Z |
| Count | 13 / 13 |
| liveFailed | 0 |

## Commands

```text
node eval/results/_acceptance/_liveAuditPhase1Inventory.mjs
node eval/results/_acceptance/_liveAuditBuildDataset.mjs
# INVALID quality:
node --import ./eval/harness/registerNextResolve.mjs eval/results/_acceptance/_liveAuditReplay.mjs
# GENUINE LIVE:
node --import ./eval/harness/registerNextResolveLive.mjs eval/results/_acceptance/_liveAuditReplay.mjs
# Suites:
# LIVE_AUDIT_SUITES=defect,benchmark LIVE_AUDIT_TAG=postfix2 …
```

## Budget note

Pre-run estimate ~$0.13 was low vs measured ~$0.33+ on historical alone (large prompts). No spend cap configured beyond session token limits. No silent dataset trim.
