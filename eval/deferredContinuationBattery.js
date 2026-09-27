/**
 * Deferred fragment assembly. Counts are derived from the continuation contract.
 * node eval/deferredContinuationBattery.js
 */
const assert = require("assert");
const { takeUtterance } = require("../lib/deferredContinuation.js");
const { admitQuestion, priorAnchor } = require("../lib/questionAdmission.js");
const { loadSession } = require("./liveInterviewReview.js");

const PRIOR = "How does the ARM approval workflow decide a request?";

function play(turns, prior = "") {
  let pending = null;
  const events = [];
  let generations = 0;
  for (const utterance of turns) {
    const result = takeUtterance(pending, utterance);
    pending = result.pending;
    if (result.action === "hold") {
      events.push({ action: "hold", disposition: result.disposition, pending: pending && pending.text, said: utterance });
      continue;
    }
    const gate = admitQuestion(result.text, { priorQuestion: prior });
    if (gate.decision === "ANSWER") generations += 1;
    events.push({ action: result.action, gate: gate.decision, text: result.text, said: utterance });
  }
  return { events, generations, pending };
}

function completes(turns, expected, prior = PRIOR) {
  const result = play(turns, prior);
  const done = result.events.filter((event) => event.text === expected);
  assert.strictEqual(done.length, 1, `${turns.join(" / ")} -> ${result.events.map((event) => event.text || event.pending).join(" || ")}`);
  const gate = admitQuestion(expected, { priorQuestion: prior });
  assert.strictEqual(result.generations, gate.decision === "ANSWER" ? 1 : 0, turns.join(" / "));
  assert.ok(result.events.filter((event) => event.action === "hold").every((event) => event.disposition !== "ANSWER"));
  return result;
}

function separate(turns, prior = PRIOR) {
  const result = play(turns, prior);
  assert.ok(!result.events.some((event) => event.text && event.text !== turns[0] && event.text !== turns[1] && event.text.includes(turns[0]) && event.text.includes(turns[1])), turns.join(" / "));
  return result;
}

const continuations = [
  [["What about", "the approval workflow?"], "What about the approval workflow?"],
  [["And the", "emergency access process?"], "And the emergency access process?"],
  [["How would you", "troubleshoot an IPS synchronization failure?"], "How would you troubleshoot an IPS synchronization failure?"],
  [["How do you configure", "the Fiori target mapping?"], "How do you configure the Fiori target mapping?"],
  [["What about the identity", "boundary between IAS and IAG?"], "What about the identity boundary between IAS and IAG?"],
  [["How would you", "approach", "an SoD investigation?"], "How would you approach an SoD investigation?"],
  [["Walk me through the", "role remediation steps?"], "Walk me through the role remediation steps?"],
  [["Can you explain the", "path from SU24 proposals into PFCG?"], "Can you explain the path from SU24 proposals into PFCG?"],
  [["What changed in", "the firefighter log review?"], "What changed in the firefighter log review?"],
  [["Where does", "the provisioning job write the account?"], "Where does the provisioning job write the account?"],
  [["Tell me about the", "hypercare access defects?"], "Tell me about the hypercare access defects?"],
  [["How should we", "separate IAS authentication from IAG requests?"], "How should we separate IAS authentication from IAG requests?"],
  [["And then the", "mitigating control owner?"], "And then the mitigating control owner?"],
  [["Describe the", "BRM methodology for derived roles?"], "Describe the BRM methodology for derived roles?"],
  [["How do you trace", "a missing authorization on a Fiori tile?"], "How do you trace a missing authorization on a Fiori tile?"],
  [["What happens when", "IPS skips a user that has no manager?"], "What happens when IPS skips a user that has no manager?"],
  [["Could you cover the", "ruleset transport path?"], "Could you cover the ruleset transport path?"],
  [["How would you design", "the global Access Control landscape?"], "How would you design the global Access Control landscape?"],
  [["So the", "catalog is missing the target mapping?"], "So the catalog is missing the target mapping?"],
  [["Which team owns the", "emergency access review?"], "Which team owns the emergency access review?"],
  [["How do you", "validate a role after SU25?"], "How do you validate a role after SU25?"],
  [["What about the", "SoD simulation before the access request?"], "What about the SoD simulation before the access request?"]
];

const unrelated = [
  ["What about the approval workflow?", "How do you manage vendor delays during hypercare?"],
  ["What about the Fiori catalog?", "How would you design GRC Access Control globally?"],
  ["How would you troubleshoot Fiori authorization?", "What was your role at Dover?"],
  ["What about the approval workflow?", "We also had a vendor delay."],
  ["Why?", "Why is mitigation required before approval?"],
  ["How do you configure PFCG roles for a plant?", "Where did the Dover programme run?"],
  ["Explain firefighter logging.", "How many users were in scope?"],
  ["What is the difference between IAS and IAG?", "Tell me about your Fabtech project."],
  ["How do you investigate a failed provisioning job?", "Good morning."],
  ["Describe your approach to role remediation.", "And the meeting is at three."],
  ["What does SU24 contribute to a role?", "Thanks, that is all from my side."],
  ["How would you structure a ruleset for a global template?", "Can we pause for a minute?"],
  ["Where do you store mitigating controls?", "The panel will come back after lunch."],
  ["How do you test a derived role?", "Please mute the line."],
  ["What breaks when a catalog has no target mapping?", "We will share the outcome later."],
  ["How should hypercare handle urgent access?", "Nice to meet you today."],
  ["Explain the ARM workflow stages.", "I think we are done with that topic."],
  ["How do you prove an SoD exception?", "Let's switch to the commercial discussion."],
  ["What evidence do you keep for an access review?", "The next interviewer is joining now."],
  ["How would you remediate wide roles before go-live?", "Tell me about the Dover user population."],
  ["Which transaction shows the authorization trace?", "How long was the Eminnov hypercare?"],
  ["How do you decide a mitigating control is still valid?", "What clients have you worked with?"]
];

