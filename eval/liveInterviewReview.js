/**
 * Deterministic review of the captured live interview.
 * Classifications come from the admission rules. Counts are not hard-coded.
 *
 * Usage: node eval/liveInterviewReview.js
 */
const fs = require("fs");
const path = require("path");
const { decideInterviewTurn } = require("../lib/turnDecision.js");
const { scopeCareerEvidence, auditHistoricalClaims } = require("./lib/careerTimeline.js");

const CAPTURE = path.join(__dirname, "captures", "live-interview-qa.json");
const SESSION_PREFIX = "live_mudq2g8e";

function loadSession() {
  const capture = JSON.parse(fs.readFileSync(CAPTURE, "utf8"));
  const session = (capture.sessions || []).find((item) => String(item.sessionId || "").startsWith(SESSION_PREFIX));
  if (!session) throw new Error(`Session ${SESSION_PREFIX} not found`);
  return session;
}

function reviewSession(session) {
  const history = [];
  return (session.turns || []).map((turn, index) => {
    const decision = decideInterviewTurn({ question: turn.question, history });
    const prior = [...history].reverse().find((item) => item.disposition === "ANSWER");
    const evidence = scopeCareerEvidence(turn.question, prior?.text || "");
    const unsupported = auditHistoricalClaims(turn.answer || "", evidence.text);
    const row = {
      turn: index + 1,
      transcript: String(turn.question || "").replace(/\s+/g, " ").trim(),
      classification: decision.decision === "ANSWER" ? "SHOULD_ANSWER" : decision.decision === "DEFER" ? "AMBIGUOUS" : "SHOULD_NOT_ANSWER",
      gate: decision.decision,
      reason: decision.reason,
      route: decision.route,
      scriptId: decision.scriptId,
      evidenceMode: evidence.mode,
      programmeId: evidence.programmeId,
      answerGenerated: Boolean(String(turn.answer || "").trim()),
      unsupportedClaims: unsupported,
      historicalClaims: unsupported.map((claim) => classifyHistoricalClaim(claim, turn.answer, evidence.text, decision)),
      currentReproduction: currentReproduction(decision, unsupported, evidence.text)
    };
    history.push({ type: "question", text: turn.question, disposition: decision.decision });
    return row;
  });
}

function claimPattern(claim) {
  const body = String(claim.split(":").slice(1).join(":") || "").replace(/,/g, "").toLowerCase();
  const number = body.match(/\d+/);
  if (number) return new RegExp(`\\b${number[0]}\\b`);
  const region = body.match(/\b(india|dubai|uae|qatar|canada|europe|asia|germany|singapore|australia|america)\b/);
  return region ? new RegExp(`\\b${region[1]}\\b`) : null;
}

function classifyHistoricalClaim(claim, answer, evidenceText, decision) {
  const evidence = String(evidenceText || "").replace(/,/g, "").toLowerCase();
  const script = String(decision.scriptAnswer || "").replace(/,/g, "").toLowerCase();
  const pattern = claimPattern(claim);
  return {
    claim,
    inCurrentEvidence: Boolean(pattern && pattern.test(evidence)),
    inPreparedScript: Boolean(pattern && pattern.test(script))
  };
}

function currentReproduction(decision, claims, evidenceText) {
  if (!claims.length) return "none";
  if (decision.decision !== "ANSWER") return "prevented-no-generation";
  const source = decision.route === "PREPARED_SCRIPT"
    ? String(decision.scriptAnswer || "")
    : String(evidenceText || "");
  const present = claims.filter((claim) => {
    const pattern = claimPattern(claim);
    return pattern && pattern.test(source.replace(/,/g, "").toLowerCase());
  });
  if (decision.route === "PREPARED_SCRIPT") {
    return present.length ? "still-in-prepared-script" : "prevented-prepared-script";
  }
  return present.length ? "claim-still-in-evidence" : "evidence-omits-claim";
}

function summarize(rows) {
  const count = (gate) => rows.filter((row) => row.gate === gate).length;
  const answers = rows.filter((row) => row.gate === "ANSWER");
  const evidence = {};
  for (const row of answers) {
    const key = row.programmeId ? `named:${row.programmeId}` : (row.evidenceMode || "unscoped");
    evidence[key] = (evidence[key] || 0) + 1;
  }
  const preparedScript = answers.filter((row) => row.route === "PREPARED_SCRIPT").length;
  const normalGeneration = answers.filter((row) => row.route === "GENERATION").length;
  return {
    turns: rows.length,
    disposition: {
      answer: count("ANSWER"),
      ignore: count("IGNORE"),
      defer: count("DEFER")
    },
    answerRoute: {
      preparedScript,
      normalGeneration
    },
    evidenceScope: evidence,
    answeredInCapture: rows.filter((row) => row.answerGenerated).length,
    historicalUnsupportedOnAnsweredTurns: answers.filter((row) => row.unsupportedClaims.length).length,
    currentReproduction: {
      preventedNoGeneration: rows.filter((row) => row.currentReproduction === "prevented-no-generation").length,
      preventedPreparedScript: rows.filter((row) => row.currentReproduction === "prevented-prepared-script").length,
      evidenceOmitsClaim: rows.filter((row) => row.currentReproduction === "evidence-omits-claim").length,
      claimStillInEvidence: rows.filter((row) => row.currentReproduction === "claim-still-in-evidence").length,
      stillInPreparedScript: rows.filter((row) => row.currentReproduction === "still-in-prepared-script").length
    }
  };
}

function main() {
  const session = loadSession();
  const rows = reviewSession(session);
  const summary = summarize(rows);
  console.log(JSON.stringify(summary, null, 2));
  for (const row of rows) {
    const claim = row.unsupportedClaims.length ? ` unsupported=${row.unsupportedClaims.join(",")}` : "";
    const script = row.scriptId ? ` script=${row.scriptId}` : "";
    console.log(
      `${String(row.turn).padStart(2, "0")} ${row.gate.padEnd(6)} ${row.reason.padEnd(26)} ${row.evidenceMode || "-"}${script}${claim} | ${row.transcript.slice(0, 110)}`
    );
  }
  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "live-interview-review.json"), JSON.stringify({ summary, rows }, null, 2));
}

if (require.main === module) main();

module.exports = { reviewSession, summarize, loadSession };
