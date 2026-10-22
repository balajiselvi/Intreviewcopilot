const assert = require("node:assert/strict");
const { shouldIgnoreDuplicateSubmit } = require("../lib/submitIdempotency");

const text = "If the user cannot access a Fiori app, how do you troubleshoot?";
const first = { key: text.toLowerCase(), at: 1000 };

assert.equal(shouldIgnoreDuplicateSubmit({ previous: first, text, now: 1100 }), true, "rapid second submit");
assert.equal(shouldIgnoreDuplicateSubmit({ previous: first, text, now: 1000 }), true, "same-tick double event");
assert.equal(shouldIgnoreDuplicateSubmit({ previous: first, text, now: 2500 }), false, "later intentional repeat");
assert.equal(shouldIgnoreDuplicateSubmit({
  previous: first,
  text: "What if my server was on premise?",
  now: 1100
}), false, "different question");
assert.equal(shouldIgnoreDuplicateSubmit({ previous: first, text, now: 1100, retry: true }), false, "explicit retry");
assert.equal(shouldIgnoreDuplicateSubmit({ previous: null, text, now: 1100 }), false, "first submit");

console.log("submitIdempotencyAssert: PASS");
