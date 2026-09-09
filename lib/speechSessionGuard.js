/**
 * Azure Speech SDK teardown helpers for live interview capture.
 * Push-stream AudioConfig.turnOff() returns undefined; AudioConfig.close() still
 * calls .then() on that value and throws. Isolate SDK faults from the interview UI.
 */

function asError(value) {
  if (value instanceof Error) return value;
  return new Error(String(value || "Speech SDK error"));
}

function isLiveSessionNonFatal(error) {
  const text = `${error?.message || error || ""} ${error?.stack || ""}`;
  return /reading ['"]then['"]|AudioConfigImpl|microsoft-cognitiveservices-speech-sdk|SpeechRecognizer|getDisplayMedia|NotAllowedError|NotFoundError/i.test(String(text));
}

function invokeSpeechCallback(method, context, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 12000;
  const swallowError = options.swallowError === true;

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (err) => {
      if (settled) return;
      settled = true;
      try {
        clearTimeout(timer);
      } catch {
        /* ignore */
      }
      if (err && !swallowError) {
        reject(asError(err));
        return;
      }
      resolve();
    };

    const timer = setTimeout(() => {
      settle(swallowError ? null : new Error("Speech SDK operation timed out"));
    }, timeoutMs);

    try {
      if (typeof method !== "function") {
        settle(null);
        return;
      }
      const ret = method.call(context, () => settle(null), (err) => settle(err || new Error("Speech SDK callback error")));
      if (ret && typeof ret.then === "function") {
        ret.then(() => settle(null), (err) => settle(err));
      }
    } catch (err) {
      settle(err);
    }
  });
}

function safeCloseAudioConfig(audioConfig) {
  try {
    if (!audioConfig) return Promise.resolve();
    const source = audioConfig.privSource;
    if (source && typeof source.turnOff === "function") {
      let result;
      try {
        result = source.turnOff();
      } catch (turnOffError) {
        console.error("Audio source turnOff failed:", turnOffError);
        return Promise.resolve();
      }
      if (result && typeof result.then === "function") {
        return result.catch((err) => {
          console.error("Audio source turnOff rejected:", err);
        });
      }
      if (typeof source.close === "function") {
        try {
          source.close();
        } catch (closeError) {
          console.error("Audio source close failed:", closeError);
        }
      }
      return Promise.resolve();
    }
    if (typeof audioConfig.close === "function") {
      try {
        const maybe = audioConfig.close();
        if (maybe && typeof maybe.then === "function") {
          return maybe.catch((err) => {
            console.error("AudioConfig close rejected:", err);
          });
        }
      } catch (closeError) {
        console.error("AudioConfig close failed:", closeError);
      }
    }
  } catch (error) {
    console.error("safeCloseAudioConfig failed:", error);
  }
  return Promise.resolve();
}

function safeDisposeRecognizer(recognizer) {
  if (!recognizer || typeof recognizer.close !== "function") {
    return Promise.resolve();
  }
  return invokeSpeechCallback(recognizer.close, recognizer, { swallowError: true, timeoutMs: 4000 });
}

function stopMediaTracks(stream) {
  try {
    if (!stream || typeof stream.getTracks !== "function") return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (trackError) {
        console.error("Media track stop failed:", trackError);
      }
    });
  } catch (error) {
    console.error("Media stream stop failed:", error);
  }
}

function attachLiveSessionErrorShield(onCaught) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const report = (error) => {
    try {
      if (typeof onCaught === "function") onCaught(error);
    } catch {
      /* ignore */
    }
  };

  const onError = (event) => {
    const error = event?.error || event?.message;
    if (!isLiveSessionNonFatal(error)) return;
    try {
      event.preventDefault();
    } catch {
      /* ignore */
    }
    report(error);
  };

  const onRejection = (event) => {
    const error = event?.reason;
    if (!isLiveSessionNonFatal(error)) return;
    try {
      event.preventDefault();
    } catch {
      /* ignore */
    }
    report(error);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

module.exports = {
  invokeSpeechCallback,
  isLiveSessionNonFatal,
  safeCloseAudioConfig,
  safeDisposeRecognizer,
  stopMediaTracks,
  attachLiveSessionErrorShield
};
