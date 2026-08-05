const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KnowledgeBuilder {
  constructor(config = {}) {
    this.config = {
      maxChunkSize: config.maxChunkSize || 1024,
      minChunkSize: config.minChunkSize || 200,
      overlapTokens: config.overlapTokens || 100,
      chunkingStrategy: config.chunkingStrategy || 'semantic',
      ...config
    };

    this.sapPatterns = {
      tCode: /\b[A-Z]{1,4}\d{2,4}\b/g,
      authObject: /(?:^|\s)([A-Z_]{1,20})\s*(?=\(auth|authorization|object)/gi,
      table: /(?:^|\s)(?:table\s+)?([A-Z]{1,4}[A-Z0-9]{2,20})(?:\s|$)/g,
      specialTerm: /\b(?:RBAC|SAC|SOX|GDPR|EAM|ARM|ARA|BRM|MSMP|BRF\+|IDM|IAS|IPS|IAG|UAG|UME|SPML|OIDC|SAML|GRC)\b/gi
    };

    this.knowledgeBase = new Map();
    this.documentMetadata = new Map();
    this.contentHashes = new Set();
    this.sapArtifacts = new Map();
  }

  buildFromDocuments(documentPaths) {
    const results = {
      success: [],
      failed: [],
      stats: {
        totalChunks: 0,
        totalDocuments: 0,
        duplicatesRemoved: 0,
        sapArtifactsFound: 0
      }
    };

    const normalizedPaths = Array.isArray(documentPaths) ? documentPaths : [documentPaths];

    for (const docPath of normalizedPaths) {
      try {
        if (!fs.existsSync(docPath)) {
          results.failed.push({ path: docPath, error: 'File not found' });
          continue;
        }

        const content = this._readDocument(docPath);
        if (!content) {
          results.failed.push({ path: docPath, error: 'Failed to extract content' });
          continue;
        }

        const metadata = this._extractMetadata(docPath, content);
        const normalizedContent = this._normalizeContent(content);
        const sapArtifacts = this._extractSapArtifacts(normalizedContent);

        if (sapArtifacts.length > 0) {
          results.stats.sapArtifactsFound += sapArtifacts.length;
          this.sapArtifacts.set(metadata.id, sapArtifacts);
        }

        const chunks = this._createChunks(normalizedContent, metadata);
        let deduplicatedChunks = 0;

        for (const chunk of chunks) {
          const contentHash = this._hashContent(chunk.content);

          if (this.contentHashes.has(contentHash)) {
            results.stats.duplicatesRemoved++;
            deduplicatedChunks++;
            continue;
          }

          this.contentHashes.add(contentHash);
          chunk.hash = contentHash;
          chunk.sapArtifacts = this._filterSapArtifactsForChunk(sapArtifacts, chunk);

          const chunkId = this._generateChunkId(metadata.id, chunk.index);
          this.knowledgeBase.set(chunkId, chunk);
          results.stats.totalChunks++;
        }

        this.documentMetadata.set(metadata.id, {
          ...metadata,
          processedAt: new Date().toISOString(),
          chunksCreated: chunks.length - deduplicatedChunks,
          sapArtifactsCount: sapArtifacts.length
        });

        results.success.push({
          path: docPath,
          documentId: metadata.id,
          chunksCreated: chunks.length - deduplicatedChunks
        });

        results.stats.totalDocuments++;
      } catch (error) {
        results.failed.push({ path: docPath, error: error.message });
      }
    }

    return results;
  }

  _readDocument(docPath) {
    const ext = path.extname(docPath).toLowerCase();

    if (ext === '.txt') {
      return fs.readFileSync(docPath, 'utf8');
    }

    if (ext === '.pdf') {
      return this._extractPdfContent(docPath);
    }

    if (['.docx', '.doc'].includes(ext)) {
      return this._extractDocxContent(docPath);
    }

    return null;
  }

  _extractPdfContent(pdfPath) {
    try {
      const pdfContent = fs.readFileSync(pdfPath, 'utf8');
      return pdfContent;
    } catch {
      return null;
    }
  }

  _extractDocxContent(docxPath) {
    try {
      const docxContent = fs.readFileSync(docxPath, 'utf8');
      return docxContent;
    } catch {
      return null;
    }
  }

  _normalizeContent(content) {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/gm, '')
      .trim();
  }

  _extractMetadata(docPath, content) {
    const fileName = path.basename(docPath);
    const fileStats = fs.statSync(docPath);

    const headings = this._extractHeadings(content);
    const headingHierarchy = this._buildHeadingHierarchy(headings);

    return {
      id: this._generateDocumentId(docPath),
      fileName,
      path: docPath,
      size: fileStats.size,
      extension: path.extname(docPath),
      createdAt: fileStats.birthtime.toISOString(),
      modifiedAt: fileStats.mtime.toISOString(),
      headingHierarchy,
      headingCount: headings.length,
      contentLength: content.length,
      lineCount: content.split('\n').length
    };
  }

  _extractHeadings(content) {
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        position: match.index
      });
    }

    return headings;
  }

  _buildHeadingHierarchy(headings) {
    const hierarchy = [];
    const stack = [];

    for (const heading of headings) {
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      heading.parent = stack.length > 0 ? stack[stack.length - 1].text : null;
      hierarchy.push(heading);
      stack.push(heading);
    }

    return hierarchy;
  }

  _extractSapArtifacts(content) {
    const artifacts = [];
    const seen = new Set();

    const tCodes = content.match(this.sapPatterns.tCode) || [];
    for (const code of tCodes) {
      if (!seen.has(code) && code.length >= 3) {
        seen.add(code);
        artifacts.push({ type: 'tCode', value: code });
      }
    }

    const tables = content.match(this.sapPatterns.table) || [];
    for (const table of tables) {
      if (!seen.has(table) && table.length >= 3 && table.length <= 20) {
        seen.add(table);
        artifacts.push({ type: 'table', value: table });
      }
    }

    const specialTerms = content.match(this.sapPatterns.specialTerm) || [];
    for (const term of specialTerms) {
      if (!seen.has(term)) {
        seen.add(term);
        artifacts.push({ type: 'specialTerm', value: term });
      }
    }

    return artifacts;
  }

  _filterSapArtifactsForChunk(allArtifacts, chunk) {
    const chunkContent = chunk.content.toUpperCase();
    return allArtifacts.filter(artifact => {
      return chunkContent.includes(artifact.value.toUpperCase());
    });
  }

  _createChunks(content, metadata) {
    if (this.config.chunkingStrategy === 'semantic') {
      return this._semanticChunking(content, metadata);
    } else if (this.config.chunkingStrategy === 'fixed') {
      return this._fixedChunking(content, metadata);
    } else {
      return this._hybridChunking(content, metadata);
    }
  }

  _semanticChunking(content, metadata) {
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    let chunkIndex = 0;

    const headingHierarchy = new Map(metadata.headingHierarchy.map(h => [h.text, h.level]));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineSize = line.length + 1;

      const isHeading = /^#+\s/.test(line);
      const isTableMarker = /^\|/.test(line);

      if (isHeading && currentChunk.length > 0 && currentSize > this.config.minChunkSize) {
        chunks.push(this._formatChunk(currentChunk, metadata, chunkIndex++));
        currentChunk = [line];
        currentSize = lineSize;
        continue;
      }

      if (currentSize + lineSize > this.config.maxChunkSize && currentChunk.length > 0) {
        chunks.push(this._formatChunk(currentChunk, metadata, chunkIndex++));

        const overlapLines = Math.ceil(this.config.overlapTokens / 20);
        const overlapStart = Math.max(0, currentChunk.length - overlapLines);
        currentChunk = currentChunk.slice(overlapStart);
        currentSize = currentChunk.join('\n').length + 1;
      }

      currentChunk.push(line);
      currentSize += lineSize;
    }

    if (currentChunk.length > 0) {
      chunks.push(this._formatChunk(currentChunk, metadata, chunkIndex++));
    }

    return chunks;
  }

  _fixedChunking(content, metadata) {
    const chunks = [];
    const chunkSize = this.config.maxChunkSize;
    const overlapSize = this.config.overlapTokens;

    for (let i = 0; i < content.length; i += chunkSize - overlapSize) {
      const chunk = content.slice(i, i + chunkSize);
      if (chunk.length > this.config.minChunkSize) {
        chunks.push(this._formatChunk([chunk], metadata, chunks.length));
      }
    }

    return chunks;
  }

  _hybridChunking(content, metadata) {
    const paragraphs = content.split('\n\n');
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const paraSize = para.length + 2;

      if (currentSize + paraSize > this.config.maxChunkSize && currentChunk.length > 0) {
        chunks.push(this._formatChunk(currentChunk, metadata, chunkIndex++));
        currentChunk = [para];
        currentSize = paraSize;
      } else {
        currentChunk.push(para);
        currentSize += paraSize;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(this._formatChunk(currentChunk, metadata, chunkIndex++));
    }

    return chunks;
  }

  _formatChunk(lines, metadata, index) {
    const content = lines.join('\n').trim();
    const heading = this._findNearestHeading(content, metadata.headingHierarchy);

    return {
      content,
      index,
      metadata: {
        documentId: metadata.id,
        fileName: metadata.fileName,
        heading: heading ? heading.text : null,
        headingLevel: heading ? heading.level : null,
        headingParent: heading ? heading.parent : null,
        size: content.length,
        lineCount: lines.length
      }
    };
  }

  _findNearestHeading(content, headingHierarchy) {
    if (!headingHierarchy || headingHierarchy.length === 0) {
      return null;
    }

    const contentStart = content.substring(0, 100).toUpperCase();

    for (const heading of headingHierarchy) {
      if (contentStart.includes(heading.text.toUpperCase())) {
        return heading;
      }
    }

    return headingHierarchy[0] || null;
  }

  _hashContent(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  _generateChunkId(documentId, chunkIndex) {
    return `${documentId}_chunk_${chunkIndex}`;
  }

  _generateDocumentId(docPath) {
    const normalized = path.normalize(docPath).toLowerCase();
    return crypto
      .createHash('sha1')
      .update(normalized)
      .digest('hex')
      .substring(0, 16);
  }

  getKnowledgeBase() {
    return Array.from(this.knowledgeBase.values());
  }

  getDocumentMetadata(documentId) {
    return this.documentMetadata.get(documentId) || null;
  }

  getSapArtifacts(documentId) {
    return this.sapArtifacts.get(documentId) || [];
  }

  getAllSapArtifacts() {
    const allArtifacts = [];
    for (const artifacts of this.sapArtifacts.values()) {
      allArtifacts.push(...artifacts);
    }

    const unique = new Map();
    for (const artifact of allArtifacts) {
      const key = `${artifact.type}:${artifact.value}`;
      if (!unique.has(key)) {
        unique.set(key, artifact);
      }
    }

    return Array.from(unique.values());
  }

  getChunksByMetadata(filter) {
    const results = [];

    for (const chunk of this.knowledgeBase.values()) {
      if (filter.documentId && chunk.metadata.documentId !== filter.documentId) {
        continue;
      }
      if (filter.headingLevel && chunk.metadata.headingLevel !== filter.headingLevel) {
        continue;
      }
      if (filter.minSize && chunk.metadata.size < filter.minSize) {
        continue;
      }
      if (filter.maxSize && chunk.metadata.size > filter.maxSize) {
        continue;
      }
      results.push(chunk);
    }

    return results;
  }

  exportForEmbedding() {
    const embeddingData = [];

    for (const chunk of this.knowledgeBase.values()) {
      embeddingData.push({
        id: chunk.metadata.documentId + '_' + chunk.index,
        content: chunk.content,
        metadata: chunk.metadata,
        sapArtifacts: chunk.sapArtifacts || [],
        hash: chunk.hash
      });
    }

    return embeddingData;
  }

  clear() {
    this.knowledgeBase.clear();
    this.documentMetadata.clear();
    this.contentHashes.clear();
    this.sapArtifacts.clear();
  }

  getStats() {
    const stats = {
      totalChunks: this.knowledgeBase.size,
      totalDocuments: this.documentMetadata.size,
      uniqueHashes: this.contentHashes.size,
      totalSapArtifacts: this.getAllSapArtifacts().length,
      memoryUsage: {
        knowledgeBase: this.knowledgeBase.size * 2048,
        hashes: this.contentHashes.size * 64,
        artifacts: this.sapArtifacts.size * 512
      }
    };

    return {
      ...stats,
      memoryUsage: {
        ...stats.memoryUsage,
        total: Object.values(stats.memoryUsage).reduce((a, b) => a + b, 0)
      }
    };
  }
}

module.exports = KnowledgeBuilder;