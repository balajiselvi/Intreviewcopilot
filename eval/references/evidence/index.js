const { validateQuestionReference } = require("../../lib/evidenceScoreSchema.js");

const REFERENCES = Object.freeze([
  require("./msmp-configuration.js"),
  require("./firefighter-central-decentral.js"),
  require("./ias-vs-ips.js"),
  require("./s4-vs-bw-security.js"),
  require("./grc-s4-integration.js")
]);

function listEvidenceReferences() {
  return REFERENCES.map((ref) => {
    validateQuestionReference(ref);
    return ref;
  });
}

function getEvidenceReference(id) {
  const ref = REFERENCES.find((item) => item.id === id);
  if (!ref) return null;
  validateQuestionReference(ref);
  return ref;
}

module.exports = {
  REFERENCES,
  listEvidenceReferences,
  getEvidenceReference
};
