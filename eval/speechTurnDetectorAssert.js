/**
 * Speech-sequence tests for turn finalization. Fake clock — no microphone, no Azure.
 * Also measures the legacy "timer starts only on recognized/final" behavior so the
 * before/after premature-submission counts are evidence, not recollection.
 */
const assert = require("assert");
const {
  createSpeechTurnDetector,
  mergeFinal,
  mergeInterim,
  STABILITY_MS,
  LATE_CONTINUATION_MS
} = require("../lib/speechTurnDetector");

const fs = require("fs");
const path = require("path");
const interviewSource = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
assert.match(interviewSource, /createSpeechTurnDetector/);
assert.match(interviewSource, /ingestSpeech\('interim'/);
assert.match(interviewSource, /ingestSpeech\('final'/);
assert.match(interviewSource, /speechStartDetected/);
assert.doesNotMatch(interviewSource, /Speech_SegmentationSilenceTimeoutMs", "500"[\s\S]{0,200}askOpenAI\(snapshot/);
assert.match(interviewSource, /queue-while-busy/);
assert.match(interviewSource, /notifyGenerationSettled\(utteranceId\)/);
assert.match(interviewSource, /pendingSpeechQueueRef/);
assert.match(interviewSource, /delete window\.__interviewIngestSpeech/);

function createClock() {
  let t = 0;
  let seq = 1;
  const timers = new Map();
  return {
    now: () => t,
    schedule(fn, ms) {
      const id = seq++;
      timers.set(id, { at: t + ms, fn });
      return id;
    },
    cancel(id) {
      timers.delete(id);
    },
    advance(ms) {
      const target = t + ms;
      while (true) {
        let soonest = null;
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!soonest || timer.at < soonest.at)) {
            soonest = { id, at: timer.at, fn: timer.fn };
          }
        }
        if (!soonest) {
          t = target;
          return;
        }
        t = soonest.at;
        timers.delete(soonest.id);
        soonest.fn();
      }
    },
    get t() { return t; }
  };
}

function simulateLegacy(events, { silenceMs = 1200, holdMs = 500 } = {}) {
  const clock = createClock();
  const submissions = [];
  let finalText = "";
  let pending = null;

  function merge(incoming) {
    const existing = finalText.trim();
    const cleanText = String(incoming || "").replace(/\s+/g, " ").trim();
    if (!cleanText) return;
    if (existing.toLowerCase().endsWith(cleanText.toLowerCase())) return;
    finalText = `${existing} ${cleanText}`.trim();
  }

  function submit() {
    pending = null;
    const snapshot = finalText.trim();
    if (snapshot) submissions.push({ t: clock.t, text: snapshot });
  }

  function arm(delay) {
    if (pending != null) clock.cancel(pending);
    pending = clock.schedule(submit, delay);
  }

  let i = 0;
  let lastT = 0;
  while (i < events.length) {
    const event = events[i];
    clock.advance(event.t - lastT);
    lastT = event.t;
    if (event.type === "final") {
      merge(event.text);
      arm(silenceMs);
    }
    i += 1;
  }
  clock.advance(silenceMs + holdMs + 50);
  return submissions;
}

function runDetector(events, { autoCommit = true, baseSilenceMs = 1200, afterMs = 4000 } = {}) {
  const clock = createClock();
  const submissions = [];
  const revocations = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs,
    onFinalize({ text, utteranceId }) {
      submissions.push({ t: clock.t, text, utteranceId });
      if (autoCommit) detector.acknowledgeCommit(utteranceId);
    },
    onRevoked(payload) {
      revocations.push({ t: clock.t, ...payload });
    }
  });

  let lastT = 0;
  for (const event of events) {
    clock.advance(event.t - lastT);
    lastT = event.t;
    if (event.type === "interim") detector.noteInterim(event.text);
    else if (event.type === "final") detector.noteFinal(event.text);
    else if (event.type === "start") detector.noteSpeechStart();
    else if (event.type === "end") detector.noteSpeechEnd();
    else if (event.type === "settled") detector.notifyGenerationSettled();
  }
  clock.advance(afterMs);
  return { submissions, revocations, detector, clock };
}

