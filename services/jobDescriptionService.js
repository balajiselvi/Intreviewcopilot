const { JobDescriptionContextSchema, StageHealthSchema } = require("../models/contracts");

function createJobDescriptionService({ version = "1.0.0" } = {}) {
  return Object.freeze({
    getVersion: () => version,
    health: async () => StageHealthSchema.parse({ status: "ok", version }),
    execute: async () => JobDescriptionContextSchema.parse({
      content: "",
      source: "not-provided",
      version
    })
  });
}

module.exports = { createJobDescriptionService };
