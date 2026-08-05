import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { analyzeInterviewQuestion } from "../../lib/interviewAnalyzer";
import { buildReasoningPlan } from "../../lib/reasoningPlanner";
import { selectSapComponents } from "../../lib/componentSelector";
import { buildSapInterviewPrompt, getMaxTokensForCategory } from "../../lib/prompt/interviewPrompt";
import { profileInterviewer } from "../../lib/interviewerProfiler";
import { buildTechnicalReasoning } from "../../lib/technicalReasoner";
import { searchKnowledge } from "../../services/vectorSearch";
import { logger } from "../../lib/logger";
import { runPostAnswerEvaluation } from "../../lib/prompt";
import APP_CONFIG from "../../config/appConfig";

const MAX_HISTORY_ITEMS = 6;
const DEFAULT_TIMEOUT_MS = 25000;
const RESPONSE_WRITE_TIMEOUT = 100;

const TOP_K_BY_CATEGORY = Object.freeze({
  Architecture: 3,
  Implementation: 3,
  Configuration: 3,
  Workflow: 3,
  Troubleshooting: 4,
  Scenario: 3,
  Migration: 3,
  Upgrade: 3,
  Comparison: 4,
  Definition: 2,
  Performance: 3,
  Security: 3,
  Authorization: 3,
  "Role Design": 3,
  "Production Support": 4,
  Cloud: 3,
  BTP: 3,
  IAS: 3,
  IPS: 3,
  IAG: 3,
  ARM: 3,
  ARA: 3,
  EAM: 3,
  BRM: 3,
  "SAP IDM": 3,
  Fiori: 3,
  ECC: 3,
  BW: 3,
  "S/4": 3,
  General: 2
});

const CATEGORY_RULES = Object.freeze([
  { category: "Troubleshooting", keywords: ["troubleshoot", "error", "dump", "st22", "su53", "bug", "fix", "issue", "fail", "exception"], weight: 3 },
  { category: "Production Support", keywords: ["production support", "ticket", "incident", "p1", "sla", "support"], weight: 3 },
  { category: "Architecture", keywords: ["architecture", "landscape", "design", "diagram", "topology"], weight: 3 },
  { category: "BTP", keywords: ["btp", "business technology platform"], weight: 4 },
  { category: "IAS", keywords: ["ias", "identity authentication service"], weight: 4 },
  { category: "IPS", keywords: ["ips", "identity provision service"], weight: 4 },
  { category: "IAG", keywords: ["iag", "identity access governance"], weight: 4 },
  { category: "ARM", keywords: ["arm", "access request management"], weight: 4 },
  { category: "ARA", keywords: ["ara", "access risk analysis"], weight: 4 },
  { category: "EAM", keywords: ["eam", "emergency access management", "firefighter"], weight: 4 },
  { category: "BRM", keywords: ["brm", "business role management"], weight: 4 },
  { category: "SAP IDM", keywords: ["sap idm", "identity management"], weight: 4 },
  { category: "Fiori", keywords: ["fiori", "launchpad", "ui5"], weight: 3 },
  { category: "S/4", keywords: ["s/4", "s4", "s/4hana", "s4hana"], weight: 3 },
  { category: "ECC", keywords: ["ecc", "erp"], weight: 3 },
  { category: "BW", keywords: ["bw", "bw/4hana"], weight: 3 },
  { category: "Cloud", keywords: ["cloud", "saas", "paas", "iaas"], weight: 2 },
  { category: "Role Design", keywords: ["role design", "pfcg", "single role", "composite role", "derived role"], weight: 4 },
  { category: "Authorization", keywords: ["authorization", "auth object", "auth field", "authorization object"], weight: 3 },
  { category: "Security", keywords: ["security", "audit", "compliance", "encryption", "sod"], weight: 2 },
  { category: "Performance", keywords: ["performance", "optimization", "st03n", "trace", "slow", "bottleneck"], weight: 3 },
  { category: "Migration", keywords: ["migration", "migrate", "conversion", "brownfield", "greenfield"], weight: 3 },
  { category: "Upgrade", keywords: ["upgrade", "patch", "support package", "spau"], weight: 3 },
  { category: "Scenario", keywords: ["scenario", "case study", "client asks", "customer wants", "use case"], weight: 3 },
  { category: "Comparison", keywords: ["compare", "difference", "vs", "versus", "pros and cons"], weight: 3 },
  { category: "Implementation", keywords: ["implementation", "implement", "step", "customizing", "configure"], weight: 2 },
  { category: "Configuration", keywords: ["config", "configuration", "setting", "spro", "t-code"], weight: 2 },
  { category: "Workflow", keywords: ["workflow", "process flow", "approval"], weight: 2 },
  { category: "Definition", keywords: ["what is", "define", "meaning", "concept"], weight: 2 }
]);

