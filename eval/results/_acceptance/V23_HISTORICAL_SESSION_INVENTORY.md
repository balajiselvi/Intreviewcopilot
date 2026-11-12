# V23 Historical Session Inventory

Generated: 2026-11-03T11:48:02.008Z

## Persistence mechanism (verified from code)

- Store: `lib/interviewSessionStore.js` → `data/interview-sessions/<sessionId>.json`
- Written by `pages/api/chat.js` via `appendQa` during interview turns
- `eval/sessions/`: **not present** — not the production history path
- Total session files: **523**

## Provider environment (presence only — no secrets)

### .env.local
- `GROQ_API_KEY`: present=true, len=56
- `OPENAI_API_KEY`: present=true, len=164

## Provenance summary

- **VERIFIED_LIVE**: 23
- **TEST_OR_NON_LIVE**: 248
- **CANDIDATE_LIVE_WEAK_PROVENANCE**: 3
- **PROVENANCE_UNVERIFIED**: 249

### Provenance rules used

- **VERIFIED_LIVE**: `microphone` source + real model id + (token usage OR GENERATION latency > 800ms)
- **CANDIDATE_LIVE_WEAK_PROVENANCE**: microphone + real model, but no token/latency corroboration
- **PROVENANCE_UNVERIFIED**: live_ id / live-interview source without sufficient evidence
- **TEST_OR_NON_LIVE**: assert/probe/hist/manual_input ids, or `mock-deterministic` model

## Selected sessions for replay (up to 5)

### live_mvt4dz46_5fcq9n4o

- Provenance: **VERIFIED_LIVE** (microphone + model + token usage)
- Started: 2026-10-29T05:46:05.451Z · Ended: 2026-11-03T11:20:14.788Z
- Q&A: 136 total / 116 completed
- Models: gpt-4o-mini, safe-mode
- Sources: microphone, verified-workflow, prepared-script, admission, system
- Mic: true · Token usage: true · Latency hint: true
- Sample questions:
  1. [PRINCIPLE_LEVEL/microphone] what are the 5 pillars of BTP?
  2. [PRINCIPLE_LEVEL/microphone] how to configure MSMP?
  3. [CONCEPTUAL_KNOWLEDGE/microphone] what are the 5 pillars of btp?
  4. [CONCEPTUAL_KNOWLEDGE/microphone] what are the 5 pillars of btp?
  5. [GENERATION/microphone] how to configure MSMP?
  6. [GENERATION/microphone] How to configure BRF+?
  7. [VERIFIED_WORKFLOW/verified-workflow] explain MSMP?
  8. [RETRIEVED_PROCEDURE/microphone] How would you lead an SAP GRC Access Control implementation from requirements workshops through production hypercare?

### live_mvt0tarh_4von54md

- Provenance: **VERIFIED_LIVE** (microphone + model + GENERATION latency>800ms)
- Started: 2026-10-29T04:06:12.695Z · Ended: 2026-10-29T04:35:43.544Z
- Q&A: 4 total / 1 completed
- Models: gpt-4o-mini
- Sources: microphone, system, admission
- Mic: true · Token usage: false · Latency hint: true
- Sample questions:
  1. [GENERATION/system] Regarding So what are the? What are the pillars right? So what are the pillars of BTP here? Right? What are the?

### live_mvrki89p_z9ge6ltn

- Provenance: **VERIFIED_LIVE** (microphone + model + token usage)
- Started: 2026-10-28T03:42:00.972Z · Ended: 2026-10-28T14:13:13.886Z
- Q&A: 22 total / 5 completed
- Models: gpt-4o-mini
- Sources: admission, microphone
- Mic: true · Token usage: true · Latency hint: true
- Sample questions:
  1. [GENERATION/microphone] How to configure fiori app?
  2. [GENERATION/microphone] how to configure Fiori app?
  3. [GENERATION/microphone] How to configure BRF+?
  4. [GENERATION/microphone] How to configure MSMP?
  5. [GENERATION/microphone] How to configure BRF+?

### live_mvrk1llb_wldgvo5v

- Provenance: **VERIFIED_LIVE** (microphone + model + token usage)
- Started: 2026-10-28T03:28:49.472Z · Ended: 2026-10-28T03:38:40.426Z
- Q&A: 5 total / 2 completed
- Models: gpt-4o-mini
- Sources: microphone, admission
- Mic: true · Token usage: true · Latency hint: true
- Sample questions:
  1. [RETRIEVED_PROCEDURE/microphone] how to configure SAP Fiori App?
  2. [GENERATION/microphone] how to configure SAP Fiori APP

### live_mvqq943r_aavgq6ha

- Provenance: **CANDIDATE_LIVE_WEAK_PROVENANCE** (microphone + model but no token usage / weak latency evidence)
- Started: 2026-10-27T14:58:45.080Z · Ended: 2026-10-27T16:10:58.634Z
- Q&A: 4 total / 4 completed
- Models: gpt-4o-mini
- Sources: microphone, verified-workflow
- Mic: true · Token usage: false · Latency hint: false
- Sample questions:
  1. [RETRIEVED_PROCEDURE/microphone] how do you configure firori apps?
  2. [VERIFIED_WORKFLOW/verified-workflow] how to configure sap fiori app?
  3. [RETRIEVED_PROCEDURE/microphone] how to configure fiori apps?
  4. [RETRIEVED_PROCEDURE/microphone] Regarding hwo to configure fiori app?

## Limitations

- Session JSON does **not** persist `LLM_PROVIDER_MODE` or a live-transport receipt. Classification is inferred from source/model/usage/latency.
- Many `live_*` files are automated probes reused with `source: live-interview` — excluded when id/source pattern indicates test.
- Safe-mode / LOCAL_KNOWLEDGE_FALLBACK / VERIFIED_WORKFLOW turns inside a LIVE session are not LLM generations; replay must still invoke LIVE generation for eligible GENERATION turns, and must not treat bank/procedure short-circuits as LIVE LLM proof.
