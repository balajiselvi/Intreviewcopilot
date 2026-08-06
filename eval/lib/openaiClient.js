const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("./env");

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not found in .env.local — required for eval pipeline (Critic/Improver/Judge).");
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const JUDGE_MODEL = "gpt-4o-mini";

async function chatJSON({ system, user, temperature = 0 }) {
  const res = await client.chat.completions.create({
    model: JUDGE_MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  const content = res.choices[0].message.content;
  return JSON.parse(content);
}

module.exports = { client, chatJSON, JUDGE_MODEL };