const FOLLOW_UP_PATTERNS = Object.freeze([
  "hmm", "hmmm", "okay", "ok", "yes", "yeah", "exactly", "correct",
  "right", "makes sense", "fair enough", "interesting", "go ahead",
  "continue", "proceed", "tell me more", "can you elaborate", "elaborate",
  "give example", "give an example", "walk me through it", "why", "how",
  "then", "after that", "what happened next", "same issue", "same workflow",
  "same architecture", "same implementation", "this", "that", "it", "those",
  "same", "again", "what about this", "how about that", "can you explain that",
  "what about", "how about"
]);

const CONTEXTUAL_STARTERS = Object.freeze([
  "what about", "how about", "why", "how", "then", "and", "can you", "could you", "what if"
]);

function isGeminiModel(model = "") {
  return model?.toLowerCase?.().startsWith("gemini") || false;
}

function writeSSEChunk(res, text) {
  try {
    if (!res?.writable) {
      return false;
    }
    const chunk = `data: ${JSON.stringify({ text })}\n\n`;
    return res.write(chunk);
  } catch (error) {
    logger?.error?.("Failed to write SSE chunk:", error);
    return false;
  }
}

function writeSSEError(res, errorMessage) {
  try {
    if (!res?.writable) {
      return false;
    }
    const chunk = `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`;
    return res.write(chunk);
  } catch (error) {
    logger?.error?.("Failed to write SSE error:", error);
    return false;
  }
}

function tokenize(text = "") {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

function classifyWeightedIntents(question = "") {
  const tokens = tokenize(question);
  const tokenSet = new Set(tokens);
  const scores = new Map();

  for (const { category, keywords, weight } of CATEGORY_RULES) {
    for (const kw of keywords) {
      if (kw.includes(" ") || kw.includes("/")) {
        if (question.toLowerCase().includes(kw)) {
          scores.set(category, (scores.get(category) || 0) + weight);
        }
      } else if (tokenSet.has(kw)) {
        scores.set(category, (scores.get(category) || 0) + weight);
      }
    }
  }

  if (scores.size === 0) {
    return { primaryCategory: "General", secondaryCategories: [] };
  }

  const sortedIntents = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  return {
    primaryCategory: sortedIntents[0][0],
    secondaryCategories: sortedIntents.slice(1).map(([cat]) => cat)
  };
}

function isFollowUpUtterance(question = "", history = []) {
  const trimmed = question.trim().toLowerCase();
  const normalized = trimmed.replace(/[^\w\s]/g, "");

  if (FOLLOW_UP_PATTERNS.some(p => normalized === p || normalized.startsWith(`${p} `))) {
    return true;
  }

  if (history.length > 0) {
    if (CONTEXTUAL_STARTERS.some(starter => normalized.startsWith(starter))) {
      return true;
    }
    const words = normalized.split(/\s+/);
    if (words.length <= 5) {
      const pronouns = ["this", "that", "it", "those", "same", "again"];
      if (words.some(w => pronouns.includes(w))) {
        return true;
      }
    }
  }

  return false;
}

function extractConversationTopic(history = []) {
  if (history.length === 0) return "";

  const recentHistory = history.slice(-4);
  const topicTokens = new Set();

  for (const item of recentHistory) {
    if (!item?.content) continue;
    const tokens = tokenize(item.content);
    for (const token of tokens) {
      if (token.length > 3) {
        topicTokens.add(token);
      }
    }
  }

  return Array.from(topicTokens).join(" ");
}

function synthesizeRetrievalQuery(question, history) {
  const conversationTopic = extractConversationTopic(history);
  if (!conversationTopic) return question;

  const questionTokens = tokenize(question);
  const topicTokens = tokenize(conversationTopic);

  const newTopicTokens = topicTokens.filter(token => !questionTokens.includes(token));
  if (newTopicTokens.length === 0) return question;

  return `${question} ${newTopicTokens.join(" ")}`.trim();
}

async function fetchKnowledgeContext(question, primaryCategory, secondaryCategories, history) {
  let topK = TOP_K_BY_CATEGORY[primaryCategory] || TOP_K_BY_CATEGORY.General;
  if (secondaryCategories && secondaryCategories.length > 0) {
    const maxSecondaryK = Math.max(
      ...secondaryCategories.map(cat => TOP_K_BY_CATEGORY[cat] || TOP_K_BY_CATEGORY.General)
    );
    topK = Math.max(topK, maxSecondaryK);
  }

  const retrievalQuery = synthesizeRetrievalQuery(question, history);
  const chunks = await searchKnowledge(retrievalQuery, topK);
  if (!chunks || chunks.length === 0) return "";

  const maxChars = APP_CONFIG?.maxContextCharacters || 3000;
  const seenParagraphs = new Set();
  const cleanParagraphs = [];
  let currentLength = 0;

  for (const chunk of chunks) {
    if (!chunk?.content) continue;

    const paragraphs = chunk.content.split(/\n+/);
    for (const rawPara of paragraphs) {
      const para = rawPara.trim();
      if (!para || seenParagraphs.has(para)) continue;

      seenParagraphs.add(para);

      if (currentLength + para.length > maxChars) {
        const remainingChars = maxChars - currentLength;
        if (remainingChars > 100) {
          const sentenceEnd = para.lastIndexOf(".", remainingChars);
          const truncated = sentenceEnd > 0 ? para.slice(0, sentenceEnd + 1) : para.slice(0, remainingChars);
          cleanParagraphs.push(truncated);
        }
        currentLength = maxChars;
        break;
      }

      cleanParagraphs.push(para);
      currentLength += para.length;
    }

    if (currentLength >= maxChars) break;
  }

  return cleanParagraphs.join("\n\n");
}

function prepareConversationHistory(history = []) {
  const validHistory = history.filter(
    item => item?.content && ["user", "assistant"].includes(item.role)
  );

  if (validHistory.length <= MAX_HISTORY_ITEMS) {
    return validHistory;
  }

  const recentHistory = validHistory.slice(-MAX_HISTORY_ITEMS);
  if (recentHistory.length > 0 && recentHistory[0].role === "assistant") {
    const prevIdx = validHistory.length - MAX_HISTORY_ITEMS - 1;
    if (prevIdx >= 0 && validHistory[prevIdx].role === "user") {
      return [validHistory[prevIdx], ...recentHistory];
    }
  }

  return recentHistory;
}

async function streamGeminiResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({
    model,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.05, maxOutputTokens: maxTokens }
  });

  const chat = generativeModel.startChat({
    history: recentHistory.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }]
    }))
  });

  let fullText = "";
  const resultStream = await chat.sendMessageStream(question, { signal });
  for await (const chunk of resultStream.stream) {
    if (signal?.aborted) break;
    const chunkText = chunk.text();
    if (chunkText) {
      writeSSEChunk(res, chunkText);
      fullText += chunkText;
    }
  }
  return fullText;
}

