/**
 * Nuclear purge: remove client recovered overwrite paths; force V2 prompt/model wiring.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- interview.js: strip ALL principle-fallback recovery ---
{
  const p = path.join(ROOT, "pages", "interview.js");
  let c = fs.readFileSync(p, "utf8");

  // Drop unused import of buildPrincipleLevelFallback / looksIncomplete if we remove uses
  c = c.replace(
    /import \{ buildPrincipleLevelFallback, classifyGenerationFailure, looksIncompleteSpokenAnswer \} from '\.\.\/lib\/generationGuard';/,
    "import { classifyGenerationFailure } from '../lib/generationGuard';"
  );
  c = c.replace(
    /import \{ buildAskRecoveryText, normalizeRequestQuestion \} from '\.\.\/lib\/askOpenAIRequestScope';/,
    "import { normalizeRequestQuestion } from '../lib/askOpenAIRequestScope';"
  );

  // Remove post-stream recovery block entirely
  c = c.replace(
    /\n\s*\/\/ V2: never overwrite streamed[\s\S]*?streamedResponse = recovered\.text;\s*\}\s*\}\s*\n/,
    "\n"
  );

  // Replace catch recovery with keep-stream-or-retry (no principle fallback, no recovered badge)
  const catchStart = c.indexOf("      // V2: keep substantial streamed");
  const catchAlt = c.indexOf("      // Interview-day safe recovery:");
  const start = catchStart >= 0 ? catchStart : catchAlt;
  if (start < 0) throw new Error("catch block not found");
  const returnIdx = c.indexOf("\n      return;\n    } finally {", start);
  if (returnIdx < 0) throw new Error("catch return not found");
  const catchReplace = `      // NUCLEAR: never replace LLM output with canned recovered fallback. Keep stream or ask retry.
      const streamKeep = String(streamedResponse || "").trim();
      const keepReal = answerFinalLocked || streamKeep.length >= 40;
      const finalText = keepReal
        ? streamKeep
        : "Generation was interrupted before a complete answer arrived. Please retry the question.";
      if (throttledDispatchSetAIResponseRef.current && typeof throttledDispatchSetAIResponseRef.current.cancel === "function") {
        throttledDispatchSetAIResponseRef.current.cancel();
      }
      dispatch(setAIResponse(finalText));
      commitHistory({
        type: "response",
        text: finalText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        answerId: \`a_\${Date.now()}\`,
        questionId,
        retryCount,
        source: "copilot",
        status: "completed",
        metrics: { ...responseMetrics(), recovered: false },
        analysis: null,
        recovery: false
      });
      pendingAnalysisRef.current = null;
      pendingContextRef.current = null;
      setGenerationError(keepReal ? null : { retryable: true, userMessage: "Please retry the question.", question: requestQuestion, source });
      if (!keepReal) showSnackbar("Answer incomplete — please retry.", "warning");
      return;`;
  c = c.slice(0, start) + catchReplace + c.slice(returnIdx);

  // Remove recovered badge permanently
  c = c.replace(/\{item\.recovery \? " · recovered" : ""\}/g, "");

  // Force model gpt-4o (idempotent)
  c = c.replace(/model:\s*currentConfig\.aiModel,/g, 'model: "gpt-4o",');

  fs.writeFileSync(p, c);
  console.log("interview.js purged", {
    hasFallbackImport: c.includes("buildPrincipleLevelFallback"),
    hasRecoveredBadge: c.includes("· recovered"),
    hasAskRecovery: c.includes("buildAskRecoveryText")
  });
}

// --- serveV2Chat: always gpt-4o ---
{
  const p = path.join(ROOT, "lib", "v2Core", "serveV2Chat.js");
  let c = fs.readFileSync(p, "utf8");
  c = c.replace(
    /const requested = String\(model \|\| ""\)\.trim\(\);[\s\S]*?const finalModel = \/gpt-4o\/i\.test\(useModel\) \? useModel : V2_MODEL;/,
    `// HARD LOCK: ignore browser localStorage model (gpt-4o-mini) and always use gpt-4o.
  const finalModel = V2_MODEL;
  void model;`
  );
  fs.writeFileSync(p, c);
  console.log("serveV2Chat hard-locked gpt-4o");
}

// --- pipeline temperature 0.25 ---
{
  const p = path.join(ROOT, "lib", "v2Core", "pipeline.js");
  let c = fs.readFileSync(p, "utf8");
  c = c.replace(/temperature:\s*0\.2/, "temperature: 0.25");
  fs.writeFileSync(p, c);
  console.log("pipeline temperature -> 0.25");
}

// --- llmProvider default temp 0.25 ---
{
  const p = path.join(ROOT, "lib", "v2Core", "llmProvider.js");
  let c = fs.readFileSync(p, "utf8");
  c = c.replace(/const DEFAULT_TEMPERATURE = 0\.2;/, "const DEFAULT_TEMPERATURE = 0.25;");
  fs.writeFileSync(p, c);
  console.log("llmProvider temperature -> 0.25");
}

console.log("nuclear purge complete");
