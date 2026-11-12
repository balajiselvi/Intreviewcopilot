import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function patch(file, fn) {
  const p = path.join(ROOT, file);
  let c = fs.readFileSync(p, "utf8");
  const next = fn(c);
  if (next === c) throw new Error(`no change: ${file}`);
  fs.writeFileSync(p, next);
  console.log("patched", file);
}

// 1) generationGuard: principle fallback always empty; ladder never emits canned/REMOVED
patch("lib/generationGuard.js", (c) => {
  c = c.replace(
    /function buildPrincipleLevelFallback\(question\) \{[\s\S]*?\n\}/,
    `function buildPrincipleLevelFallback(question) {
  // NUCLEAR: never emit canned principle/hedge recovery text.
  void question;
  return "";
}`
  );

  c = c.replace(
    /  const principle = usable\(buildPrincipleLevelFallback\(question\)\);\n  if \(principle\) \{\n    return pack\(\{[\s\S]*?answerKind: "recovered_principle",[\s\S]*?\}\);\n  \}\n\n  return pack\(\{\n    answer:\n      "REMOVED",\n    recovered: true,\n    flag: "empty_fallback_hardcoded",\n    answerKind: "recovered_hardcoded",\n    rejectedProcedureReason,\n    rejectedPreStripReason\n  \}\);/,
    `  // NUCLEAR: never replace LLM output with principle/hardcoded canned text.
  void buildPrincipleLevelFallback;
  return pack({
    answer: "",
    recovered: false,
    flag: "empty_no_canned_fallback",
    answerKind: "validated",
    rejectedProcedureReason,
    rejectedPreStripReason
  });`
  );
  if (c.includes('"REMOVED"') || /define the control at the correct identity/.test(c)) {
    throw new Error("generationGuard still has REMOVED or banned phrase");
  }
  return c;
});

// 2) answerIntegrityGate: inability hedge → empty (anti-refusal contract)
patch("lib/answerIntegrityGate.js", (c) => {
  c = c.replace(
    /function buildInabilitySpokenAnswer\(question = ""\) \{[\s\S]*?\n\}/,
    `function buildInabilitySpokenAnswer(question = "") {
  // NUCLEAR: never emit inability/hedge spoken lines into the UI.
  void question;
  return "";
}`
  );
  return c;
});

// 3) interview.js: stop sending localStorage weak systemPrompt / customInstructions
patch("pages/interview.js", (c) => {
  if (!c.includes("customInstructions: currentConfig.gptSystemPrompt")) {
    // already cleaned
    console.log("interview.js customInstructions already cleaned");
    return c;
  }
  c = c.replace(
    /        model: "gpt-4o",\n        question: text,\n        history: conversationHistoryForAPI,\n        responseLength: currentConfig.responseLength \|\| "medium",\n        customInstructions: currentConfig.gptSystemPrompt,\n/,
    `        model: "gpt-4o",\n        question: text,\n        history: conversationHistoryForAPI,\n        responseLength: "medium",\n`
  );
  return c;
});

console.log("OK");