assert.strictEqual(mergeFinal("How do you", "How do you"), "How do you");
assert.strictEqual(mergeFinal("How do you", "add a tile"), "How do you add a tile");
assert.strictEqual(mergeFinal("How would you add a Fiori tile", "tile"), "How would you add a Fiori tile");
assert.strictEqual(mergeFinal("How would you add a Fiori", "a Fiori tile"), "How would you add a Fiori tile");
assert.strictEqual(mergeFinal("How would you add a Fiori tile", "How would you add a Fiori tile?"), "How would you add a Fiori tile?");
assert.strictEqual(mergeFinal("Secure S/4HANA with PFCG", "SU24"), "Secure S/4HANA with PFCG SU24");
assert.strictEqual(mergeFinal("IAS IPS IAG", "IAG"), "IAS IPS IAG");
assert.strictEqual(mergeFinal("put the ruleset together", "to S/4"), "put the ruleset together to S/4");
assert.strictEqual(mergeInterim("How would you", "add a Fiori tile"), "How would you add a Fiori tile");
assert.strictEqual(mergeInterim("How would you", "How would you add a Fiori tile"), "How would you add a Fiori tile");
assert.strictEqual(mergeInterim("How would you add a Fiori tile", "tile"), "How would you add a Fiori tile");

const cases = [];

// CASE 1: setup + pause + remainder → one question
cases.push(["CASE 1 pause inside setup", [
  { t: 0, type: "final", text: "I have given you a requirement" },
  { t: 700, type: "start" },
  { t: 750, type: "interim", text: "to add a tile" },
  { t: 1400, type: "final", text: "to add a tile." }
]]);

// CASE 2: three clauses
cases.push(["CASE 2 three pauses", [
  { t: 0, type: "final", text: "How do you" },
  { t: 600, type: "interim", text: "actually include the technical changes" },
  { t: 1300, type: "final", text: "actually include the technical changes" },
  { t: 1900, type: "interim", text: "into the Fiori catalog and tiles?" },
  { t: 2600, type: "final", text: "into the Fiori catalog and tiles?" }
]]);

// CASE 3
cases.push(["CASE 3 what happens if", [
  { t: 0, type: "final", text: "What happens if" },
  { t: 550, type: "interim", text: "the user cannot" },
  { t: 1100, type: "final", text: "the user cannot" },
  { t: 1650, type: "interim", text: "open the application?" },
  { t: 2200, type: "final", text: "open the application?" }
]]);

// CASE 4: natural pause, must not submit during the pause (measured at t=900)
// Handled separately below.

// CASE 5 / 7: short complete
cases.push(["CASE 5/7 short complete", [
  { t: 0, type: "final", text: "What is SoD?" }
]]);

// CASE 8
cases.push(["CASE 8 short follow-up", [
  { t: 0, type: "final", text: "What about IPS?" }
]]);

// CASE 9: long architecture, several finals, one turn
cases.push(["CASE 9 long architecture", [
  { t: 0, type: "final", text: "How would you design the role architecture" },
  { t: 800, type: "interim", text: "for a new S/4 rollout covering" },
  { t: 1600, type: "final", text: "for a new S/4 rollout covering" },
  { t: 2200, type: "interim", text: "finance, procurement, and plant operations?" },
  { t: 3000, type: "final", text: "finance, procurement, and plant operations?" }
]]);

let prematureLegacy = 0;
let prematureNow = 0;
let duplicateLegacy = 0;
let duplicateNow = 0;

