const crypto = require("crypto");

const {
  ChunkCollectionSchema,
  DocumentCollectionSchema
} = require("../models/contracts");
const appConfig = require("../config/appConfig");

const { maxChunkSize: MAX_CHUNK_SIZE, minChunkSize: MIN_CHUNK_SIZE } =
  appConfig.chunking;

// Headings commonly found in SAP documentation/interview material — a fallback for
// content that isn't authored as markdown (plain .txt/.pdf/.docx sources).
const HEADING_REGEX =
/^(Q\d+|Question\s*\d*|Interview Question|Scenario|Scenario Based|Use Case|Architecture|Overview|Introduction|Configuration|Workflow|Process Flow|Runtime|Execution Flow|Implementation|Rollout|Migration|Upgrade|Cutover|Production Support|Troubleshooting|Root Cause|Resolution|Best Practices|Summary|Conclusion|Prerequisites|Authorization|Provisioning|Risk Analysis|Mitigation|Business Benefits|Technical Details|Access Request|Firefighter|ARM|ARA|EAM|BRM|BRF\+|MSMP|Repository Sync|Repository Object Sync|Connector|Fiori|Launchpad|Catalog|Space|Page|OData|CDS|S\/4HANA|HANA|Analytical Privilege|SQL Privilege|Object Privilege)/i;

// Markdown ATX headings (# through ######). Knowledge base files are authored as
// markdown, so this is the primary heading signal — HEADING_REGEX above is only a
// fallback for non-markdown sources that have no # syntax to detect.
const MARKDOWN_HEADING_REGEX = /^#{1,6}\s+(.+?)\s*#*$/;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Markdown sources rely ONLY on real "#" syntax for heading detection — the bare-keyword
// fallback below is for non-markdown sources (.txt/.pdf/.docx) that have no "#" syntax at
// all. Applying the bare-keyword fallback to markdown content is wrong: prose inside a
// section can legitimately start a sentence with a word like "Resolution:" or "Root
// cause:", and treating that as a new heading fragments the section and mislabels the
// chunk with the whole sentence as its "heading".
function detectHeading(text, isMarkdown) {
  const firstLine = text.split("\n")[0].trim();
  const markdownMatch = firstLine.match(MARKDOWN_HEADING_REGEX);
  if (markdownMatch) return markdownMatch[1].trim();
  if (isMarkdown) return "General";
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
      // Prefer breaking on a line boundary first — numbered Q&A lists (this knowledge
      // base's most common oversized-paragraph case) end lines in "?" not ".", so a
      // period-only search can land mid-question. Fall back to sentence punctuation,
      // then a hard cut only if neither break point exists in range.
      const lastNewline = text.lastIndexOf("\n", end);
      if (lastNewline > start + MIN_CHUNK_SIZE) {
        end = lastNewline + 1;
      } else {
        const lastSentenceEnd = Math.max(
          text.lastIndexOf(".", end),
          text.lastIndexOf("?", end),
          text.lastIndexOf("!", end)
        );
        if (lastSentenceEnd > start + MIN_CHUNK_SIZE) end = lastSentenceEnd + 1;
      }
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
  embeddingVersion: appConfig.knowledge.embeddingModel,

  heading,
  sourceFile: document.fileName,
  sourceFolder: document.sourceFolder,

  sapKeywords: (
    content.match(/\b(GRAC_[A-Z_]+|AGR_[A-Z_]+|USR\d*|PFCG|SU24|SU53|SLG1|SM37|ST22|MSMP|BRF\+|ARA|ARM|BRM|EAM|IAS|IPS|IAG|Fiori|Repository Sync|Provisioning)\b/gi) || []
  )
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
    const isMarkdown = document.extension === ".md";

    // Markdown sources split ONLY on blank lines and real "#" headings — no bare-keyword
    // lookahead, since that fallback is for non-markdown sources without "#" syntax and
    // would otherwise fragment ordinary prose inside a markdown section (see detectHeading).
    const splitPattern = isMarkdown
      ? /\n\s*\n|(?=^#{1,6}\s+)/gim
      : /\n\s*\n|(?=^(?:Q\d+|Question|Interview Question|Scenario|Architecture|Runtime|Execution Flow|Configuration|Workflow|Implementation|Rollout|Migration|Upgrade|Cutover|Production Support|Troubleshooting|Root Cause|Resolution|Best Practices|Tables|Programs|Transaction Codes|Authorization Objects|Integration|Repository Sync|Repository Object Sync|Connector|Example)\b)/gim;

    const paragraphs = document.content
      .split(splitPattern)
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
      const detectedHeading = detectHeading(paragraph, isMarkdown);

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
