/**
 * Prior Q&A is useful for genuine continuations, but contaminates standalone
 * technical questions with tools and terminology from the previous topic.
 */
function historyForCurrentTurn(history, isFollowUp) {
  if (!isFollowUp || !Array.isArray(history)) return [];
  return history;
}

module.exports = { historyForCurrentTurn };
