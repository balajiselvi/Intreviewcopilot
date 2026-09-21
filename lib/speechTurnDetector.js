/**
 * Speech turn detector.
 *
 * Azure Speech (and similar engines) emit multiple FINAL recognition segments inside one
 * human utterance. A recognized/final segment is therefore NOT "the interviewer finished
 * the question" — it is only "this phrase hypothesis is stable."
 *
 * Contract:
 *   A. interim / speech-start → utterance still active; pending finalize cancelled
 *   B. final segment          → merge into current utterance; (re)arm grace
 *   C. silence after final    → candidate end-of-turn (grace timer)
 *   D. activity before commit → revoke the pending/emitted finalize
 *   E. finalize               → exactly one onFinalize per committed turn
 *   F. activity after commit  → LATE_CONTINUATION_MS continues the same turn;
 *                               later speech starts a new utterance
 *   Uncommitted finalized turns use the same LATE window (lastEmittedAt).
 *   That prevents a dropped/queued emit from concatenating the next question.
 *
 * Race assumptions (JS is single-threaded; events for one source are serialized):
 * - noteInterim / noteFinal / noteSpeechStart / noteSpeechEnd never overlap.
 * - onFinalize is invoked from a timer callback and must return without awaiting.
 *   The consumer should call acknowledgeCommit synchronously if generation actually
 *   starts, or releaseFinalize if it cannot start, so a failed submit is not stuck.
 * - After acknowledgeCommit, speech within LATE_CONTINUATION_MS revokes and continues
 *   the same utteranceId. Speech after that window is a new turn.
 *
 * Grace is adaptive, not a fixed long timeout:
 *   clamp(configured silence, 700–2500)
 *   + 250ms per extra final segment (cap 600) — long questions pause more often
 *   + 550ms when the trailing shape is still open (function-word / very short)
 *   + 160ms stability after grace so an in-flight recognizing event can cancel
 * Azure already waited Speech_SegmentationSilenceTimeoutMs (~500ms) before the
 * final, so acoustic silence at finalize is typically ~1.7s, not 1.2s.
 */

const DEFAULT_BASE_MS = 1200;
const MIN_BASE_MS = 700;
const MAX_BASE_MS = 2500;
const MAX_GRACE_MS = 2800;
const STABILITY_MS = 160;
const LATE_CONTINUATION_MS = 400;
const HOLD_EXTRA_MS = 550;
const MULTI_SEGMENT_STEP_MS = 250;
const MULTI_SEGMENT_CAP_MS = 600;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function wordsOf(text) {
  return clean(text).split(/\s+/).filter(Boolean);
}

function longestWordOverlap(left, right) {
  const a = wordsOf(left);
  const b = wordsOf(right);
  const max = Math.min(a.length, b.length);
  for (let n = max; n > 0; n -= 1) {
    if (a.slice(-n).join(" ").toLowerCase() === b.slice(0, n).join(" ").toLowerCase()) {
      return n;
    }
  }
  return 0;
}

function mergeFinal(existing, incoming) {
  const a = clean(existing);
  const b = clean(incoming);
  if (!b) return a;
  if (!a) return b;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return a;
  if (al.endsWith(` ${bl}`) || al.endsWith(bl)) return a;
  if (bl.startsWith(`${al} `) || bl.startsWith(al)) return b;
  const overlap = longestWordOverlap(a, b);
  if (overlap > 0) {
    const rest = wordsOf(b).slice(overlap).join(" ");
    return rest ? `${a} ${rest}`.replace(/\s+/g, " ").trim() : a;
  }
  return `${a} ${b}`.trim();
}

function mergeInterim(finalText, interimText) {
  const a = clean(finalText);
  const b = clean(interimText);
  if (!b) return a;
  if (!a) return b;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (bl.startsWith(`${al} `) || bl === al) return b;
  if (al.endsWith(` ${bl}`) || al.endsWith(bl)) return a;
  const overlap = longestWordOverlap(a, b);
  if (overlap > 0) {
    const rest = wordsOf(b).slice(overlap).join(" ");
    return rest ? `${a} ${rest}` : a;
  }
  return `${a} ${b}`;
}

function looksLikeContinuationShape(text) {
  const q = clean(text).replace(/[.…]+$/, "");
  if (!q) return true;
  if (/[?!]$/.test(q)) return false;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return true;
  return /^(?:to|the|a|an|of|and|or|for|with|if|that|this|those|these|you|we|they|i|do|does|did|would|could|can|is|are|was|were|how|what|why|when|where|who|which)$/i.test(words[words.length - 1]);
}

