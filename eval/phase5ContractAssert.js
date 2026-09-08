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
assert.match(chat, /Only recent USER questions contribute topic tokens/);
assert.match(prompt, /Boundary: \$\{technicalReasoning\.governanceConsideration\}/);

console.log("phase5 source contract assertions: PASS");
