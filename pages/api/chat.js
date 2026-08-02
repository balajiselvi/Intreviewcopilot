import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { analyzeInterviewQuestion } from "../../lib/interviewAnalyzer";
import { buildReasoningPlan } from "../../lib/reasoningPlanner";
import { selectSapComponents } from "../../lib/componentSelector";
import { reviewAnswer } from "../../lib/answerReviewer";

import { buildSapInterviewPrompt } from "../../lib/sapInterviewPrompt";
import { profileInterviewer } from "../../lib/interviewerProfiler";
import { buildTechnicalReasoning } from "../../lib/technicalReasoner";

import { searchKnowledge } from "../../services/vectorSearch";

const MAX_HISTORY_ITEMS = 6;

function isGemini(model = "") {
  return model.toLowerCase().startsWith("gemini");
}

function writeChunk(res, text) {
  res.write(
    `data: ${JSON.stringify({ text })}\n\n`
  );
}

async function buildKnowledgeContext(question) {

  const chunks =
    await searchKnowledge(question, 5);

  return {

    chunks,

    context: chunks
      .map((chunk, index) => `
SOURCE ${index + 1}

File:
${chunk.sourceFile}

Folder:
${chunk.sourceFolder}

${chunk.content}
`)
      .join("\n\n----------------------------------------\n\n")

  };

}

export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }

  const {

    apiKey,

    model,

    question,

    history = [],

    customInstructions

  } = req.body || {};

  if (
    !apiKey ||
    !model ||
    !question?.trim()
  ) {

    return res.status(400).json({

      error:
        "API key, model and question are required."

    });

  }

  res.setHeader(
    "Content-Type",
    "text/event-stream; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-cache, no-transform"
  );

  res.setHeader(
    "Connection",
    "keep-alive"
  );

  res.flushHeaders?.();

  try {

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

const interviewer =
  profileInterviewer(
    question,
    analysis
  );

const technicalReasoning =
  buildTechnicalReasoning(
    question,
    analysis,
    sapComponents,
    interviewer
  );

    const knowledge =
      await buildKnowledgeContext(
        question
      );

     const systemPrompt =
  buildSapInterviewPrompt({

    question,

    analysis,

    reasoningPlan,

    technicalReasoning,

    interviewer,

    blueprint: {

      opening: "",

      body: reasoningPlan.answerFlow
        ? reasoningPlan.answerFlow.map(step => ({
            section: step
          }))
        : [],

      implementationInsight: "",

      closing: ""

    },

    evidence: {

      businessEvidence: [],

      technicalEvidence: [],

      architectureEvidence: [],

      implementationEvidence: [],

      workflowEvidence: [],

      troubleshootingEvidence: []

    },

    sapComponents:
      technicalReasoning.recommendedComponents,

    knowledgeContext:
      knowledge.context,

    model,

    responseLength: "medium",

    customInstructions

  });

    const recentHistory = history

      .filter(item =>
        item?.content &&
        ["user", "assistant"].includes(item.role)
      )

      .slice(-MAX_HISTORY_ITEMS);

    // ===============================
    // GEMINI
    // ===============================

    if (isGemini(model)) {

      const client =
        new GoogleGenerativeAI(apiKey);

      const generativeModel =
        client.getGenerativeModel({

          model,

          systemInstruction: {

            parts: [

              {
                text: systemPrompt
              }

            ]

          },

          generationConfig: {

            temperature: 0.05,

            maxOutputTokens: 900

          }

        });

      const chat =
        generativeModel.startChat({

          history: recentHistory.map(item => ({

            role:
              item.role === "assistant"
                ? "model"
                : "user",

            parts: [

              {
                text: item.content
              }

            ]

          }))

        });

      const result =
        await chat.sendMessage(question);

      let answer =
        result.response.text();

      const review =
        reviewAnswer(
          question,
          answer,
          analysis
        );

      if (review.regenerate) {

        const retry =
          await chat.sendMessage(

`Improve the previous answer.

Issues:

${review.issues.join("\n")}

Return only the improved interview answer.`

          );

        answer =
          retry.response.text();

      }

      writeChunk(
        res,
        answer
      );

    }

    // ===============================
    // OPENAI
    // ===============================

    else {

      const client =
        new OpenAI({

          apiKey

        });

      const completion =
        await client.chat.completions.create({

          model,

          temperature: 0.1,

          max_tokens: 900,

          messages: [

            {

              role: "system",

              content: systemPrompt

            },

            ...recentHistory,

            {

              role: "user",

              content: question

            }

          ]

        });

      let answer =
        completion.choices[0].message.content;

              const review =
        reviewAnswer(
          question,
          answer,
          analysis
        );

      if (review.regenerate) {

        const retry =
          await client.chat.completions.create({

            model,

            temperature: 0.10,

            max_tokens: 900,

            messages: [

              {

                role: "system",

                content: systemPrompt

              },

              {

                role: "user",

                content: `Improve the previous answer.

Issues identified:

${review.issues.join("\n")}

Return ONLY the improved interview answer.`

              }

            ]

          });

        answer =
          retry.choices[0].message.content;

      }

      writeChunk(
        res,
        answer
      );

    }

    res.write("data: [DONE]\n\n");

    res.end();

  }

  catch (error) {

    console.error(
      "Interview Copilot Error:",
      error
    );

    res.write(

      `event: error\ndata: ${JSON.stringify({

        error:
          error?.message ||
          "Unexpected error."

      })}\n\n`

    );

    res.end();

  }

}

