const assert = require("assert");
const {
  shouldInheritPriorDomain,
  isExplicitTopicChange,
  isPlaneFoil,
  isTopicContinuation
} = require("../lib/contextInheritance.js");

assert.strictEqual(isPlaneFoil("Login works. Can the user still be blocked from the story?"), true);
assert.strictEqual(isTopicContinuation("Login works. Can the user still be blocked from the story?"), true);
assert.strictEqual(isPlaneFoil("Is it still IAS?"), true);
assert.strictEqual(isExplicitTopicChange("What about BTP XSUAA?"), true);
assert.strictEqual(isExplicitTopicChange("Login works, but the story is blank."), false);

const sacPrior = {
  question: "Login works. Can the user still be blocked from the story?",
  currentCategory: "General",
  currentDomain: "General SAP",
  priorCategory: "SAC",
  priorDomain: "SAC"
};
assert.strictEqual(shouldInheritPriorDomain(sacPrior), true, "SAC login-works follow-up must inherit");

assert.strictEqual(shouldInheritPriorDomain({
  question: "Is it still IAS?",
  currentCategory: "IAS",
  currentDomain: "SAP Cloud Identity / BTP",
  priorCategory: "SAC",
  priorDomain: "SAC"
}), true, "plane foil must inherit despite IAS tokens");

assert.strictEqual(shouldInheritPriorDomain({
  question: "What about BTP XSUAA?",
  currentCategory: "BTP",
  currentDomain: "SAP Cloud Identity / BTP",
  priorCategory: "SAC",
  priorDomain: "SAC"
}), false, "explicit topic change must not freeze SAC");

assert.strictEqual(shouldInheritPriorDomain({
  question: "How is Ariba access controlled in the realm?",
  currentCategory: "Ariba",
  currentDomain: "Ariba",
  priorCategory: "SAC",
  priorDomain: "SAC"
}), false, "different strong product must win");

assert.strictEqual(shouldInheritPriorDomain({
  question: "The user can log in but cannot open the story. Where would you look?",
  currentCategory: "Troubleshooting",
  currentDomain: "SAP Security",
  priorCategory: "SAC",
  priorDomain: "SAC"
}), true, "product-less SAC troubleshooting must inherit");

assert.strictEqual(shouldInheritPriorDomain({
  question: "okay then what",
  currentCategory: "General",
  currentDomain: "General SAP",
  priorCategory: "SAC",
  priorDomain: "SAC"
}), true, "weak continuation inherits prior product");

console.log("contextInheritanceAssert: PASS");
