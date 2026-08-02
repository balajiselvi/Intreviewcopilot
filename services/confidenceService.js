const { ConfidenceReportSchema, StageHealthSchema } = require("../models/contracts");

function createConfidenceService({ version = "1.0.0" } = {}) {
  return Object.freeze({
    getVersion: () => version,
    health: async () => StageHealthSchema.parse({ status: "ok", version }),
    execute: async ({ validation }) => {
      const score = Math.max(0, Math.min(1, (validation?.score || 0) / 10));
      const level = score >= 0.9 ? "high" : score >= 0.7 ? "medium" : "low";

      return ConfidenceReportSchema.parse({
        score,
        level,
        reasons: validation?.issues || [],
        version
      });
    }
  });
}

module.exports = { createConfidenceService };
