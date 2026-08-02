import { searchKnowledge } from "../services/vectorSearch";
import { buildInterviewEngine } from "./engine";
import { buildDynamicPrompt } from "./promptBuilder";

export async function buildInterviewPipeline({

  question,

  analysis,

  customInstructions = ""

}) {

  // --------------------------------------
  // Retrieve Knowledge
  // --------------------------------------

  const retrievedKnowledge =
    await searchKnowledge(

      question,

      analysis,

      12

    );

  // --------------------------------------
  // Engine

  const engine =

    buildInterviewEngine({

      question,

      knowledgeChunks: retrievedKnowledge

    });

  // --------------------------------------
  // Knowledge Context

  const knowledgeContext =

    engine.rankedKnowledge

      .map(

        (chunk, index) =>

`SOURCE ${index + 1}

File:
${chunk.sourceFile}

Folder:
${chunk.sourceFolder}

${chunk.content}`

      )

      .join(

"\n\n====================================================\n\n"

      );

  // --------------------------------------
  // Prompt

  const systemPrompt =

    buildDynamicPrompt({

      question,

      analysis: engine.analysis,

      reasoningPlan: engine.reasoningPlan,

      sapComponents: engine.sapComponents,

      knowledgeContext,

      customInstructions

    });

  return {

    ...engine,

    systemPrompt,

    knowledgeContext

  };

}