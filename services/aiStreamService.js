import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export async function streamAiResponse({ res, apiKey, model, systemPrompt, history, question, retrievedContext }) {
  const selectedModel = model || 'gemini-1.5-flash';
  const isGemini = selectedModel.toLowerCase().startsWith('gemini');

  if (isGemini) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: systemPrompt,
    });

    const userMessageText = `Interview Question:\n${question}\n\nRelevant SAP GRC Knowledge:\n${retrievedContext || "No matching knowledge found."}`;

    const contents = [
      ...(history || []).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: userMessageText }] }
    ];

    const resultStream = await geminiModel.generateContentStream({ contents });

    for await (const chunk of resultStream.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
  } else {
    const openai = new OpenAI({ apiKey });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      {
        role: 'user',
        content: `Interview Question:\n${question}\n\nRelevant SAP GRC Knowledge:\n${retrievedContext || "No matching knowledge found."}`
      }
    ];

    const stream = await openai.chat.completions.create({
      model: selectedModel || 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0.2,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
  }
}
