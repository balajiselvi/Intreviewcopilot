import { resetMockOpenai, enqueueMockCompletion, getMockOpenaiCalls } from "./mockOpenai.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const gatePath = require.resolve("../../lib/answerIntegrityGate.js");
const gateMod = require(gatePath);
require.cache[gatePath].exports = { ...gateMod };

const { default: handler } = await import("../../pages/api/chat.js");

resetMockOpenai();
enqueueMockCompletion(
  "Six stages. At Dover that was 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs."
);

const writes = [];
const res = {
  writable: true,
  writableEnded: false,
  statusCode: 200,
  headersSent: false,
  headers: {},
  setHeader(k, v) {
    this.headers[k] = v;
    this.headersSent = true;
  },
  status(c) {
    this.statusCode = c;
    return this;
  },
  json(b) {
    writes.push({ json: b });
  },
  end() {
    this.writableEnded = true;
    writes.push({ end: 1 });
  },
  once() {},
  on() {},
  write(payload) {
    writes.push(String(payload || ""));
    return true;
  }
};

const req = {
  method: "POST",
  body: {
    model: "gpt-4o-mini",
    apiKey: "sk-test-harness-not-a-real-key",
    safeMode: false,
    question: "What are Critical Actions?",
    history: [],
    source: "probe"
  }
};

await handler(req, res);
console.log("MOCK_CALLS", getMockOpenaiCalls().length);
console.log("STATUS", res.statusCode);
console.log("HEADERS", res.headers);
console.log("---WRITES---");
for (const w of writes) {
  console.log(typeof w === "string" ? w.slice(0, 300) : JSON.stringify(w).slice(0, 300));
  console.log("---");
}
