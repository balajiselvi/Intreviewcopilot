const { CompanyProfileSchema, StageHealthSchema } = require("../models/contracts");

function createCompanyContextService({ version = "1.0.0" } = {}) {
  return Object.freeze({
    getVersion: () => version,
    health: async () => StageHealthSchema.parse({ status: "ok", version }),
    execute: async () => CompanyProfileSchema.parse({
      name: "",
      context: "",
      source: "not-provided",
      version
    })
  });
}

module.exports = { createCompanyContextService };
