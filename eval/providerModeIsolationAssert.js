/**
 * Prove MOCK/DISABLED never invoke live SDK transports; LIVE path records when guards allow.
 * No paid network calls — only assertLiveTransportAllowed / streamMockProviderResponse.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  resolveProviderMode,
  resetProviderStats,
  getProviderStats,
  assertLiveTransportAllowed,
  streamMockProviderResponse,
  DISABLED_GENERATION_MESSAGE
} = require("../lib/providerMode.js");

const OUT = path.join(__dirname, "results", "_acceptance", "provider-mode-isolation.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const report = { cases: [], pass: true };

function record(name, ok, detail = {}) {
  report.cases.push({ name, ok, ...detail });
  if (!ok) report.pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, detail.note || "");
}

// --- resolveProviderMode ---
record("resolve-mock-env", resolveProviderMode({ LLM_PROVIDER_MODE: "mock" }) === "mock");
record("resolve-disabled-env", resolveProviderMode({ LLM_PROVIDER_MODE: "disabled" }) === "disabled");
record("resolve-live-env", resolveProviderMode({ LLM_PROVIDER_MODE: "live" }) === "live");
record("resolve-unknown-fail-closed", resolveProviderMode({ LLM_PROVIDER_MODE: "sandbox" }) === "disabled");
record(
  "resolve-acceptance-lock",
  resolveProviderMode({ INTERVIEW_ACCEPTANCE_LOCK: "1" }) === "disabled"
);
record("resolve-default-live", resolveProviderMode({}) === "live");

// --- MOCK: mock stream increments mock; live guard throws and must not count as allowed live success ---
resetProviderStats("mock");
(async () => {
  const mockText = await streamMockProviderResponse({ question: "What are Critical Actions?" });
  const afterMock = getProviderStats();
  record("mock-stream-invocation", afterMock.mockInvocations === 1 && afterMock.liveTransportInvocations === 0, {
    stats: afterMock,
    textLen: String(mockText || "").length
  });

  let blocked = false;
  try {
    assertLiveTransportAllowed("mock", "openai-sdk");
  } catch (err) {
    blocked = err?.code === "PROVIDER_MODE_BLOCKED";
  }
  const afterBlock = getProviderStats();
  // assertLiveTransportAllowed throws before recording live in non-live modes
  record("mock-live-guard-blocked", blocked === true && afterBlock.liveTransportInvocations === 0, {
    stats: afterBlock
  });

  // --- DISABLED ---
  resetProviderStats("disabled");
  let disabledBlocked = false;
  try {
    assertLiveTransportAllowed("disabled", "gemini-sdk");
  } catch (err) {
    disabledBlocked = err?.code === "PROVIDER_MODE_BLOCKED";
  }
  record("disabled-live-guard-blocked", disabledBlocked === true && getProviderStats().liveTransportInvocations === 0, {
    stats: getProviderStats(),
    messagePreview: DISABLED_GENERATION_MESSAGE.slice(0, 60)
  });

  // Body-spoof simulation: resolve never reads body fields
  const spoofed = resolveProviderMode(
    { LLM_PROVIDER_MODE: "mock" },
    { llm: { providerMode: "live" } }
  );
  // env wins over appConfig when set
  record("env-overrides-config-live-spoof", spoofed === "mock");

  // --- LIVE allowed ---
  resetProviderStats("live");
  assertLiveTransportAllowed("live", "openai-sdk");
  record("live-guard-allows", getProviderStats().liveTransportInvocations === 1, {
    stats: getProviderStats()
  });

  // Chat.js wiring smoke: require providerMode symbols from chat without executing handler
  const chatSrc = fs.readFileSync(path.join(__dirname, "..", "pages", "api", "chat.js"), "utf8");
  record("chat-imports-providerMode", /require\("\.\.\/\.\.\/lib\/providerMode\.js"\)/.test(chatSrc));
  record("chat-strips-keys-mock-disabled", /providerMode === "mock" \|\| providerMode === "disabled"/.test(chatSrc)
    && /apiKey = ""/.test(chatSrc));
  record("chat-mock-branch", /providerMode === "mock"/.test(chatSrc) && /streamMockProviderResponse/.test(chatSrc));
  record("chat-disabled-branch", /PROVIDER_DISABLED|recordDisabledBlocked/.test(chatSrc));
  record(
    "chat-sdk-guards",
    (chatSrc.match(/assertLiveTransportAllowed/g) || []).length >= 5
  );

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nproviderModeIsolation: ${report.pass ? "PASS" : "FAIL"} → ${OUT}`);
  if (!report.pass) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