const stillDeferred = [
  ["What about"],
  ["How would you"],
  ["And the"],
  ["How do you configure"],
  ["What about the identity"],
  ["Can you explain the"],
  ["Where does"],
  ["How would you", "approach"],
  ["Tell me about the"],
  ["So the"]
];

const noise = [
  ["What about", "um yeah okay"],
  ["How would you", "hmm"],
  ["And the", "uh uh"],
  ["How do you configure", "okay okay"],
  ["What about the", "yeah"],
  ["Can you explain the", "mm hmm"],
  ["Where does", "oh well"],
  ["How should we", "alright"],
  ["Describe the", "um"],
  ["So the", "yeah yeah"]
];

const manualAfterSpeech = [
  [["How would you configure", "the Fiori target mapping?"], "How would you configure the Fiori target mapping?"],
  [["What about", "the approval workflow?"], "What about the approval workflow?"],
  [["Can you explain the", "difference between a risk and a mitigating control?"], "Can you explain the difference between a risk and a mitigating control?"],
  [["How do you trace", "STAUTHTRACE for a missing tile?"], "How do you trace STAUTHTRACE for a missing tile?"],
  [["Where does", "IAS stop and the target application start?"], "Where does IAS stop and the target application start?"],
  [["And the", "firefighter controller review?"], "And the firefighter controller review?"],
  [["What happens when", "the access request has no risk owner?"], "What happens when the access request has no risk owner?"],
  [["How would you", "contain SAP_ALL before the first go-live?"], "How would you contain SAP_ALL before the first go-live?"],
  [["Tell me about the", "IPS transformation for user ids?"], "Tell me about the IPS transformation for user ids?"],
  [["Which team owns the", "UAR campaign after hypercare?"], "Which team owns the UAR campaign after hypercare?"]
];

let continuationCount = 0;
for (const [turns, expected] of continuations) {
  completes(turns, expected);
  continuationCount += 1;
}
for (const [turns, expected] of manualAfterSpeech) {
  completes(turns, expected);
}

let unrelatedCount = 0;
for (const turns of unrelated) {
  const result = separate(turns);
  assert.ok(!result.events.some((event) => event.action === "complete"), turns.join(" / "));
  unrelatedCount += 1;
}

const why = play(["Why?", "Why is mitigation required before approval?"], "");
assert.strictEqual(why.events[0].gate, "DEFER");
assert.strictEqual(why.events[1].text, "Why is mitigation required before approval?");
assert.strictEqual(why.generations, 1);

let stillCount = 0;
for (const turns of stillDeferred) {
  const result = play(turns, PRIOR);
  assert.strictEqual(result.generations, 0, turns.join(" / "));
  assert.ok(result.pending, turns.join(" / "));
  stillCount += 1;
}

let noiseCount = 0;
for (const turns of noise) {
  const result = play(turns, PRIOR);
  assert.strictEqual(result.generations, 0, turns.join(" / "));
  assert.strictEqual(result.pending.text, turns[0], turns.join(" / "));
  noiseCount += 1;
}

const multi = play(["How would you", "approach", "an SoD investigation?"], PRIOR);
assert.strictEqual(multi.generations, 1);
assert.strictEqual(multi.events.filter((event) => event.action === "hold").length, 2);

const reset = play(["How would you"], "");
assert.ok(reset.pending);
const afterReset = play(["What was your role at Dover?"], PRIOR);
assert.strictEqual(afterReset.events[0].text, "What was your role at Dover?");
assert.ok(!afterReset.events[0].text.includes("How would you"));

const history = [
  { type: "question", text: "How would you", disposition: "DEFER" },
  { type: "question", text: "How would you troubleshoot an IPS synchronization failure?", disposition: "ANSWER" }
];
assert.strictEqual(priorAnchor(history), history[1].text);

const retry = play(["How would you troubleshoot an IPS synchronization failure?"], "");
assert.strictEqual(retry.generations, 1);
assert.strictEqual(retry.pending, null);

const session = loadSession();
let pending = null;
let merged = 0;
let deferredLeft = 0;
for (const turn of session.turns || []) {
  const before = pending && pending.text;
  const result = takeUtterance(pending, turn.question);
  pending = result.pending;
  if (result.action === "complete") {
    assert.ok(before && result.text.startsWith(before.slice(0, 12)), result.text);
    merged += 1;
  } else if (result.action === "hold" && result.disposition === "DEFER") {
    deferredLeft += 1;
  }
}
assert.strictEqual(merged, 0, "this capture has no safe open-frame continuation");
assert.ok(deferredLeft >= 0);

assert.ok(continuationCount >= 20);
assert.ok(unrelatedCount >= 20);
assert.ok(stillCount >= 10);
assert.ok(noiseCount >= 10);
assert.ok(manualAfterSpeech.length >= 10);

console.log(`deferred continuation: join ${continuationCount}, unrelated ${unrelatedCount}, still ${stillCount}, noise ${noiseCount}, manual ${manualAfterSpeech.length}, capture-merged ${merged}, capture-held ${deferredLeft}`);
