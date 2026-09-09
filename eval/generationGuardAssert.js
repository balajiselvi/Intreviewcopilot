const assert = require("assert");
const { classifyGenerationFailure, publicLlmError } = require("../lib/generationGuard");

assert.strictEqual(classifyGenerationFailure({ httpStatus: 429 }).autoRetry, true);
assert.strictEqual(classifyGenerationFailure({ httpStatus: 503 }).autoRetry, true);
assert.strictEqual(classifyGenerationFailure({ message: "insufficient_quota" }).autoRetry, false);
assert.strictEqual(classifyGenerationFailure({ message: "exceeded your current quota" }).retryable, false);
assert.doesNotMatch(classifyGenerationFailure({ message: "ECONNRESET socket" }).userMessage, /ECONNRESET|stack|at Object/);
assert.doesNotMatch(publicLlmError({ status: 500, message: "Internal at foo.js:12" }).userMessage, /foo\.js/);

const fs = require("fs");
const path = require("path");
const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(interview, /isProcessingRef\.current/);
assert.match(interview, /Retry/);
assert.match(interview, /classifyGenerationFailure/);
assert.match(interview, /if \(isProcessingRef\.current\) return/);
assert.match(chat, /isTransientLlmError/);
assert.match(chat, /publicLlmError/);
assert.match(chat, /createOpenAiChatStream/);
assert.doesNotMatch(interview, /AI request failed: \$\{error\.message/);

console.log("generationGuardAssert: PASS");
