const { ResumeContextSchema, StageHealthSchema } = require("../models/contracts");

function createResumeContextService({ version = "1.0.0" } = {}) {
  return Object.freeze({
    getVersion: () => version,
    health: async () => StageHealthSchema.parse({ status: "ok", version }),
    execute: async () => ResumeContextSchema.parse({
      content: "",
      source: "not-provided",
      version
    })
  });
}

module.exports = { createResumeContextService };
