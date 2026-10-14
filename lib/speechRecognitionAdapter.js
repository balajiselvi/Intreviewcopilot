/**
 * Maps recognizer events onto the speech-turn detector.
 * Production Azure Speech calls this with the same event kinds.
 * Tests inject events and never open a microphone or a Speech subscription.
 */
function applyRecognitionEvent(detector, kind, text = "") {
  if (!detector || typeof detector.noteInterim !== "function") {
    return { applied: false, reason: "no-detector" };
  }
  if (kind === "interim") {
    detector.noteInterim(text);
    return { applied: true, kind };
  }
  if (kind === "final") {
    if (!String(text || "").trim()) return { applied: false, kind: "empty" };
    detector.noteFinal(text);
    return { applied: true, kind };
  }
  if (kind === "start") {
    detector.noteSpeechStart();
    return { applied: true, kind };
  }
  if (kind === "end") {
    detector.noteSpeechEnd();
    return { applied: true, kind };
  }
  if (kind === "error" || kind === "canceled") {
    return { applied: false, kind: "error" };
  }
  return { applied: false, kind: "ignored" };
}

module.exports = { applyRecognitionEvent };
