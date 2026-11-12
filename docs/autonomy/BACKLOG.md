# Autonomy BACKLOG

Priority order matches master prompt §4.

| ID | Severity | Evidence | Fix class | Effort | Status |
|---|---|---|---|---|---|
| G1-WIRE | P0 | stage1 wiring | Wire prefer+strip+coherence+telemetry in chat.js | M | **DONE (sprint)** |
| G2-PROMPT | P0 | principle-level clause | Prompt knowledge grounding | S | **DONE (sprint)** |
| RET-WRONG-PRODUCT | P0 | Offline probe 4/9 top-1 wrong folder (Fiori→s4hana, Public Edition→project-mgmt, SF→project-types, Firefighter→iag) | Retrieval benchmark + product filter/rerank experiments | L | OPEN (measure before change) |
| KB-UNVERIFIED | P0 | 0 VERIFIED markers across 165 md; 30 “Source checked” only | Stage 3 verified-content pipeline (mechanism) | L | OPEN (not this checkpoint) |
| TAXONOMY | P1 | 27-domain map path missing | Adopt when path supplied; do not invent | S | **BLOCKED** |
| ARIBA-GAP | P1 | DOMAIN_BANK Ariba; no ariba folder; hits `lob` | Content + folder mapping (needs approval for KB writes) | M | OPEN |
| LEADERSHIP-EMPTY | P2 | `knowledge/leadership/*.md` are 0 bytes; not in index | Content fill (KB write — approval) | M | OPEN |
| RET-BENCHMARK | P1 | No golden (question→expected chunks) set | Build offline retrieval benchmark harness | M | OPEN |
| PROFILE-LOADER | P1 | Not built | Stage 2 | L | DEFERRED |
| VERIFIER-PASS | P1 | Not built | Separate structured verifier | L | DEFERRED |
| TELEMETRY | P2 | Amendment (e) pending wiring | Per-answer route/strip/score trace | M | Tied to G1-WIRE |
| CONCEPTUAL-SAFE-FALLBACK | P0 | BTP pillars served meta principle template | Conceptual-from-knowledge route | S | **DONE** |
| LIVE-MSMP-INCIDENT | P0 | 15.8s first token / 16.8s stop — needs paid CAP | Reproduce with timing logs | M | **BLOCKED: CAP unfilled** |
| PACK-APPROVALS | P0 | 50 NEEDS_REVIEW pack entries | Human APPROVED subset for live | S | Awaiting you |
| PROD-SINGLE-LISTENER | P0 | Dual :3000+:3102 earlier | `interview-day-start.js` + confirm | S | Pending operator run |
| ENUM-VERIFIER | P1 | BTP pillars I-2 card drafted | Enumeration verifier pass | M | Backlog (sprint partial) |
| PC-RM-CARDS | P1 | Coverage PARTIAL | Verified cards for PC/RM | L | Backlog |
| INDIA-REG-CARD | P1 | Hedged only | VERIFIED source+date or stay hedged | M | Backlog |
| LLM-JUDGE-SCORING | P2 | V2.1 scoring | Deterministic + judge + SME | L | Backlog (out of sprint) |
| RETRIEVAL-BENCHMARK | P1 | Wrong-product probe | Golden retrieval set | L | Backlog |
| TAXONOMY-27 | P1 | Path missing | Adopt map | S | BLOCKED |
