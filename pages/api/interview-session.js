import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { appendQa } = require("../../lib/interviewSessionStore.js");

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  try {
    const body = req.body || {};
    const result = appendQa(
      body.interviewSessionId,
      { source: "live-interview", company: String(body.company || "").slice(0, 80) },
      {
        question: body.question,
        answerShown: "",
        status: body.disposition || "withheld",
        disposition: body.disposition || "",
        route: "NONE",
        source: "admission",
        errorCode: body.reason || "",
        latencyMs: 0
      }
    );
    return res.status(200).json({ ok: Boolean(result && result.ok) });
  } catch (error) {
    return res.status(200).json({ ok: false });
  }
}