for (const [name, events] of cases) {
  const legacy = simulateLegacy(events);
  const { submissions } = runDetector(events);
  if (legacy.length !== 1) prematureLegacy += Math.max(0, legacy.length - 1) || (legacy.length === 0 ? 0 : 0);
  if (legacy.length > 1) {
    prematureLegacy += 1;
    duplicateLegacy += legacy.length - 1;
  }
  if (legacy.length === 1 && events.some((e) => e.type === "final" && e.t > 0) && legacy[0].text.split(/\s+/).length < 8) {
    // submitted only the first clause
    const lastFinal = [...events].reverse().find((e) => e.type === "final");
    if (lastFinal && !legacy[0].text.includes(lastFinal.text.replace(/[?.]/g, "").split(" ").slice(-2).join(" "))) {
      prematureLegacy += 1;
    }
  }
  assert.strictEqual(submissions.length, 1, `${name} expected 1 submit, got ${submissions.length}: ${JSON.stringify(submissions)}`);
  const lastFinal = [...events].reverse().find((e) => e.type === "final");
  assert.ok(submissions[0].text.toLowerCase().includes(lastFinal.text.toLowerCase().replace(/[?.]/g, "").split(" ").pop().replace(/[?.]/g, "")), `${name} missing tail: ${submissions[0].text}`);
  if (submissions.length > 1) duplicateNow += submissions.length - 1;
}

// CASE 4: at 900ms after first final, with no continuation yet, must NOT have submitted
{
  const clock = createClock();
  const submissions = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text, utteranceId }) {
      submissions.push(text);
      detector.acknowledgeCommit(utteranceId);
    }
  });
  detector.noteFinal("How would you");
  clock.advance(900);
  assert.strictEqual(submissions.length, 0, "CASE 4 submitted during a natural pause");
  detector.noteInterim("configure the catalog?");
  clock.advance(400);
  detector.noteFinal("configure the catalog?");
  clock.advance(4000);
  assert.strictEqual(submissions.length, 1, "CASE 4 should submit once after the real end");
  assert.match(submissions[0], /catalog/i);
}

// CASE 6: rephrase after unfinished thought — prefer the combined / latest coherent utterance, one submit
{
  const { submissions } = runDetector([
    { t: 0, type: "final", text: "How do you" },
    { t: 500, type: "interim", text: "I mean how would you configure the catalog?" },
    { t: 1200, type: "final", text: "I mean how would you configure the catalog?" }
  ]);
  assert.strictEqual(submissions.length, 1);
  assert.match(submissions[0].text, /configure the catalog/i);
}

// CASE 10: two genuine questions with a real boundary
{
  const { submissions } = runDetector([
    { t: 0, type: "final", text: "How do you design the role?" },
    { t: 3500, type: "final", text: "What about Fiori?" }
  ]);
  assert.strictEqual(submissions.length, 2, `CASE 10 expected 2 turns, got ${submissions.length}`);
  assert.match(submissions[0].text, /design the role/i);
  assert.match(submissions[1].text, /Fiori/i);
}

// Unseen segmentation of the same question — all one turn
const unseenQuestion = "How would you add a Fiori tile?";
const unseenPatterns = [
  [
    { t: 0, type: "final", text: "How would you" },
    { t: 700, type: "interim", text: "add a Fiori tile" },
    { t: 1400, type: "final", text: "add a Fiori tile?" }
  ],
  [
    { t: 0, type: "final", text: "How would you add" },
    { t: 500, type: "final", text: "a Fiori" },
    { t: 900, type: "interim", text: "tile" },
    { t: 1400, type: "final", text: "tile?" }
  ],
  [
    { t: 0, type: "final", text: unseenQuestion }
  ]
];
for (const [index, events] of unseenPatterns.entries()) {
  const { submissions } = runDetector(events);
  assert.strictEqual(submissions.length, 1, `unseen pattern ${index + 1} submitted ${submissions.length} times`);
  assert.match(submissions[0].text, /fiori tile/i);
}

