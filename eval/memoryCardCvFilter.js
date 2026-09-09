const assert = require("assert");
const { EXPERIENCE_CARDS, formatMemoryCard, fieldConflictsWithCv } = require("./lib/expertiseCards");

const rationalize = EXPERIENCE_CARDS.find((c) => c.id === "rationalize-ecc-s4");
assert.ok(rationalize);
assert.ok(fieldConflictsWithCv(rationalize.spoken));
assert.ok(fieldConflictsWithCv(rationalize.result));

const formatted = formatMemoryCard(rationalize);
assert.doesNotMatch(formatted, /10,?000/);
assert.doesNotMatch(formatted, /Power Query/i);
assert.doesNotMatch(formatted, /20\s*(to|-|–)\s*25/);
assert.doesNotMatch(formatted, /prefer this wording/i);
assert.match(formatted, /CANDIDATE BACKGROUND/);
assert.match(formatted, /ST03N/);

const sod = EXPERIENCE_CARDS.find((c) => c.id && /sod/i.test(c.id));
if (sod && sod.spoken && fieldConflictsWithCv(sod.spoken + " " + (sod.result || ""))) {
  const sodCard = formatMemoryCard(sod);
  assert.doesNotMatch(sodCard, /70\s*(to|-|–)\s*80\s*percent/);
}

console.log("memoryCardCvFilter: PASS");
