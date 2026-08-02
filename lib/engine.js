import { analyzeInterviewQuestion } from "./interviewAnalyzer";
import { buildReasoningPlan } from "./reasoningPlanner";
import { selectSapComponents } from "./componentSelector";
import { buildEvidence } from "./evidenceBuilder";
import { composeAnswerBlueprint } from "./answerComposer";
import { rerankKnowledge } from "./reranker";

export function buildInterviewEngine({

  question,

  knowledgeChunks

}) {

  const analysis =
    analyzeInterviewQuestion(question);

  const reasoningPlan =
    buildReasoningPlan(
      question,
      analysis
    );

  const sapComponents =
    selectSapComponents(
      question,
      analysis
    );

  const rankedKnowledge =
    rerankKnowledge(

      knowledgeChunks,

      analysis,

      reasoningPlan

    );

  const evidence =
    buildEvidence(

      rankedKnowledge,

      reasoningPlan,

      sapComponents

    );

  const blueprint =
    composeAnswerBlueprint(

      analysis,

      reasoningPlan,

      evidence,

      sapComponents

    );

  return {

    analysis,

    reasoningPlan,

    sapComponents,

    rankedKnowledge,

    evidence,

    blueprint

  };

}