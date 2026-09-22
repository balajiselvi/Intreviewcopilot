const assert = require("assert");
const { classifyGenerationFailure, publicLlmError } = require("../lib/generationGuard");

assert.strictEqual(classifyGenerationFailure({ name: "AbortError" }).retryable, true);
assert.strictEqual(classifyGenerationFailure({ name: "AbortError" }).code, "timeout");
assert.strictEqual(classifyGenerationFailure({ httpStatus: 503 }).autoRetry, true);
assert.strictEqual(classifyGenerationFailure({ message: "insufficient_quota" }).autoRetry, false);
assert.strictEqual(classifyGenerationFailure({ message: "exceeded your current quota" }).retryable, false);
assert.doesNotMatch(classifyGenerationFailure({ message: "ECONNRESET socket" }).userMessage, /ECONNRESET|stack|at Object/);
assert.doesNotMatch(publicLlmError({ status: 500, message: "Internal at foo.js:12" }).userMessage, /foo\.js/);
assert.strictEqual(classifyGenerationFailure({ message: "Failed to fetch" }).code, "transient");
assert.strictEqual(classifyGenerationFailure({ message: "empty generation" }).code, "empty");
assert.match(classifyGenerationFailure({ message: "empty generation" }).userMessage, /Retry/);

const fs = require("fs");
const path = require("path");
const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
const chat = fs.readFileSync(path.join(__dirname, "../pages/api/chat.js"), "utf8");
assert.match(interview, /speechSessionGuard/);
assert.match(interview, /safeCloseAudioConfig/);
assert.match(interview, /invokeSpeechCallback/);
assert.match(interview, /stopInFlightRef/);
assert.match(interview, /attachLiveSessionErrorShield/);
assert.match(interview, /Retry/);
assert.match(interview, /classifyGenerationFailure/);
assert.match(interview, /if \(isProcessingRef\.current\) return/);
assert.match(interview, /armGenerationTimeout/);
assert.match(interview, /current_streaming/);
assert.ok(interview.includes("replace(/\\r\\n/g"), "SSE parser must normalize CRLF");
assert.match(interview, /streamedResponse\.trim\(\)/);
assert.match(chat, /Promise\.race/);
assert.match(chat, /removeEventListener\("abort"/);
assert.match(chat, /isTransientLlmError/);
assert.match(chat, /publicLlmError/);
assert.match(chat, /createOpenAiChatStream/);
assert.doesNotMatch(interview, /AI request failed: \$\{error\.message/);

console.log("generationGuardAssert: PASS");
