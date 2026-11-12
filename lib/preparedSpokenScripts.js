/**
 * Runtime-owned prepared spoken scripts.
 * Production matching must import from here. Evaluation fixtures continue to live in
 * eval/lib/expectedAnswers.js and remain shared for offline batteries.
 * Prepared script hits still pass finalizeSpokenAnswerForDisplay before UI emission.
 */
module.exports = require("../eval/lib/expectedAnswers.js");