// Domain-agnostic paraphrases (not used during detector design as keywords)
const domains = [
  "How do you create a derived role for a new plant?",
  "Walk me through configuring a GRC connector.",
  "How would you set up IAS SSO?",
  "How do you build the JML flow?",
  "How do you set up analysis authorizations in BW?",
  "How would you restrict a story in SAC?",
  "How do you add a space in Datasphere?",
  "How do you enable Cloud Connector access in RISE?",
  "How do you manage a matrixed stakeholder conflict?"
];
for (const question of domains) {
  const words = question.split(" ");
  const events = [
    { t: 0, type: "final", text: words.slice(0, 3).join(" ") },
    { t: 600, type: "interim", text: words.slice(3).join(" ") },
    { t: 1300, type: "final", text: words.slice(3).join(" ") }
  ];
  const { submissions } = runDetector(events);
  assert.strictEqual(submissions.length, 1, `${question} → ${submissions.length}`);
  assert.ok(submissions[0].text.includes(words[words.length - 1].replace(/[?.]/g, "")), question);
}

// Duplicate finals must not double-submit
{
  const { submissions } = runDetector([
    { t: 0, type: "final", text: "What is SoD?" },
    { t: 80, type: "final", text: "What is SoD?" }
  ]);
  assert.strictEqual(submissions.length, 1);
}

// Legacy premature count on the original three pause cases
const pauseCases = cases.slice(0, 3).map(([, events]) => events);
for (const events of pauseCases) {
  const legacy = simulateLegacy(events);
  if (legacy.length !== 1) prematureLegacy += 1;
  else {
    const last = [...events].reverse().find((e) => e.type === "final").text;
    if (!legacy[0].text.toLowerCase().includes(last.toLowerCase().split(" ").pop().replace(/[?.]/g, ""))) {
      prematureLegacy += 1;
    }
  }
}

// Clean before/after on the three original pause cases only.
const pauseOnly = [
  [
    { t: 0, type: "final", text: "I have given you a requirement" },
    { t: 700, type: "start" },
    { t: 750, type: "interim", text: "to add a tile" },
    { t: 1400, type: "final", text: "to add a tile." }
  ],
  [
    { t: 0, type: "final", text: "How do you" },
    { t: 600, type: "interim", text: "actually include the technical changes" },
    { t: 1300, type: "final", text: "actually include the technical changes" },
    { t: 1900, type: "interim", text: "into the Fiori catalog and tiles?" },
    { t: 2600, type: "final", text: "into the Fiori catalog and tiles?" }
  ],
  [
    { t: 0, type: "final", text: "What happens if" },
    { t: 550, type: "interim", text: "the user cannot" },
    { t: 1100, type: "final", text: "the user cannot" },
    { t: 1650, type: "interim", text: "open the application?" },
    { t: 2200, type: "final", text: "open the application?" }
  ]
];
let pauseLegacyPremature = 0;
let pauseNowPremature = 0;
let pauseLegacyDup = 0;
let pauseNowDup = 0;
const latencies = [];
for (const events of pauseOnly) {
  const lastFinalT = [...events].reverse().find((e) => e.type === "final").t;
  const lastFinalText = [...events].reverse().find((e) => e.type === "final").text;
  const legacy = simulateLegacy(events);
  const { submissions } = runDetector(events);
  const legacyComplete = legacy.length === 1 && legacy[0].text.toLowerCase().includes(lastFinalText.toLowerCase().split(" ").pop().replace(/[?.]/g, ""));
  if (!legacyComplete) pauseLegacyPremature += 1;
  if (legacy.length > 1) pauseLegacyDup += legacy.length - 1;
  if (submissions.length !== 1) pauseNowPremature += 1;
  if (submissions.length > 1) pauseNowDup += submissions.length - 1;
  if (submissions[0]) latencies.push(submissions[0].t - lastFinalT);
}

// If a final is emitted and more speech arrives before the consumer commits,
// revoke within LATE_CONTINUATION_MS rather than generating a second answer.
{
  const clock = createClock();
  const submissions = [];
  const revocations = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text }) { submissions.push({ t: clock.t, text }); },
    onRevoked({ text }) { revocations.push(text); }
  });
  detector.noteFinal("How do you");
  clock.advance(1910);
  assert.strictEqual(submissions.length, 1);
  clock.advance(80);
  assert.ok(clock.t - submissions[0].t < LATE_CONTINUATION_MS);
  detector.noteInterim("configure the catalog?");
  assert.strictEqual(revocations.length, 1, "trailing speech inside LATE window must revoke");
  detector.noteFinal("configure the catalog?");
  clock.advance(4000);
  assert.strictEqual(submissions.length, 2);
  assert.match(submissions[1].text, /catalog/i);
  assert.strictEqual(submissions[1].text.startsWith("How do you"), true);
}

