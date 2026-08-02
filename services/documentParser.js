const { semanticChunkDocuments } = require("./chunkService");

const { DocumentCollectionSchema } = require("../models/contracts");

function normalizeDocumentContent(content) {
  // Keep existing normalization semantics while preserving paragraph, list,
  // transaction-code, table, and code-block line boundaries for the chunker.
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .trim();
}

/**
 * Canonical parser entry point retained for backward compatibility.
 * Metadata is supplied by knowledgeService; chunk construction is delegated
 * to the single semantic chunker in chunkService.
 */
function parseDocuments(documents) {
  const normalizedDocuments = DocumentCollectionSchema.parse(documents).map(
    (document) => ({
      ...document,
      content: normalizeDocumentContent(document.content)
    })
  );

  return semanticChunkDocuments(normalizedDocuments);
}

module.exports = { parseDocuments };
