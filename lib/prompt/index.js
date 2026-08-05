import { evaluateAnswer } from "./evaluation";
import { analyzeFollowupReadiness } from "./followupAnalyzer";
import { computeWeightedScore } from "./scoring";

// The only symbol pages/api/chat.js needs to import from this directory.
// Call this AFTER the answer has fully streamed to the client — every check here is
// pure JS (no LLM calls), so it adds no meaningful latency, but it must never run
// before or during the stream.
export function runPostAnswerEvaluation({
  question = "",
  answer = "",
  analysis = {},
  sapComponents = [],
  interviewer = {},
  candidateResume = ""
}) {
  const { categoryScores, findings } = evaluateAnswer({ question, answer, analysis, sapComponents, candidateResume });
  const { followups, gaps, readinessScore } = analyzeFollowupReadiness({ question, answer, analysis, sapComponents });

  const fullCategoryScores = { ...categoryScores, followUpReadiness: readinessScore };
  const { overallScore, breakdown } = computeWeightedScore(fullCategoryScores);

  return {
    overallScore,
    scale: 10,
    breakdown,
    findings,
    followups,
    gaps
  };
}
