const { getApplicationContainer } = require("../lib/container");

/**
 * Compatibility wrapper for existing callers. It intentionally returns only
 * ranked chunks; diagnostics are available from RetrievalService directly.
 */
async function searchKnowledge(question, analysis, topK = 8) {
  const { retrievalService } = getApplicationContainer();
  const result = await retrievalService.retrieve({ question, analysis, topK });
  return result.chunks;
}

module.exports = { searchKnowledge };
