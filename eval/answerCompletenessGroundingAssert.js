/**
 * G1/G2 regression: incomplete spoken tails and ungrounded T-code claims.
 * Offline only — no provider calls.
 */
const assert = require("assert");
const {
  looksIncompleteSpokenAnswer,
  findUngroundedTransactionClaims,
  isIncompleteGeneration
} = require("../lib/generationGuard");

const truncatedBrf = `To configure BRF+ for access control, I start by accessing the BRF+ workbench through the transaction code GRFCP2. From there, I create a new application that will serve as the foundation for my rules. This involves defining the application name and description, which helps in identifying its purpose later.

Next, I establish the necessary rules by creating a rule set within the application. This includes`;

assert.strictEqual(
  looksIncompleteSpokenAnswer(truncatedBrf),
  true,
  "G2: observed BRF truncation must be incomplete"
);
assert.strictEqual(
  looksIncompleteSpokenAnswer("I open BRFPLUS, maintain the agent decision table, activate it, and prove Approvers of Selected Path in Instance Status."),
  false,
  "complete spoken answer must pass"
);
assert.ok(
  findUngroundedTransactionClaims(truncatedBrf, "The BRFplus workbench is opened with transaction BRFplus or BRFPLUS.").includes("GRFCP2"),
  "G1: GRFCP2 must be flagged when absent from supporting knowledge"
);
assert.deepStrictEqual(
  findUngroundedTransactionClaims(
    "I open transaction BRFPLUS and maintain the decision table.",
    "The BRFplus workbench is opened with transaction BRFplus. The exact name may be BRF+ or BRFPLUS."
  ),
  [],
  "grounded BRFPLUS must not be flagged"
);
assert.ok(isIncompleteGeneration("incomplete_content"), "content incompleteness is an incomplete finish reason");

const interview = require("fs").readFileSync(require("path").join(__dirname, "../pages/interview.js"), "utf8");
const chat = require("fs").readFileSync(require("path").join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(interview, /looksIncompleteSpokenAnswer/);
assert.match(chat, /findUngroundedTransactionClaims|looksIncompleteSpokenAnswer/);

console.log("answerCompletenessGroundingAssert: PASS");
