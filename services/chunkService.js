const crypto = require("crypto");

const {
  ChunkCollectionSchema,
  DocumentCollectionSchema
} = require("../models/contracts");
const { appConfig } = require("../config/appConfig");

const { maxChunkSize: MAX_CHUNK_SIZE, minChunkSize: MIN_CHUNK_SIZE } =
  appConfig.chunking;

// Headings commonly found in SAP documentation/interview material.
const HEADING_REGEX =
  /^(Q\d+|Question\s*\d*|Chapter\s+\d+|Architecture|Overview|Introduction|Configuration|Workflow|Process Flow|Implementation|Best Practices|Troubleshooting|Summary|Conclusion|Prerequisites|Authorization|Provisioning|Risk Analysis|Mitigation|Business Benefits|Technical Details|Access Request|Firefighter|ARM|ARA|EAM|BRF\+|MSMP)/i;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function detectHeading(text) {
  const firstLine = text.split("\n")[0].trim();
  return HEADING_REGEX.test(firstLine) ? firstLine : "General";
}

function estimateTokens(text) {
  // A deterministic estimate keeps the document contract provider-neutral.
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function splitLargeParagraph(text) {
  const pieces = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_SIZE, text.length);

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      if (lastPeriod > start + MIN_CHUNK_SIZE) end = lastPeriod + 1;
    }

    pieces.push(text.substring(start, end).trim());
    start = end;
  }

  return pieces;
}

function createChunk(document, content, chunkIndex, heading) {
  const chunkChecksum = sha256(content);
  const chunkId = `chunk_${sha256(
    `${document.documentId}:${chunkIndex}:${chunkChecksum}`
  )}`;

  return {
    // Existing index consumers continue to use these fields.
    id: chunkId,
    sourceFile: document.fileName,
    sourceFolder: document.sourceFolder,
    extension: document.extension,
    chunkNumber: chunkIndex,
    section: heading,
    content,

    // Canonical metadata for incremental processing and future embedding reuse.
    chunkId,
    documentId: document.documentId,
    chunkIndex,
    heading,
    pageNumber: null,
    tokenEstimate: estimateTokens(content),
    checksum: chunkChecksum,
    metadata: {
      chunkId,
      documentId: document.documentId,
      chunkChecksum,
      documentChecksum: document.documentChecksum,
      chunkVersion: appConfig.knowledge.chunkVersion,
      embeddingVersion: appConfig.knowledge.embeddingModel
    }
  };
}

/**
 * The canonical semantic chunker. It preserves the existing 700-character,
 * heading-aware, zero-overlap behavior while making chunk construction modular.
 */
function semanticChunkDocuments(documents) {
  const validatedDocuments = DocumentCollectionSchema.parse(documents);
  const chunks = [];

  validatedDocuments.forEach((document) => {
    const paragraphs = document.content
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    let content = "";
    let chunkIndex = 1;
    let heading = "General";

    function pushChunk() {
      if (!content.trim()) return;
      chunks.push(createChunk(document, content.trim(), chunkIndex, heading));
      chunkIndex += 1;
      content = "";
    }

    paragraphs.forEach((paragraph) => {
      const detectedHeading = detectHeading(paragraph);

      if (detectedHeading !== "General") {
        pushChunk();
        heading = detectedHeading;
        content = paragraph;
        return;
      }

      if (paragraph.length > MAX_CHUNK_SIZE) {
        pushChunk();
        splitLargeParagraph(paragraph).forEach((piece) => {
          chunks.push(createChunk(document, piece, chunkIndex, heading));
          chunkIndex += 1;
        });
        return;
      }

      if (content.length + paragraph.length + 2 <= MAX_CHUNK_SIZE) {
        content += `${content ? "\n\n" : ""}${paragraph}`;
      } else {
        pushChunk();
        content = paragraph;
      }
    });

    pushChunk();
  });

  return ChunkCollectionSchema.parse(chunks);
}

/**
 * Backward-compatible entry point. It now delegates to the canonical
 * semantic chunker rather than maintaining a second chunking algorithm.
 */
function chunkDocuments(documents) {
  return semanticChunkDocuments(documents);
}

module.exports = {
  semanticChunkDocuments,
  chunkDocuments
};
