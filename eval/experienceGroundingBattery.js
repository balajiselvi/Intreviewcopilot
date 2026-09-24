/**
 * Experience evidence stays on the named engagement.
 * node eval/experienceGroundingBattery.js
 */
const assert = require("assert");
const { scopeCareerEvidence, auditHistoricalClaims } = require("./lib/careerTimeline.js");

function expectMode(question, prior, mode, programmeId) {
  const scope = scopeCareerEvidence(question, prior);
  assert.strictEqual(scope.mode, mode, `${question} mode ${scope.mode}`);
  if (programmeId) assert.strictEqual(scope.programmeId, programmeId, question);
  return scope.text;
}

function absent(text, pattern, label) {
  assert.ok(!pattern.test(text), `${label} leaked: ${pattern}`);
}

function present(text, pattern, label) {
  assert.ok(pattern.test(text), `${label} missing: ${pattern}`);
}

const cases = [];

cases.push("fabtech users stay on fabtech");
{
  const text = expectMode("Tell me about your Fabtech project.", "", "programme", "fabtech");
  present(text, /2,000 users/, "fabtech users");
  present(text, /450 roles/, "fabtech roles");
  present(text, /Dubai/, "fabtech location");
  present(text, /10\.1/, "fabtech grc");
  absent(text, /8,700/, "dover users");
  absent(text, /15-month/, "dover duration");
  absent(text, /team of 8/, "dover team");
  absent(text, /6,500/, "eminnov users");
  present(text, /team size/, "fabtech team absence");
  present(text, /duration in months/, "fabtech duration absence");
}

cases.push("dover metrics stay on dover");
{
  const text = expectMode("Tell me about your Dover experience.", "", "programme", "dover");
  present(text, /8,700/, "dover users");
  present(text, /15-month/, "dover duration");
  present(text, /team of 8/, "dover team");
  present(text, /11 countries/, "dover countries");
  absent(text, /450 roles/, "fabtech roles");
  absent(text, /Dubai/, "fabtech city");
  absent(text, /6,500/, "eminnov users");
  present(text, /individual country names/, "dover country names absent");
}

cases.push("eminnov is not middle east");
{
  const text = expectMode("What did you do at Eminnov?", "", "programme", "eminnov");
  present(text, /6,500/, "eminnov users");
  present(text, /8-week/, "eminnov hypercare");
  present(text, /regional delivery label/, "eminnov region boundary");
  absent(text, /Dubai/, "fabtech city");
  absent(text, /8,700/, "dover users");
  absent(text, /team of 8\b/, "dover team");
}

cases.push("fabtech duration question does not inherit dover");
{
  const text = expectMode("How long was the Fabtech project, and how many team members?", "", "programme", "fabtech");
  absent(text, /18 months|15-month|team of 8|8,700/, "migrated dover shape");
  present(text, /Not documented: team size, duration in months/, "absence record");
}

cases.push("prior fabtech scopes a follow-up");
{
  const text = expectMode("How long was the project?", "Fabtech International, what kind of company was that?", "programme", "fabtech");
  absent(text, /8,700|15-month|team of 8/, "prior follow-up contamination");
}

cases.push("unnamed user count is methodology");
{
  const text = expectMode("Toast has how many users?", "", "methodology", null);
  absent(text, /8,700|6,500|2,000|11 countries/, "unnamed metric");
}

cases.push("years question does not invent a total");
{
  const text = expectMode("How many years of experience do you have?", "", "methodology", null);
  absent(text, /\b17\b|\b13\b/, "invented years");
}

cases.push("client geography stays labelled");
{
  const text = expectMode("What clients have you worked with, and which geographies?", "", "portfolio", null);
  present(text, /Fabtech International: Dubai/, "fabtech geo");
  present(text, /WMS Middle East: Middle East/, "wms geo");
  present(text, /Middle East is not documented for Eminnov/, "eminnov boundary");
  present(text, /Individual country names are not documented/, "dover country names");
}

cases.push("other middle east projects do not lock onto fabtech");
{
  const text = expectMode("What are the other projects that you worked on in the Middle East?", "How long was the Fabtech project?", "portfolio", null);
  present(text, /Do not move a region/, "portfolio boundary");
  absent(text, /8,700\+ users/, "dover volume in a geography question");
}

