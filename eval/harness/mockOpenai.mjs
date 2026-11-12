/**
 * Test-only OpenAI mock for real pages/api/chat.js handler invocation.
 * Controllable streamed completions. No network. No paid calls.
 */
const queue = [];
const byQuestion = new Map();
const calls = [];

export function resetMockOpenai() {
  queue.length = 0;
  byQuestion.clear();
  calls.length = 0;
}

export function enqueueMockCompletion(text) {
  queue.push(String(text ?? ""));
}

/** Deterministic response keyed by user-question substring (concurrent-safe). */
export function setMockCompletionForQuestion(questionSubstring, text) {
  byQuestion.set(String(questionSubstring || "").toLowerCase(), String(text ?? ""));
}

export function getMockOpenaiCalls() {
  return calls.slice();
}

async function* streamChunks(text) {
  const body = String(text || "");
  // Single delta — mirrors buffered provider path (writable:false discards writes anyway).
  yield {
    choices: [{ delta: { content: body }, finish_reason: null }],
    usage: undefined
  };
  yield {
    choices: [{ delta: {}, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: Math.max(1, Math.ceil(body.length / 4)), total_tokens: 11 }
  };
}

function resolveMockText(userText) {
  const user = String(userText || "");
  const lower = user.toLowerCase();
  for (const [key, text] of byQuestion.entries()) {
    if (key && lower.includes(key)) return text;
  }
  if (queue.length) return queue.shift();
  return "";
}

class MockCompletions {
  async create(body, _opts) {
    const user = String(body?.messages?.[body.messages.length - 1]?.content || "");
    calls.push({
      model: body?.model,
      messageCount: Array.isArray(body?.messages) ? body.messages.length : 0,
      systemChars: String(body?.messages?.[0]?.content || "").length,
      user: user.slice(0, 200)
    });
    const next = resolveMockText(user);
    if (body?.stream) {
      return streamChunks(next);
    }
    return {
      choices: [{ message: { content: next }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
    };
  }
}

class MockChat {
  constructor() {
    this.completions = new MockCompletions();
  }
}

export class OpenAI {
  constructor(_opts = {}) {
    this.chat = new MockChat();
  }
}

export default OpenAI;
export const APIError = class APIError extends Error {};
export const RateLimitError = class RateLimitError extends Error {};
export const APIConnectionError = class APIConnectionError extends Error {};
export const APIConnectionTimeoutError = class APIConnectionTimeoutError extends Error {};
export const AuthenticationError = class AuthenticationError extends Error {};
export const BadRequestError = class BadRequestError extends Error {};
export const InternalServerError = class InternalServerError extends Error {};
export const PermissionDeniedError = class PermissionDeniedError extends Error {};
export const NotFoundError = class NotFoundError extends Error {};
export const ConflictError = class ConflictError extends Error {};
export const UnprocessableEntityError = class UnprocessableEntityError extends Error {};
export const APIUserAbortError = class APIUserAbortError extends Error {};
export const OpenAIError = class OpenAIError extends Error {};
export const AzureOpenAI = OpenAI;