// Uncommitted finalized + speech after LATE must start a new turn (no glue)
{
  const clock = createClock();
  const submissions = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text }) { submissions.push(text); }
  });
  detector.noteFinal("What is SoD?");
  clock.advance(2000);
  assert.strictEqual(submissions.length, 1);
  clock.advance(LATE_CONTINUATION_MS + 20);
  detector.noteFinal("How do you design the role?");
  clock.advance(4000);
  assert.strictEqual(submissions.length, 2);
  assert.strictEqual(submissions[0], "What is SoD?");
  assert.strictEqual(submissions[1], "How do you design the role?");
}

// Property-style: same utterance, different Azure segmentation shapes → one submit
{
  const target = "How would you add a Fiori tile?";
  const shapes = [
    ["A two finals", [
      { t: 0, type: "final", text: "How would you" },
      { t: 500, type: "final", text: "add a Fiori tile" }
    ]],
    ["B final/interim/final", [
      { t: 0, type: "final", text: "How would you add" },
      { t: 300, type: "interim", text: "a Fiori" },
      { t: 900, type: "final", text: "a Fiori tile" }
    ]],
    ["C growing interims", [
      { t: 0, type: "final", text: "How would you" },
      { t: 200, type: "interim", text: "add a" },
      { t: 400, type: "interim", text: "add a Fiori" },
      { t: 1000, type: "final", text: "add a Fiori tile" }
    ]],
    ["D single final + long silence", [
      { t: 0, type: "final", text: target }
    ]],
    ["E duplicate final", [
      { t: 0, type: "final", text: target },
      { t: 50, type: "final", text: target }
    ]],
    ["F punctuation-only second final", [
      { t: 0, type: "final", text: "How would you add a Fiori tile" },
      { t: 80, type: "final", text: "How would you add a Fiori tile?" }
    ]]
  ];
  for (const [name, events] of shapes) {
    const { submissions } = runDetector(events);
    assert.strictEqual(submissions.length, 1, `${name} → ${submissions.length}`);
    assert.match(submissions[0].text, /fiori tile/i, name);
  }
}

// Pause-duration sweep: interims during a 400–1100ms gap must not submit early
{
  for (const gap of [400, 700, 900, 1100]) {
    const { submissions } = runDetector([
      { t: 0, type: "final", text: "How would you" },
      { t: gap, type: "interim", text: "configure IAS?" },
      { t: gap + 400, type: "final", text: "configure IAS?" }
    ]);
    assert.strictEqual(submissions.length, 1, `gap ${gap}ms → ${submissions.length}`);
    assert.match(submissions[0].text, /IAS/);
  }
}

// Late continuation vs genuine second turn
{
  const clock = createClock();
  const submissions = [];
  const revocations = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text, utteranceId }) {
      submissions.push({ t: clock.t, text, utteranceId });
      detector.acknowledgeCommit(utteranceId);
    },
    onRevoked() { revocations.push(clock.t); }
  });
  detector.noteFinal("What is SoD?");
  clock.advance(1400 + STABILITY_MS + 20);
  assert.strictEqual(submissions.length, 1);
  clock.advance(LATE_CONTINUATION_MS + 50);
  detector.noteInterim("also IPS");
  detector.noteFinal("What about IPS?");
  clock.advance(4000);
  assert.strictEqual(revocations.length, 0, "speech after late window must be a new turn");
  assert.strictEqual(submissions.length, 2);
}

