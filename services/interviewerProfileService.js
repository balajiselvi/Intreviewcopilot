const { InterviewProfileSchema, StageHealthSchema } = require("../models/contracts");

function createInterviewerProfileService({ profiler, version = "1.0.0" } = {}) {
  if (typeof profiler !== "function") throw new Error("An interviewer profiler is required.");

  return Object.freeze({
    getVersion: () => version,
    health: async () => StageHealthSchema.parse({ status: "ok", version }),
    execute: async ({ question, analysis }) => InterviewProfileSchema.parse({
      ...profiler(question, analysis),
      version
    })
  });
}

module.exports = { createInterviewerProfileService };
