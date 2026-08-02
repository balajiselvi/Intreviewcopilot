# Knowledge Indexing Pipeline

## Pipeline

The supported indexing entry point is `buildKnowledgeIndex` in
`services/knowledgeIndexService.js`. Both the API build route and
`scripts/buildKnowledge.js` delegate to this service.

```text
Knowledge Loader
  -> Document Parser
  -> Metadata Extraction
  -> Semantic Chunker
  -> Embedding Service
  -> Knowledge Index, Manifest, and Build Report
```

`knowledgeService` loads supported PDF, DOCX, and TXT files and creates the
canonical document contract. The parser keeps the existing normalization and
paragraph boundaries. The semantic chunker keeps the existing heading-aware,
700-character, zero-overlap behavior.

## Document and chunk metadata

Documents have deterministic `documentId` values based on source and relative
path, plus a SHA-256 `documentChecksum` based on extracted content. They carry
source, category, file, size, word-count, character-count, version, and file
timestamps.

Chunks have deterministic `chunkId` values derived from document identity,
chunk position, and chunk checksum. Each chunk preserves the legacy retrieval
fields and includes canonical metadata: document and chunk checksums, chunk
and embedding versions, heading, nullable page number, and token estimate.

## Incremental indexing

When a prior manifest has matching schema, parser, and chunk versions, and a
document checksum is unchanged, parsing and chunking are skipped and the prior
chunks are retained. Embeddings are still regenerated for every chunk in the
current implementation. The retained checksum and embedding-version metadata
is intentionally prepared for a future safe embedding-reuse implementation.

Changed documents are parsed and chunked again. A document-level parse failure
is recorded and does not prevent remaining documents from being processed. If
valid chunks from the previous build exist, they are retained and reported as a
warning.

## Generated artifacts

- `data/knowledge-index.json`: embedded chunks consumed by the existing
  retrieval service.
- `data/index-manifest.json`: schema, parser, chunk, embedding, index version,
  build timestamp, and document/chunk counts.
- `data/index-report.json`: operational counts, elapsed time, structured
  errors, and warnings from the last build attempt.

The manifest is written only after a successful index build. The report is
written after successful and failed build attempts.

## Versioning strategy

Changing `schemaVersion`, `parserVersion`, or `chunkVersion` invalidates
incremental chunk reuse on the next build. Changing the embedding-model value
does not yet enable reuse; it is recorded in the manifest for the future
embedding-reuse policy. Keep these versions intentional and bump the relevant
one whenever a document contract, parser, or chunking semantic changes.