cases.push("dover countries question");
{
  const text = expectMode("Which countries did Dover cover?", "", "programme", "dover");
  present(text, /11 countries/, "count");
  present(text, /individual country names/, "names withheld");
  absent(text, /\bIndia\b|\bCanada\b|\bEurope\b/, "invented regions");
}

cases.push("historical audit catches migrated claims");
{
  const evidence = scopeCareerEvidence("Tell me about Fabtech.", "").text;
  const leaked = auditHistoricalClaims(
    "Fabtech ran 18 months with a team of 8 and 8,700 users across India.",
    evidence
  );
  assert.ok(leaked.some((item) => item.startsWith("months:")), leaked.join(","));
  assert.ok(leaked.some((item) => item.startsWith("team:")), leaked.join(","));
  assert.ok(leaked.some((item) => item.includes("8700") || item.includes("8,700")), leaked.join(","));
  assert.ok(leaked.some((item) => item.includes("india")), leaked.join(","));
}

cases.push("supported fabtech users are not flagged");
{
  const evidence = scopeCareerEvidence("Tell me about Fabtech.", "").text;
  const claims = auditHistoricalClaims("Fabtech was about 2,000 users and 450 roles in Dubai.", evidence);
  assert.deepStrictEqual(claims.filter((item) => item.startsWith("users:") || item.startsWith("region:dubai")), []);
}

cases.push("eminov team question");
{
  const text = expectMode("What was the team size at Eminnov?", "", "programme", "eminnov");
  present(text, /teams of 4/, "eminnov team");
  absent(text, /team of 8/, "dover team");
}

cases.push("wms is the middle east administration engagement");
{
  const text = expectMode("What did you do at WMS?", "", "programme", "wms");
  present(text, /Middle East/, "wms region");
  absent(text, /8,700|6,500|GRC AC 12/, "other programme volumes");
}

cases.push("enerlife has no imported volumes");
{
  const text = expectMode("Tell me about your Enerlife experience.", "", "programme", "enerlife");
  absent(text, /8,700|6,500|2,000 users|Dubai/, "imported facts");
}

cases.push("two named programmes are not merged");
{
  const text = expectMode("Compare your Dover and Eminnov programmes.", "", "multi", null);
  present(text, /Dover Corporation/, "dover block");
  present(text, /Eminnov Technologies/, "eminnov block");
  assert.ok(text.indexOf("Dover") < text.indexOf("Eminnov") || text.indexOf("Eminnov") < text.indexOf("Dover"));
}

cases.push("technical question keeps the full background");
{
  expectMode("How do you design a PFCG role from SU24?", "", "full", null);
}

cases.push("role follow-up inherits the named engagement");
{
  const text = expectMode("What was your role?", "Tell me about your Dover experience.", "programme", "dover");
  present(text, /team of 8/, "dover role context");
  absent(text, /450 roles/, "fabtech role count");
}

cases.push("grc experience without a name stays on labelled lines");
{
  const text = expectMode("What was your GRC experience?", "", "domain", null);
  const lines = text.split("\n");
  const dover = lines.find((line) => line.includes("Dover"));
  const fabtech = lines.find((line) => line.includes("Fabtech"));
  const eminnov = lines.find((line) => line.includes("Eminnov"));
  assert.ok(dover && fabtech && eminnov);
  assert.match(dover, /15-month|team of 8|8,700/);
  assert.match(fabtech, /Dubai|2,000|450/);
  assert.doesNotMatch(fabtech, /8,700|15-month|team of 8/);
  assert.doesNotMatch(eminnov, /Dubai|8,700|15-month/);
  assert.doesNotMatch(dover, /Dubai/);
}

cases.push("qatar is not a documented delivery country");
{
  const text = expectMode("Did you deliver in Qatar?", "", "portfolio", null);
  absent(text, /\bQatar\b/i, "qatar");
  present(text, /Individual country names are not documented/, "country names withheld");
}

assert.ok(cases.length >= 20, `expected >= 20 cases, got ${cases.length}`);
console.log(`experience grounding: ${cases.length} cases`);
