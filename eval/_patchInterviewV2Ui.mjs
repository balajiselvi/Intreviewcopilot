import fs from "fs";

const p = "pages/interview.js";
let c = fs.readFileSync(p, "utf8");

const gateNeedle = `    if (turn.normalizedQuestion) {
      text = String(turn.normalizedQuestion);
    }

    if (turn.decision !== "ANSWER") {`;

const gateReplace = `    if (turn.normalizedQuestion) {
      // Prefer original interrogative wording over "Regarding …" rewrites.
      const normalized = String(turn.normalizedQuestion);
      const originalText = String(text || "").trim();
      if (
        /^(?:what|how|why|when|where|which|who|explain|describe|compare)\\b/i.test(originalText)
        && /^regarding\\b/i.test(normalized)
      ) {
        /* keep originalText */
      } else {
        text = normalized;
      }
    }

    // System Audio / mic auto-submit: do not park technical questions as DEFER.
    const autoSpeechTurn = Boolean(meta.utteranceId) && !meta.manual && source !== "typed";
    const technicalEnough = /\\b(?:SAP|BTP|SCP|IAG|IAS|IPS|GRC|PFCG|Fiori|S\\/?4|HANA|SoD|XSUAA)\\b/i.test(text)
      || /\\b(?:difference|components?|configure|implement|architecture|security)\\b/i.test(text);
    if (autoSpeechTurn && turn.decision === "DEFER" && technicalEnough && String(text || "").trim().split(/\\s+/).length >= 4) {
      turn = { ...turn, decision: "ANSWER", route: "GENERATION", reason: "auto-submit-technical-override" };
    }

    if (turn.decision !== "ANSWER") {`;

if (!c.includes(gateNeedle)) throw new Error("gate needle missing");
c = c.replace(gateNeedle, gateReplace);

const modelNeedle = `        model: currentConfig.aiModel,`;
if (!c.includes(modelNeedle)) throw new Error("model needle missing");
c = c.replace(modelNeedle, `        model: "gpt-4o",`);

const afNeedle = `            if (finalText) {
              streamedResponse = finalText;
              answerFinalLocked = true;
              throttledDispatchSetAIResponseRef.current?.(streamedResponse);
              if (payload?.answerKind) {
                generationMetadata = {
                  ...(generationMetadata || {}),
                  answerKind: payload.answerKind,
                  recovered: Boolean(payload.recovered),
                  recoveryFlag: payload.flag || null
                };
              }
            }`;

const afReplace = `            if (finalText) {
              streamedResponse = finalText;
              answerFinalLocked = true;
              throttledDispatchSetAIResponseRef.current?.(streamedResponse);
              generationMetadata = {
                ...(generationMetadata || {}),
                answerKind: payload?.answerKind || generationMetadata?.answerKind || "v2_validated",
                recovered: false,
                recoveryFlag: null,
                finish_reason: generationMetadata?.finish_reason || "stop"
              };
            }`;

if (!c.includes(afNeedle)) throw new Error("answer_final needle missing");
c = c.replace(afNeedle, afReplace);

const recNeedle = `      // G2 defense-in-depth: never keep a mid-clause answer; recover with a complete spoken answer (never meta-refusal).
      // Skip when answer_final already supplied a post-validation recovery.
      if (!answerFinalLocked && looksIncompleteSpokenAnswer(streamedResponse)) {
        const recovered = buildAskRecoveryText({
          streamedResponse,
          requestQuestion,
          looksIncomplete: looksIncompleteSpokenAnswer,
          buildFallback: buildPrincipleLevelFallback
        });
        if (recovered.ok && recovered.text) {
          streamedResponse = recovered.text;
        }
      }`;

const recReplace = `      // V2: never overwrite streamed / answer_final text with principle-level recovered fallback.
      if (!answerFinalLocked && streamedResponse.trim().length < 40 && looksIncompleteSpokenAnswer(streamedResponse)) {
        const recovered = buildAskRecoveryText({
          streamedResponse,
          requestQuestion,
          looksIncomplete: looksIncompleteSpokenAnswer,
          buildFallback: buildPrincipleLevelFallback
        });
        if (recovered.ok && recovered.text && streamedResponse.trim().length < 40) {
          streamedResponse = recovered.text;
        }
      }`;

if (!c.includes(recNeedle)) throw new Error("recovery needle missing");
c = c.replace(recNeedle, recReplace);

const catchMarker = `showSnackbar("Recovered with a complete spoken answer.", "info");`;
if (!c.includes(catchMarker)) throw new Error("catch marker missing");

const catchStart = c.indexOf("      // Interview-day safe recovery:");
const catchEnd = c.indexOf(catchMarker) + catchMarker.length + "\n      return;".length;
if (catchStart < 0 || catchEnd < catchStart) throw new Error("catch block bounds missing");

const catchReplace = `      // V2: keep substantial streamed / answer_final text. Never replace with principle fallback.
      const streamKeep = String(streamedResponse || "").trim();
      const keepReal = answerFinalLocked || streamKeep.length >= 80;
      let recoveryText = streamKeep;
      if (!keepReal) {
        const recovered = buildAskRecoveryText({
          streamedResponse,
          requestQuestion,
          looksIncomplete: () => true,
          buildFallback: buildPrincipleLevelFallback
        });
        recoveryText = recovered.ok && recovered.text
          ? recovered.text
          : (streamKeep || "I could not finish that answer — please retry the question.");
      }
      if (throttledDispatchSetAIResponseRef.current && typeof throttledDispatchSetAIResponseRef.current.cancel === "function") {
        throttledDispatchSetAIResponseRef.current.cancel();
      }
      dispatch(setAIResponse(recoveryText));
      commitHistory({
        type: "response",
        text: recoveryText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        answerId: \`a_\${Date.now()}\`,
        questionId,
        retryCount,
        source: "copilot",
        status: "completed",
        metrics: { ...responseMetrics(), recovered: keepReal ? false : true },
        analysis: null,
        recovery: keepReal ? false : true
      });
      pendingAnalysisRef.current = null;
      pendingContextRef.current = null;
      setGenerationError(null);
      if (!keepReal) showSnackbar("Recovered with a complete spoken answer.", "info");
      return;`;

c = c.slice(0, catchStart) + catchReplace + c.slice(catchEnd);

fs.writeFileSync(p, c);
console.log("interview.js patched ok");
