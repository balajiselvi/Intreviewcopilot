/**
 * Follow-up domain inheritance. Does not concatenate turns into the classifier.
 * Continuation / plane-foil questions keep the prior product; explicit topic changes do not.
 */
function hasStrongTechnicalEvidence(category, domain) {
  return Boolean(category) && category !== "General" && Boolean(domain) && domain !== "General SAP" && domain !== "PMP";
}

function isExplicitTopicChange(question) {
  return /\b(what about|how about|now (?:let'?s |talk |look |consider )?|switch(?:ing)? to|instead|moving (?:on )?to)\b/i.test(String(question || ""));
}

function isPlaneFoil(question) {
  const q = String(question || "");
  return /\b(?:is (?:it|that|this) (?:still |really |just |only )?(?:an? )?(?:ias|ips|iag|btp|xsuaa))\b/i.test(q)
    || /\bstill\b.{0,32}\b(?:ias|ips|iag|btp|xsuaa)\b/i.test(q)
    || /\blogin (?:works|succeeds|is (?:ok|fine|successful)|ok)\b/i.test(q);
}

function isTopicContinuation(question) {
  return /\b(cannot see|can'?t see|blocked from|still (?:fail|denied|blank)|the story|the tile|same (?:user|issue)|that user)\b/i.test(String(question || ""));
}

function shouldInheritPriorDomain({ question, currentCategory, currentDomain, priorCategory, priorDomain }) {
  try {
    if (!hasStrongTechnicalEvidence(priorCategory, priorDomain)) return false;
    if (isExplicitTopicChange(question)) return false;
    if (isPlaneFoil(question) || isTopicContinuation(question)) return true;
    if (
      hasStrongTechnicalEvidence(currentCategory, currentDomain)
      && currentCategory !== priorCategory
      && currentDomain !== priorDomain
    ) {
      return false;
    }
    return !hasStrongTechnicalEvidence(currentCategory, currentDomain);
  } catch (error) {
    return false;
  }
}

module.exports = {
  hasStrongTechnicalEvidence,
  shouldInheritPriorDomain,
  isExplicitTopicChange,
  isPlaneFoil,
  isTopicContinuation
};
