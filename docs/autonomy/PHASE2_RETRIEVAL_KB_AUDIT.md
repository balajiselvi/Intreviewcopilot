# Phase 2 — Knowledge-base & retrieval audit (read-only)

Date: 2026-10-29  
Branch: `feature/interview-engine-v2` @ `9a3b2da`  
Mode: read-only (no index rebuild, no KB rewrite, $0 paid)

## 1. Index & embedding facts

| Field | Value | Tag |
|---|---|---|
| Embedding model | `Xenova/all-MiniLM-L6-v2` | FACT |
| Documents / chunks | 165 / 3428 | FACT |
| generatedAt | 2026-10-26T16:00:51.492Z | FACT |
| Reranking | None in `services/vectorSearch.js` | FACT |
| Live relevance threshold (chat) | `LIVE_RELEVANCE_THRESHOLD = 0.45` | FACT |
| Vector filter floor | `similarityThreshold` default 0.15 | FACT |
| Product scoping | `selectProductScopedChunks` after retrieve in chat.js | FACT |

## 2. Folder coverage (disk vs index)

- Disk folders (29 content dirs): audit, behavioral, btp, bw, cloud, compliance, cutover, cyberark, datasphere, fiori, grc, hana, hypercare, iag, idm, integration, interview-scenarios, leadership, lob, mdg, project-management, project-types, rise, s4hana, sac, security, successfactors, transports, troubleshooting
- Index missing folder: **`leadership`** — four `.md` files exist but are **0 bytes**; correctly absent from chunks (FACT)
- No `knowledge/ariba` folder; DOMAIN_BANK includes Ariba; product map sends Ariba → `lob` (FACT)
- Heaviest chunk folders: grc 657, project-management 392, security 364, rise 313, project-types 310, btp 283

## 3. Verification status of KB

| Signal | Count | Tag |
|---|---|---|
| `verification_status: VERIFIED` markers in md | **0** | FACT |
| `NEEDS_REVIEW` markers | 0 | FACT |
| “Source checked” / similar phrases | 30 files | FACT |
| Conclusion | Grounded-in-retrieval ≠ fact-checked against SAP docs | INFERENCE |

**Policy implication:** Entity allowlists built from retrieved text are `RETRIEVED_CANDIDATE` only. They must not be treated as VERIFIED.

## 4. Offline retrieval probe (local embeddings, no paid LLM)

Wrong-product = top-1 `sourceFolder` ≠ expected product folder.

| Question (abbrev) | Expect | Top-1 | Wrong? |
|---|---|---|---|
| BRF+ agent rule MSMP | grc | grc | no |
| Fiori catalog/OData authorize | fiori | **s4hana** | **yes** |
| IPS skipped users | btp | btp | no |
| IAS federation Entra | btp | btp | no |
| IAG Role Designer | iag | iag | no |
| Public vs Private business roles | s4hana | **project-management** | **yes** |
| SuccessFactors RBP | successfactors | **project-types** | **yes** |
| HANA analytic privileges | hana | hana | no |
| Firefighter EAM | grc | **iag** | **yes** |
| Ariba SSO provision | (none) | lob | n/a |

**Wrong-product top-1: 4/9 (44%)** on this probe — FACT for the probe set; UNKNOWN as global rate until a full benchmark exists.

Note: live chat applies product folder filters after retrieval; this probe measured raw `searchKnowledge` ranking before chat scoping. Scoping may reduce some wrong-product cases — NOT VERIFIED in this cycle without a scoped replay harness.

## 5. DOMAIN_BANK (18) vs taxonomy

- Eval bank domains: 18 (SAP-Security-PFCG … Compliance) — FACT  
- Authoritative 27-domain map: **path unresolved → reconciliation BLOCKED**  
- Do not invent missing domains or substitute 18 for 27

## 6. Runtime safety (inspect only)

| Port | Listener PIDs (sample) | `/interview` |
|---|---|---|
| 3102 | project `dev-server.js` / next | 200 |
| 3000 | project `dev-server.js` / next | **timeout** |

Active browser target: UNKNOWN → **neither process stopped**.

## 7. Gap register (audit deltas)

| Gap | Severity | Status |
|---|---|---|
| Wrong-product retrieval (probe) | P0 | OPEN — needs benchmark before retrieval-order/threshold changes |
| Zero VERIFIED KB | P0 | OPEN — Stage 3 mechanism; no content writes now |
| Chat/prompt G1/G2 wiring | P0 | AWAIT APPROVAL (amended design below) |
| Taxonomy 27-map missing | P1 | BLOCKED |
| Ariba folder absent | P1 | OPEN (KB write needs approval) |
| Empty leadership stubs | P2 | OPEN |
| No retrieval golden set | P1 | OPEN |

## 8. Freshness / rebuild recommendation

- Index build 2026-10-26; leadership empties older and empty — **no rebuild justified** from leadership alone  
- Index rebuild: **NO** this checkpoint (authorized: ask first if stale chunks proven to change answers)  
- Propose rebuild only after a freshness harness shows answer deltas

## 9. What this audit does NOT claim

- That any KB procedure is SAP-correct  
- That product-scoped live retrieval matches the raw probe  
- That 44% is the production wrong-product rate  
- That G1 strip makes answers verified
