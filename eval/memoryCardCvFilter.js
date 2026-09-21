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

const idm = EXPERIENCE_CARDS.find((c) => c.id === "idm80-eminov");
assert.ok(idm);
assert.strictEqual(idm.strength, "thin");
assert.doesNotMatch(idm.spoken, /At Eminnov I worked SAP IDM 8\.0 in Developer Studio/i);
assert.match(idm.spoken, /skill/i);

const ariba = EXPERIENCE_CARDS.find((c) => c.id === "ariba-iam");
assert.ok(ariba);
assert.strictEqual(ariba.strength, "thin");
assert.match(ariba.spoken, /not a documented engagement/i);

console.log("memoryCardCvFilter: PASS");