async function streamOpenAIResponse({ apiKey, model, systemPrompt, recentHistory, question, res, signal, maxTokens }) {
  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create(
    {
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: question }
      ]
    },
    { signal }
  );

  let fullText = "";
  for await (const part of stream) {
    if (signal?.aborted) break;
    const text = part.choices[0]?.delta?.content || "";
    if (text) {
      writeSSEChunk(res, text);
      fullText += text;
    }
  }
  return fullText;
}

function setSSEHeaders(res) {
  try {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) {
      res.flushHeaders();
    }
    return true;
  } catch (error) {
    logger?.error?.("Failed to set SSE headers:", error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    apiKey: clientApiKey,
    model: requestedModel,
    question,
    history = [],
    customInstructions,
    candidateResume,
    jobDescription,
    company
  } = req.body || {};

  // Falls back to the configured default (OPENAI_MODEL) when the client doesn't
  // specify one — lets provider/model be set purely through env vars for deployments
  // not driven by the Settings dialog, without any code change.
  const model = requestedModel || APP_CONFIG?.llm?.defaultModel;

  if (!model || !question?.trim()) {
    return res.status(400).json({
      error: "Model and question are required."
    });
  }

  const validationMode = APP_CONFIG?.llm?.validationMode || "retrieval-only";
  const isRetrievalOnly = validationMode !== "full";

  // Client-supplied key (Settings dialog) takes priority; env var is the fallback for
  // deployments running a shared server-side key. Neither is required in
  // retrieval-only mode, since no LLM call is made.
  const envApiKey = isGeminiModel(model) ? APP_CONFIG?.api?.gemini?.apiKey : APP_CONFIG?.api?.openai?.apiKey;
  const apiKey = clientApiKey || envApiKey || "";

  if (!isRetrievalOnly && !apiKey) {
    return res.status(400).json({
      error: "An API key is required for full generation mode — supply one in Settings or configure OPENAI_API_KEY/GEMINI_API_KEY."
    });
  }

  if (!setSSEHeaders(res)) {
    return res.status(500).json({ error: "Failed to initialize streaming response." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let streamStarted = false;

  try {
    const isFollowUp = isFollowUpUtterance(question, history);
    const { primaryCategory, secondaryCategories } = classifyWeightedIntents(question);

    const analysis = analyzeInterviewQuestion(question);
    analysis.category = primaryCategory;
    analysis.secondaryCategories = secondaryCategories;
    analysis.isFollowUp = isFollowUp;

    const reasoningPlan = buildReasoningPlan(question, analysis);
    const sapComponents = selectSapComponents(question, analysis);
    const interviewer = profileInterviewer(question, analysis);
    const technicalReasoning = buildTechnicalReasoning(
      question,
      analysis,
      sapComponents,
      interviewer
    );

    const knowledgeContext = isFollowUp
      ? ""
      : await fetchKnowledgeContext(question, primaryCategory, secondaryCategories, history);

    const promptPayload = {
      question,
      analysis,
      reasoningPlan,
      technicalReasoning,
      interviewer,
      knowledgeContext,
      model,
      sapComponents: technicalReasoning.recommendedComponents
    };

    if (customInstructions?.trim()) promptPayload.customInstructions = customInstructions.trim();
    if (candidateResume?.trim()) promptPayload.candidateResume = candidateResume.trim();
    if (jobDescription?.trim()) promptPayload.jobDescription = jobDescription.trim();
    if (company?.trim()) promptPayload.company = company.trim();

    const systemPrompt = buildSapInterviewPrompt(promptPayload);
    const recentHistory = prepareConversationHistory(history);

    // Ceiling is sized to the question's length tier (see lib/prompt/interviewPrompt.js) —
    // the main lever for keeping generation under the ~5-6s target in a single-pass
    // architecture, since streaming wall-clock time scales with tokens produced.
    const maxTokens = getMaxTokensForCategory(analysis.category);

    const streamOptions = {
      apiKey,
      model,
      systemPrompt,
      recentHistory,
      question,
      res,
      signal: controller.signal,
      maxTokens
    };

    streamStarted = true;

    console.log("========== CHAT DEBUG ==========");
console.log("isRetrievalOnly:", isRetrievalOnly);
console.log("model:", model);
console.log("apiKey exists:", !!apiKey);
console.log("apiKey length:", apiKey ? apiKey.length : 0);
console.log("================================");

    if (isRetrievalOnly) {
      // No LLM call — validates the pipeline up through prompt construction without
      // spending real API tokens. See config/appConfig.js's llm.validationMode.
      const diagnostic = {
        mode: "retrieval-only",
        note: 'No real API call was made (LLM_VALIDATION_MODE is not "full"). This shows what would have been sent.',
        model,
        maxTokens,
        category: analysis.category,
        sapComponents: technicalReasoning.recommendedComponents,
        knowledgeContextChars: knowledgeContext.length,
        knowledgeContextPreview: knowledgeContext.slice(0, 500),
        systemPromptChars: systemPrompt.length
      };
      if (res?.writable) {
        res.write(`event: retrieval_only\ndata: ${JSON.stringify(diagnostic)}\n\n`);
      }
    } else {
      const fullAnswerText = isGeminiModel(model)
        ? await streamGeminiResponse(streamOptions)
        : await streamOpenAIResponse(streamOptions);

      // Post-answer evaluation: pure heuristics, no LLM call, runs only after every
      // content chunk is already on the wire — never delays the spoken answer, and a
      // failure here must never break the already-delivered response.
      try {
        const qualityAnalysis = runPostAnswerEvaluation({
          question,
          answer: fullAnswerText,
          analysis,
          sapComponents: technicalReasoning.recommendedComponents,
          interviewer,
          candidateResume: promptPayload.candidateResume || ""
        });
        if (res?.writable) {
          res.write(`event: analysis\ndata: ${JSON.stringify(qualityAnalysis)}\n\n`);
        }
      } catch (evalError) {
        logger?.error?.("Post-answer evaluation failed (non-fatal):", evalError);
      }
    }

    if (res?.writable) {
      res.write("data: [DONE]\n\n");
    }
  } catch (error) {
    logger?.error?.("Interview Copilot Error:", error);

    const errorMessage = controller.signal.aborted
      ? "Request timed out while generating response."
      : error?.message || "Failed to generate AI response.";

    if (streamStarted && res?.writable) {
      writeSSEError(res, errorMessage);
    } else if (!streamStarted) {
      return res.status(500).json({ error: errorMessage });
    }
  } finally {
    clearTimeout(timeoutId);
    if (res?.writable) {
      res.end();
    }
  }
}