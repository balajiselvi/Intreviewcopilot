# Retrieval Service

## Architecture

`services/retrievalService.js` is the canonical retrieval engine. Existing
callers continue to use `services/vectorSearch.js`, which is only a
compatibility wrapper and returns the same ranked chunk array as before.

```text
Question + analysis
  -> Query expansion
  -> Candidate retrieval provider
  -> Scoring
  -> Ranking and de-duplication
  -> Evidence selection
  -> Retrieval result and diagnostics
```

The chat response remains outside this service. The retrieval result provides
the ranked evidence consumed by the existing chat flow without changing it.

## Interfaces

The shared contracts define `Query`, `ExpandedQuery`, `RetrievedChunk`,
`RankedChunk`, `EvidenceSet`, `RetrievalResult`, and `RetrievalDiagnostics`.
Metadata filter fields are part of the query contract for future document type,
SAP module, category, document version, and source filtering. They are not
applied to ranking or candidates yet, preserving current behavior.

## Providers and extension points

The implemented provider is `LocalKnowledgeIndexProvider`, which reads the
current JSON knowledge index and retains the current brute-force algorithm.
Provider type constants reserve extension points for Qdrant, Azure AI Search,
and Elasticsearch. No remote provider, hybrid search, or web search is
implemented in this module.

`createRetrievalService` accepts injected provider, query-expander, embedder,
logger, and configuration dependencies. The application container selects the
current local provider and existing query-expansion/embedding implementations.

## Diagnostics and benchmarking

Each `retrieve()` result exposes diagnostics programmatically only:

- retrieval engine version
- total retrieval, embedding, and ranking timings
- candidate and returned chunk counts
- average and top semantic similarity
- top document and chunk identifiers

`createRetrievalBenchmark({ retrievalService }).run({ requests, iterations })`
is also programmatic only. It reports average, p50, and p95 retrieval latency,
average candidate/returned chunk counts, retrieval version, and heap-memory
usage when the runtime exposes it. This supports later comparisons between the
local provider, Qdrant, and hybrid providers without changing application code.