function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSpeechTurnDetector(options = {}) {
  const now = options.now || (() => Date.now());
  const schedule = options.schedule || ((fn, ms) => setTimeout(fn, ms));
  const cancelTimer = options.cancel || ((id) => { try { clearTimeout(id); } catch { /* ignore */ } });
  const onTranscript = typeof options.onTranscript === "function" ? options.onTranscript : () => {};
  const onFinalize = typeof options.onFinalize === "function" ? options.onFinalize : () => {};
  const onRevoked = typeof options.onRevoked === "function" ? options.onRevoked : () => {};
  const onDiagnostic = typeof options.onDiagnostic === "function" ? options.onDiagnostic : null;
  const shouldHold = typeof options.shouldHold === "function" ? options.shouldHold : looksLikeContinuationShape;

  let baseMs = clamp(Number(options.baseSilenceMs) || DEFAULT_BASE_MS, MIN_BASE_MS, MAX_BASE_MS);
  let autoSubmit = options.autoSubmit !== false;
  let utteranceId = nextId("utt");
  let finalText = "";
  let interimText = "";
  let segmentCount = 0;
  let lastActivityAt = 0;
  let lastFinalAt = 0;
  let pending = null;
  let confirm = null;
  let finalized = false;
  let committed = false;
  let committedAt = 0;
  let committedText = "";
  let lastEmitted = "";
  let lastEmittedAt = 0;
  let lastReason = "";
  let submissionSeq = 0;

  function display() {
    return mergeInterim(finalText, interimText);
  }

  function diag(type, extra = {}) {
    if (!onDiagnostic) return;
    try {
      onDiagnostic({
        t: now(),
        type,
        utteranceId,
        segmentCount,
        finalText: clean(finalText),
        interimText: clean(interimText),
        pending: pending != null,
        confirm: confirm != null,
        finalized,
        committed,
        ...extra
      });
    } catch (error) {
      console.error("speechTurnDetector onDiagnostic failed:", error);
    }
  }

  function emitTranscript() {
    try {
      onTranscript(display(), { utteranceId, interim: Boolean(interimText), finalized, committed });
    } catch (error) {
      console.error("speechTurnDetector onTranscript failed:", error);
    }
  }

  function clearPending(reason) {
    const hadPending = pending != null || confirm != null;
    if (pending != null) {
      try { cancelTimer(pending); } catch { /* ignore */ }
      pending = null;
    }
    if (confirm != null) {
      try { cancelTimer(confirm); } catch { /* ignore */ }
      confirm = null;
    }
    if (hadPending) diag("timer-cancel", { reason: reason || "clear" });
  }

  function graceMs() {
    const extraSegments = Math.max(0, segmentCount - 1);
    const multi = Math.min(MULTI_SEGMENT_CAP_MS, extraSegments * MULTI_SEGMENT_STEP_MS);
    const hold = (!finalized && shouldHold(finalText)) ? HOLD_EXTRA_MS : 0;
    return clamp(baseMs + multi + hold, MIN_BASE_MS, MAX_GRACE_MS);
  }

  function beginNewUtterance() {
    clearPending("new-utterance");
    utteranceId = nextId("utt");
    finalText = "";
    interimText = "";
    segmentCount = 0;
    finalized = false;
    committed = false;
    committedAt = 0;
    committedText = "";
    lastEmitted = "";
    lastEmittedAt = 0;
    lastReason = "";
    diag("new-utterance");
  }

  function reopenForContinuation() {
    const wasFinalized = finalized;
    const wasCommitted = committed;
    const id = utteranceId;
    const text = clean(finalText);
    clearPending("continuation");
    finalized = false;
    committed = false;
    committedAt = 0;
    lastEmitted = "";
    lastEmittedAt = 0;
    if (wasFinalized) {
      diag("revoke", { wasCommitted });
      try { onRevoked({ utteranceId: id, text, wasCommitted }); } catch (error) {
        console.error("speechTurnDetector onRevoked failed:", error);
      }
    }
  }

  function confirmAndEmit(reason) {
    confirm = null;
    if (finalized || committed) return;
    const text = clean(finalText);
    if (!text) return;
    if (interimText) {
      arm();
      return;
    }
    if (now() - lastActivityAt < STABILITY_MS) {
      arm();
      return;
    }
    if (text === lastEmitted) return;
    finalized = true;
    lastEmitted = text;
    lastEmittedAt = now();
    lastReason = reason || "grace";
    submissionSeq += 1;
    diag("finalize", { reason: lastReason, submissionSeq, text });
    try {
      onFinalize({
        text,
        utteranceId,
        segmentCount,
        reason: lastReason,
        submissionSeq
      });
    } catch (error) {
      console.error("speechTurnDetector onFinalize failed:", error);
    }
  }

  function fireGrace() {
    pending = null;
    diag("timer-fire");
    if (finalized || committed) return;
    if (!clean(finalText)) return;
    if (interimText) {
      arm();
      return;
    }
    if (now() - lastActivityAt < STABILITY_MS) {
      arm();
      return;
    }
    confirm = schedule(() => confirmAndEmit("grace"), STABILITY_MS);
  }

  function arm() {
    if (!autoSubmit) {
      clearPending("auto-submit-off");
      return;
    }
    if (committed && now() - committedAt >= LATE_CONTINUATION_MS) return;
    if (!clean(finalText) || interimText) {
      clearPending("not-ready");
      return;
    }
    clearPending("rearm");
    const wait = graceMs();
    diag("timer-arm", { waitMs: wait });
    pending = schedule(fireGrace, wait);
  }

  function boundaryTime() {
    if (committed) return committedAt;
    if (finalized) return lastEmittedAt;
    return 0;
  }

  function touch(kind) {
    lastActivityAt = now();
    if (kind === "final") lastFinalAt = lastActivityAt;
    if (!committed && !finalized) return;
    if (lastActivityAt - boundaryTime() <= LATE_CONTINUATION_MS) {
      reopenForContinuation();
      return;
    }
    beginNewUtterance();
  }

  return {
    setBaseSilenceMs(ms) {
      baseMs = clamp(Number(ms) || DEFAULT_BASE_MS, MIN_BASE_MS, MAX_BASE_MS);
    },
    setAutoSubmit(value) {
      autoSubmit = value !== false;
      if (!autoSubmit) clearPending("auto-submit-off");
    },
    noteInterim(text) {
      const next = clean(text);
      if (!next) return display();
      touch("interim");
      interimText = next;
      clearPending("interim");
      diag("interim");
      emitTranscript();
      return display();
    },
    noteFinal(text) {
      const next = clean(text);
      if (!next) return display();
      touch("final");
      interimText = "";
      const before = finalText;
      finalText = mergeFinal(finalText, next);
      if (finalText !== before) segmentCount += 1;
      diag("final", { incoming: next, merged: finalText !== before });
      arm();
      emitTranscript();
      return display();
    },
    noteSpeechStart() {
      touch("start");
      clearPending("speech-start");
      diag("speech-start");
    },
    noteSpeechEnd() {
      lastActivityAt = now();
      diag("speech-end");
      if (clean(finalText) && !interimText && !committed) arm();
    },
    acknowledgeCommit(id) {
      if (id && id !== utteranceId) return false;
      committed = true;
      committedAt = now();
      committedText = clean(finalText);
      finalized = true;
      clearPending("commit");
      diag("commit");
      return true;
    },
    releaseFinalize() {
      finalized = false;
      lastEmitted = "";
      committed = true;
      committedAt = now() - LATE_CONTINUATION_MS - 1;
      committedText = clean(finalText);
      diag("release-finalize");
    },
    stopPending() {
      clearPending("stop");
      finalized = false;
      lastEmitted = "";
      diag("stop-pending");
    },
    notifyGenerationSettled(settledId) {
      if (settledId && settledId !== utteranceId) {
        diag("settled-other-utterance", { settledId });
        return;
      }
      if (!committed && finalized && clean(finalText)) {
        lastEmitted = "";
        lastEmittedAt = 0;
        finalized = false;
        diag("settled-pending");
        confirmAndEmit("settled-pending");
        return;
      }
      const leftover = clean(finalText);
      if (committed && leftover && leftover !== committedText) {
        const remainder = leftover.startsWith(committedText)
          ? leftover.slice(committedText.length).trim()
          : leftover;
        beginNewUtterance();
        if (remainder) {
          finalText = remainder;
          segmentCount = 1;
          arm();
          emitTranscript();
        }
        return;
      }
      beginNewUtterance();
      emitTranscript();
    },
    reset() {
      beginNewUtterance();
      emitTranscript();
    },
    forceFinalize() {
      clearPending("force");
      interimText = "";
      confirmAndEmit("force");
    },
    getDisplayText: display,
    getUtteranceId: () => utteranceId,
    getFinalText: () => clean(finalText),
    isFinalized: () => finalized,
    isCommitted: () => committed,
    _debug() {
      return {
        utteranceId,
        finalText,
        interimText,
        segmentCount,
        finalized,
        committed,
        lastActivityAt,
        lastFinalAt,
        lastReason,
        lastEmittedAt,
        submissionSeq,
        pending: pending != null,
        confirm: confirm != null
      };
    }
  };
}

module.exports = {
  createSpeechTurnDetector,
  mergeFinal,
  mergeInterim,
  looksLikeContinuationShape,
  DEFAULT_BASE_MS,
  STABILITY_MS,
  LATE_CONTINUATION_MS,
  HOLD_EXTRA_MS
};
