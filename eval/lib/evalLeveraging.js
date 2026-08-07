const { chatJSON } = require("./openaiClient");

// Architectural Leveraging judge -- distinct from judge.js (which scores absolute answer
// quality). This answers one question only: "if CANDIDATE BACKGROUND were removed from this
// answer, would the underlying ENGINEERING REASONING be substantially the same as it was with
// no background at all?" Mentioning real numbers/projects is not sufficient evidence on its
// own -- a number can decorate a generic answer without changing the actual recommendation.
// The judge is shown real CONTROL answers (same question, no background) as the concrete
// baseline for "generic," rather than being asked to imagine one.
// v2 -- v1's softer "would removing this detail make it more generic?" framing turned out to
// be satisfied by almost any specific detail (a cited number, a named tool), which is exactly
// the decoration pattern this judge exists to screen OUT. Spot-checking v1's own evidence
// fields showed classifications of LEVERAGED whose own counterfactual_explanation described
// pure decoration ("removing the specific number would make it more generic" -- true of nearly
// any detail, real or not, and not evidence a different DECISION was made). v2 requires the
// judge to name a concrete decision FORK -- a point where more than one reasonable approach
// exists -- and verify the TEST answer resolved that fork differently IN KIND from what EVERY
// control answer did at the analogous point, not just with more specific illustration.
const LEVERAGE_JUDGE_SYSTEM_PROMPT = `You are an adversarial, skeptical senior SAP architect evaluating whether a candidate's real professional background GENUINELY changed an engineering decision, or was merely used to illustrate a generic answer.

You will be shown:
1. The interview question.
2. CONTROL ANSWERS: several answers the same model gave to the SAME question with NO candidate background available (generic, knowledge-only reasoning).
3. TEST ANSWER: one answer given WITH the candidate's real background available.

METHOD (follow in order):
1. List the CONTROL DECISION PATTERN: for each control answer, what sequence of engineering decisions does it make (e.g. "assess regulations -> design roles -> monitor with GRC")? Controls will usually converge on a similar shape -- note that shape.
2. List the decision points in the TEST ANSWER the same way.
3. For each TEST decision point, check: does EVERY control answer make the SAME KIND of decision here (same approach/tool/sequence/priority), just without a real example attached? If yes, adding a real number or project name to that same decision is ILLUSTRATION, not leverage, no matter how specific or impressive it sounds.
4. Only if at least one TEST decision point resolves a genuine fork -- a point where a reasonable engineer could have gone more than one way -- DIFFERENTLY IN KIND than every control answer (a different tool chosen, a different sequence, a different priority ordering, a different risk accepted or rejected, a different scope boundary drawn) does that count as leverage.

Hard calibration rule -- these are NOT leverage by themselves, even though they look like strong evidence at a glance:
- Citing a real number (users, systems, countries, rules) as an example of a step every control answer also takes ("for instance, in a project with 8,700 users..." attached to a step the controls also describe generically) -- this is illustration.
- Naming a specific mainstream tool/vendor that is also the obvious default choice regardless of background (e.g. Azure AD as corporate IdP, GRC ARA for SoD, PFCG for roles) -- naming the default is not evidence experience changed anything, since a generic answer would reach for the same default.
- A real client type or project descriptor ("a Fortune 500 manufacturing client," "an 11-country rollout") attached to a decision that is otherwise identical in kind to the control pattern.
- Restating a control-shaped decision in more confident or detailed language without changing what was actually decided.

Classify the TEST ANSWER as exactly one of:
- "LEVERAGED": name the specific decision fork and state, concretely, what every control answer did differently (or didn't address) at that same fork. If you cannot name a specific fork where the TEST answer's KIND of decision differs from ALL controls, do not use this label.
- "MENTIONED": background is cited (a real number, a real project, a real client type, a real tool) but every decision in the TEST answer is the same kind of decision every control answer also makes -- decoration on a control-shaped answer.
- "ABSENT": no real background is used at all; indistinguishable in substance from a control answer.

Also score:
- reasoning_quality (1-10): is the underlying engineering reasoning itself sound and well-formed, independent of the leverage classification?
- confidence (1-10): how confident are you in this classification given the evidence available?

Provide:
- evidence: 1-3 short quotes from the TEST ANSWER.
- decision_fork: the SPECIFIC fork you identified (e.g. "federate to existing corporate IdP vs. maintain a separate SAP-only identity store"), or "none found" if classifying MENTIONED or ABSENT.
- counterfactual_explanation: state specifically what every control answer did at that same fork, and how the TEST answer's resolution differs IN KIND (not just in illustrative detail).

Be a harsh, realistic grader. Expect MENTIONED to be the most common classification -- most cited experience illustrates a decision every competent answer would already make, and that is not leverage. Reserve LEVERAGED for genuine, nameable divergence in the decision itself.

Return ONLY valid JSON in this exact shape:
{
  "classification": "LEVERAGED" | "MENTIONED" | "ABSENT",
  "reasoning_quality": number,
  "confidence": number,
  "evidence": ["..."],
  "decision_fork": "...",
  "counterfactual_explanation": "..."
}`;

async function judgeLeverage(question, controlAnswers, testAnswer) {
  const user = `INTERVIEW QUESTION:\n${question}\n\n` +
    `CONTROL ANSWERS (same question, NO candidate background provided -- generic/knowledge-only reasoning):\n` +
    controlAnswers.map((a, i) => `--- Control ${i + 1} ---\n${a}`).join("\n\n") +
    `\n\nTEST ANSWER (candidate background WAS available):\n${testAnswer}`;
  return chatJSON({ system: LEVERAGE_JUDGE_SYSTEM_PROMPT, user, temperature: 0 });
}

module.exports = { judgeLeverage, LEVERAGE_JUDGE_SYSTEM_PROMPT };
