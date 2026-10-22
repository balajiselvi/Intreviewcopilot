/**
 * Implementation-intent probe. Deterministic routing by default; pass --live to also generate
 * answers against the local dev server. Local diagnostic harness.
 */
const { resolveInterviewContext, toHistoryContext } = require("../lib/interviewContext");

const LIVE = process.argv.includes("--live");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").replace("--only=", "");

const GROUPS = [
  ["IMPLEMENTATION", [
    "I have given you a requirement to add a tile. How are you going to do that?",
    "How would you add a Fiori tile?",
    "Walk me through configuring a new tile.",
    "What are the technical steps to expose this app?",
    "How would you configure the catalog and target mapping?",
    "How do you set up an IPS provisioning job?",
    "How would you configure IAS SSO with Azure AD?",
    "How do you create a derived role for a new plant?",
    "How do you configure a GRC connector for access risk analysis?",
    "How do you set up analysis authorizations in BW?",
    "How would you set up team-based access in SAC?",
    "How do you add a new space and assign privileges in Datasphere?",
    "If I give you a requirement to onboard a new application to IAG, how will you implement it?",
    "How do you build the JML flow from the HR source to S/4?"
  ]],
  ["NOT_IMPLEMENTATION", [
    "What is a Fiori catalog?",
    "Why would you use a catalog?",
    "What is target mapping?",
    "What is the difference between a catalog and a target mapping?",
    "What is an analysis authorization?"
  ]],
  ["TROUBLESHOOTING", [
    "The tile is visible but won't launch.",
    "The application opens but throws authorization errors."
  ]],
  ["DESIGN", [
    "How would you design Fiori security for S/4?",
    "How would you approach the role architecture for a new rollout?"
  ]],
  ["EXPERIENCE", [
    "Have you actually implemented Fiori security?",
    "How did you implement the catalog model at your last client?"
  ]],
  // Unseen paraphrases, deliberately avoiding the wording used anywhere in the asserts.
  ["FRESH", [
    "Suppose finance needs a new org-restricted display role. How is that actually built?",
    "How would you stand up emergency access in GRC from scratch?",
    "Take me through onboarding S/4 into IAG for access analysis.",
    "A new SaaS app needs corporate SSO through IAS. How is that wired up?",
    "How would you get leaver deprovisioning flowing from SuccessFactors into the target systems?",
    "What's the sequence for restricting a story to one region in SAC?",
    "How do you expose a Datasphere view to a reporting team without giving them the whole space?",
    "How would you put row-level restriction in place for a BW query?",
    "In a RISE landscape, how do you enable a business user to reach an on-premise app through the Cloud Connector?",
    "How would you switch on a new OData service for a custom app?"
  ]]
];

function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

(async () => {
  let generateAnswer = null;
  if (LIVE) ({ generateAnswer } = require("./lib/generateAnswer"));
  for (const [label, questions] of GROUPS) {
    if (ONLY && label !== ONLY) continue;
    console.log(`\n================ ${label}`);
    for (const questionRaw of questions) {
      const ctx = resolveInterviewContext({ questionRaw });
      const routing = {
        intent: ctx.questionIntent,
        scope: ctx.answerScope,
        depth: ctx.depth,
        topic: ctx.questionTopic,
        objective: ctx.objective
      };
      if (!LIVE) {
        console.log(questionRaw);
        console.log(`   ${JSON.stringify(routing)}`);
        continue;
      }
      try {
        const { answer } = await generateAnswer(questionRaw, { history: [] });
        console.log(`\n--- ${questionRaw}`);
        console.log(JSON.stringify({ ...routing, words: words(answer) }));
        console.log(answer);
      } catch (error) {
        console.log(`\n--- ${questionRaw}\nGENERATION_FAILED ${error && error.message}`);
      }
    }
  }
})();
