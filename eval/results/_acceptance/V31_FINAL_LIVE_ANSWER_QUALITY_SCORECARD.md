# V3.1 Final LIVE Answer Quality Scorecard

**Source artifact:** `eval/results/_acceptance/V31_CROSS_DOMAIN_LIVE_VERIFICATION.jsonl`  
**HEAD:** `9a3b2da75fa9e2c7e3e528d446e2eb966ba404d2`  
**Grading basis:** Full text of every `finalDisplayedAnswer` against 8 criteria  
**Raw LLM body:** `rawProviderHint: null` on all rows → generation forensics limited; **final displayed answers are still graded**

### Scoring key

| Verdict | Meaning |
|---|---|
| `PASS` | Meets technical + spoken bar for the asked question with no material defect |
| `PARTIAL` | Usable core direction, but material completeness, product-plane, or processing issue remains |
| `FAIL` | Materially incorrect or unsafe for interview use |
| `UNVERIFIED` | Final displayed answer missing from evidence |

### 8 criteria

1. Technical correctness  
2. Completeness  
3. Direct relevance  
4. Accurate SAP terminology  
5. Grounded use of retrieved evidence  
6. Zero fabricated personal experience  
7. Natural spoken interview tone  
8. Zero sanitization artifacts / internal system commentary  

Provider column: implementation from jsonl; model string **not in record** (config default `gpt-4o-mini` only — observability caveat).

---

## Aggregate

| Metric | Value |
|---|---|
| Executions graded | 13 |
| Unique questions | 12 |
| `PASS` | 7 |
| `PARTIAL` | 6 |
| `FAIL` | 0 |
| `UNVERIFIED` | 0 |
| Mock / short-circuit | 0 |
| Raw trace available | 0 / 13 |

---

## Question-by-question scorecard

### 1. `defect_pfcg_use` — Explain how do you use PFCG?

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Model in record | **absent** |
| Tokens (prompt/completion) | 14963 / 187 |
| Trace | raw **null**; final captured |
| answerKind | `validated`; recovered=false; strippedEntityCount=0 |
| (1)–(8) | Correct PFCG flow; menu→org→generate→assign→compare; `AGR_USERS`/`AGR_1251` retained; SU53 caveat; no `"Review table for…"`; spoken OK; no fabrication |
| High-risk PFCG | **PASS** — legitimate table detail retained; destructive hollow recovery absent |
| **Verdict** | **PASS** |

### 2. `defect_pfcg_configure` — How do you configure PFCG?

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 18502 / 172 |
| Trace | raw **null**; final captured |
| answerKind | `validated`; recovered=false |
| (1)–(8) | Menu → SU24 proposals → generate → validate; relevant; terminology OK; no hollow tables; spoken OK |
| High-risk PFCG Q2 | **PASS** |
| **Verdict** | **PASS** |

### 3. `defect_st03n_export` — How do you export all the T-codes used by a user?

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 17775 / 151 |
| Trace | raw **null**; final captured |
| Flags | `usage_assignment_plane_sanitized:1`; `unsupported_detail:ST03N`; `agrUsersAsExecutionHistory=false` |
| (1) | Correct primary tool (ST03N workload) — **partially** undercut by closing that ties results to “associated authorizations” |
| (2) | Incomplete: weak export procedure, no STAD/SWNC nuance, no explicit assignment≠usage spoken contrast |
| (3)–(5) | On-topic; no AGR execution confusion |
| (6)–(8) | No fabrication; spoken thin; no Review-table artifact |
| High-risk ST03N | Assignment vs execution **not confused with AGR tables**; completeness/soft wording **fail full bar** |
| **Verdict** | **PARTIAL** |

### 4. `bench_brm` — Why do organizations implement BRM?

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 17560 / 172 |
| Trace | raw **null**; final captured |
| (1)–(8) | Business-role governance rationale; mapping to technical roles; SoD; lifecycle governance — solid spoken BRM answer |
| **Verdict** | **PASS** |

### 5. `bench_pfcg` — Explain how do you use PFCG? *(duplicate question)*

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 14963 / 191 |
| Trace | raw **null**; final captured |
| Notes | Second LIVE invocation of same question text; quality aligned with #1; AGR retained |
| **Verdict** | **PASS** |

### 6. `bench_su24_su25` — Explain the difference between SU24 and SU25.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 15296 / 165 |
| Trace | raw **null**; final captured |
| High-risk | SU24 = proposal maintenance; SU25 = post-upgrade reconcile/customer tables — **correct distinction** |
| **Verdict** | **PASS** |

### 7. `bench_msmp` — Explain MSMP architecture.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 15181 / 201 |
| Trace | raw **null**; final captured |
| High-risk | Explicit **Multi-Stage Multi-Path** (not Multi-Step); Process ID, stages, escalation, BRF+ agents, provisioning handoff — **PASS** |
| **Verdict** | **PASS** |

