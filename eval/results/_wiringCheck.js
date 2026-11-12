const fs = require("fs");
const chat = fs.readFileSync("pages/api/chat.js", "utf8");
const prompt = fs.readFileSync("lib/prompt/interviewPrompt.js", "utf8");
const out = {
  chatImportsBuilder: /import\s*\{\s*buildSapInterviewPrompt/.test(chat),
  chatBuildsSystemPrompt: chat.includes("const systemPrompt = buildSapInterviewPrompt(promptPayload)"),
  chatPassesSystemPromptArg: /systemPrompt,/.test(chat),
  chatGeminiUsesSystemPrompt: chat.includes("systemInstruction: { parts: [{ text: systemPrompt }] }"),
  chatClaudeUsesSystemPrompt: chat.includes("system: systemPrompt"),
  chatOpenAiSystemMessage: /role:\s*["']system["']/.test(chat) && /content:\s*systemPrompt/.test(chat),
  verifiedBeforePrompt:
    chat.indexOf("selectVerifiedWorkflow(question)") >= 0 &&
    chat.indexOf("selectVerifiedWorkflow(question)") < chat.indexOf("const systemPrompt = buildSapInterviewPrompt(promptPayload)"),
  maxTokens2048: chat.includes("const maxTokens = 2048"),
  builderExports: /export function buildSapInterviewPrompt/.test(prompt),
  operatingContractInBuilder: prompt.includes("INTERVIEW COPILOT V2.1 OPERATING CONTRACT"),
  workflowFirstInBuilder: prompt.includes("WORKFLOW-FIRST"),
  fivePointInBuilder: prompt.includes("5-POINT TECHNICAL STRUCTURE"),
  forbidGrfcp2InBuilder: prompt.includes("GRFCP2")
};
console.log(JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) {
  if (!v) process.exitCode = 1;
}