// stopPending: microphone stop must not submit a half-question
{
  const clock = createClock();
  const submissions = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text }) { submissions.push(text); }
  });
  detector.noteFinal("How would you configure");
  clock.advance(800);
  detector.stopPending();
  clock.advance(4000);
  assert.strictEqual(submissions.length, 0);
  assert.match(detector.getFinalText(), /configure/);
}

// Generation still running: detector emits the second turn; consumer may ignore it
// until settle, which must re-emit immediately rather than waiting another full grace.
{
  const clock = createClock();
  const submissions = [];
  let busy = false;
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text, utteranceId }) {
      submissions.push({ t: clock.t, text });
      if (busy) return;
      busy = true;
      detector.acknowledgeCommit(utteranceId);
    }
  });
  detector.noteFinal("What is SoD?");
  clock.advance(1600);
  assert.strictEqual(submissions.length, 1);
  clock.advance(500);
  detector.noteFinal("What about IPS?");
  clock.advance(2500);
  assert.strictEqual(submissions.length, 2, "second turn finalize while first in flight");
  busy = false;
  const beforeSettle = submissions.length;
  detector.notifyGenerationSettled();
  assert.strictEqual(submissions.length, beforeSettle + 1, "settled-pending must re-emit immediately");
  assert.match(submissions[submissions.length - 1].text, /IPS/);
}

// Settling utterance A must not wipe utterance B already in progress
{
  const clock = createClock();
  const submissions = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text, utteranceId }) {
      submissions.push({ text, utteranceId });
      if (submissions.length === 1) detector.acknowledgeCommit(utteranceId);
    }
  });
  detector.noteFinal("What is SoD?");
  clock.advance(2000);
  assert.strictEqual(submissions.length, 1);
  const firstId = submissions[0].utteranceId;
  clock.advance(LATE_CONTINUATION_MS + 20);
  detector.noteFinal("How would you add a Fiori tile?");
  clock.advance(200);
  assert.match(detector.getFinalText(), /Fiori tile/i);
  detector.notifyGenerationSettled(firstId);
  assert.match(detector.getFinalText(), /Fiori tile/i, "in-flight next question must survive settle of the previous turn");
  clock.advance(4000);
  assert.strictEqual(submissions.length, 2);
}

// Adversarial: one-word, fragment, repeated words, empty interim
{
  const { submissions: oneWord } = runDetector([{ t: 0, type: "final", text: "Why?" }]);
  assert.strictEqual(oneWord.length, 1);
  const { submissions: fragment } = runDetector([{ t: 0, type: "final", text: "And then" }]);
  assert.strictEqual(fragment.length, 1);
  const { submissions: repeated } = runDetector([
    { t: 0, type: "final", text: "How how would you add a Fiori tile?" }
  ]);
  assert.strictEqual(repeated.length, 1);
  const detector = createSpeechTurnDetector({
    now: () => 0,
    schedule: (fn) => fn,
    cancel() {},
    autoSubmit: false
  });
  detector.noteInterim("   ");
  detector.noteFinal("PFCG");
  assert.strictEqual(detector.getFinalText(), "PFCG");
}

// Failed submit (no API key / early return) must not glue the next question onto the first
{
  const clock = createClock();
  const submissions = [];
  const detector = createSpeechTurnDetector({
    now: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    baseSilenceMs: 1200,
    onFinalize({ text }) {
      submissions.push(text);
      detector.releaseFinalize();
    }
  });
  detector.noteFinal("What is SoD?");
  clock.advance(2000);
  assert.strictEqual(submissions.length, 1);
  clock.advance(500);
  detector.noteFinal("What about IPS?");
  clock.advance(2500);
  assert.strictEqual(submissions.length, 2);
  assert.strictEqual(submissions[1], "What about IPS?");
}

console.log("speechTurnDetectorAssert: PASS");
console.log(JSON.stringify({
  pauseLegacyPremature,
  pauseNowPremature,
  pauseLegacyDup,
  pauseNowDup,
  finalizeLatencyMsAfterLastFinal: latencies,
  typicalFinalizeMsAfterLastFinal: 1200 + STABILITY_MS
}, null, 2));