### 8. `bench_critical_actions` — Explain critical actions and their significance.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 14736 / 173 |
| Trace | raw **null**; final captured |
| Meta | `recovered=true`; `flag=integrity_gate`; CQ includes `concept_coverage_fail:missing-essential-concepts` / `missing_concepts:critical-action` / `integrity_recovered:recovered_direct_technical` |
| Content grade | Technically strong: Critical Action vs SoD Risk vs Critical Permission; ARA ruleset framing |
| Processing | Integrity recovery path fired despite usable concept — **response-processing defect** |
| Tone | Slightly denser / less conversational than other PASS items |
| **Verdict** | **PARTIAL** |

### 9. `bench_bw` — Explain analysis authorizations.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 14687 / 156 |
| Trace | raw **null**; final captured |
| High-risk | Authorization-relevant InfoObjects; `RSECADMIN`; PFCG for query execution vs analysis auth for data — **correct** |
| Gap | Light on `0BI_ALL`, hierarchy, troubleshooting “can log in but no data” |
| **Verdict** | **PASS** (representative; not exhaustive BW depth) |

### 10. `bench_idm` — Explain the identity provisioning lifecycle.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 15045 / 172 |
| Trace | raw **null**; final captured |
| Content | Describes source/target connectors, SCIM endpoints, transformations, scheduled sync — **IPS / cloud provisioning plane** |
| Gap vs inventory skill “SAP IDM 7.2/8.0” | Missing Identity Center, entry types, jobs/tasks/event tasks, dispatcher, MX_PERSON-style store model |
| (4)/(1) | Product-plane accuracy **weak** if interviewer meant SAP IDM |
| **Verdict** | **PARTIAL** |

### 11. `bench_btp` — Explain authentication and authorization architecture.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 15211 / 148 |
| Trace | raw **null**; final captured |
| Content | IAS/Entra authN vs role collections / SAP roles authZ; SSO ≠ app access — directionally correct |
| Gap | Thin on XSUAA, xs-security.json, scopes/role templates, destinations/OAuth client patterns |
| **Verdict** | **PARTIAL** |

### 12. `bench_s4_experience` — Describe your role in an S/4HANA security transformation…

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 17546 / 169 |
| Trace | raw **null**; final captured |
| Metrics cited | ~1,650 PFCG / 350 business roles / 2,400 SoD conflicts |
| Fabrication check | Aligns with CV facts in `eval/lib/careerTimeline.js` / expertise cards — **not scored as invented** in this audit |
| Completeness | Omits available CV detail (e.g. 220 Fiori catalogs, employer/programme framing, GRC module specifics) |
| **Verdict** | **PARTIAL** |

### 13. `bench_oauth` — Explain how OAuth 2.0 authorization code flow works in cloud integrations.

| Field | Value |
|---|---|
| Provider / impl | live / `openai-sdk` |
| Tokens | 18330 / 175 |
| Trace | raw **null**; final captured |
| High-risk | Auth code → token exchange with client id/secret; no GUI force — **correct open-world** |
| Gap | Light on PKCE, refresh, IAS-as-AS / BTP resource-server split (acceptable for this prompt) |
| **Verdict** | **PASS** |

---

## High-risk verification matrix

| Target | Runs | Verdict | Notes |
|---|---|---|---|
| PFCG Q1 | defect_pfcg_use, bench_pfcg | PASS | AGR kept; no Review-table hollow |
| PFCG Q2 | defect_pfcg_configure | PASS | Configure path intact |
| ST03N usage≠assignment | defect_st03n_export | PARTIAL | Plane OK; answer incomplete + soft auth linkage |
| MSMP terminology | bench_msmp | PASS | Multi-Stage Multi-Path |
| SU24 vs SU25 | bench_su24_su25 | PASS | Distinct purposes |
| BRM governance | bench_brm | PASS | |
| BW analysis authorizations | bench_bw | PASS | |
| IDM provisioning | bench_idm | PARTIAL | IPS-shaped answer |
| BTP authN/authZ | bench_btp | PARTIAL | Underspecified |
| OAuth auth code | bench_oauth | PASS | |

---

## Criteria rollup (material misses only)

| Criterion | Material misses in sample |
|---|---|
| 1 Technical correctness | ST03N soft auth linkage; IDM product-plane collapse |
| 2 Completeness | ST03N, BTP, S/4 experience, BW depth ceiling |
| 3 Relevance | None material |
| 4 SAP terminology | IDM/IPS conflation risk |
| 5 Grounding | Critical-actions recovered path; ST03N `unsupported_detail` flag |
| 6 Fabrication | None proven against CV timeline in this sample |
| 7 Spoken tone | Critical-actions denser; ST03N thin |
| 8 Sanitization artifacts | **None** (`Review table for…` absent on all 13) |

**Scorecard conclusion:** Harness `13/13` LIVE transport success ≠ `13/13` quality PASS. Independent grade: **7 PASS / 6 PARTIAL / 0 FAIL**.
