const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rp = fs.readFileSync(path.join(__dirname, "../lib/reasoningPlanner.js"), "utf8");
const tr = fs.readFileSync(path.join(__dirname, "../lib/technicalReasoner.js"), "utf8");
const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
const prompt = fs.readFileSync(path.join(__dirname, "../lib/prompt/interviewPrompt.js"), "utf8");

assert.match(rp, /Identity Source/);
assert.match(rp, /operational reality/);
assert.match(tr, /does not host PFCG roles/);
assert.match(tr, /SU53 explains one failed check/);
assert.match(tr, /SU24 is proposal data/);
assert.match(tr, /never expand DCL/);
assert.match(rp, /do not invent a recent ticket/);
assert.match(rp, /isPersonalHistoryAsk/);
assert.match(tr, /secondaryCategories/);
assert.match(chat, /reasoningMode === "resolve"/);
assert.match(prompt, /Boundary: \$\{technicalReasoning\.governanceConsideration\}/);
assert.match(prompt, /it is not hypercare monitoring or cutover proof/);
assert.doesNotMatch(prompt, /Monitoring Tools \(ST03\/SM21\/SU53\)/);
assert.match(prompt, /methodology voice only/);

console.log("phase5 source contract assertions: PASS");
