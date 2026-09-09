const assert = require("assert");
const {
  invokeSpeechCallback,
  isLiveSessionNonFatal,
  safeCloseAudioConfig,
  stopMediaTracks
} = require("../lib/speechSessionGuard");

const fs = require("fs");
const path = require("path");
const interview = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
assert.match(interview, /speechSessionGuard/);
assert.match(interview, /safeCloseAudioConfig/);
assert.match(interview, /invokeSpeechCallback/);
assert.match(interview, /stopInFlightRef/);
assert.doesNotMatch(interview, /recognizer\.audioConfig\.close\(\)/);

const pushConfig = {
  privSource: {
    turnOff() {
      return undefined;
    },
    close() {
      this.closed = true;
    }
  },
  close() {
    this.privSource.turnOff().then(() => {});
  }
};

assert.doesNotThrow(() => {
  return safeCloseAudioConfig(pushConfig);
});

let promiseClosed = false;
const micConfig = {
  privSource: {
    turnOff() {
      return Promise.resolve().then(() => {
        promiseClosed = true;
      });
    }
  },
  close() {
    throw new Error("should not call AudioConfig.close for thenable turnOff");
  }
};

Promise.resolve(safeCloseAudioConfig(pushConfig))
  .then(() => {
    assert.strictEqual(pushConfig.privSource.closed, true);
    return safeCloseAudioConfig(micConfig);
  })
  .then(() => {
    assert.strictEqual(promiseClosed, true);
    return invokeSpeechCallback(function (cb) {
      cb();
    }, null, { timeoutMs: 1000 });
  })
  .then(() => invokeSpeechCallback(function () {
    throw new Error("boom");
  }, null, { swallowError: true, timeoutMs: 500 }))
  .then(() => {
    const tracks = [];
    stopMediaTracks({
      getTracks() {
        return [{ stop() { tracks.push("a"); } }, { stop() { throw new Error("track"); } }];
      }
    });
    assert.deepStrictEqual(tracks, ["a"]);
    assert.strictEqual(isLiveSessionNonFatal({ message: "Cannot read properties of undefined (reading 'then')", stack: "AudioConfigImpl.close" }), true);
    assert.strictEqual(isLiveSessionNonFatal({ message: "unrelated render bug" }), false);
    console.log("speechSessionGuardAssert: PASS");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
