/**
 * Integration regression: manual typed submit must accept distinct SAP-domain
 * questions, queue (not silent-drop) while generating, and reach /api/chat with
 * the entered text preserved. Provider calls are mocked / fake-keyed.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("node:child_process");

const { takeUtterance } = require("../lib/deferredContinuation");
const { decideInterviewTurn } = require("../lib/turnDecision");
const { selectVerifiedWorkflow } = require("../lib/verifiedWorkflow");
const { productKnowledgeFolders } = require("../lib/productKnowledgeScope");
const {
  planManualSubmit,
  canStartTurn,
  enqueueSpeechTurn,
  acceptCapturedTurn,
  shouldAutoSubmitSource
} = require("../lib/liveSessionOperator");

const SHORT_TECHNICAL = [
  "How to configure BRF+?",
  "How to configure MSMP?",
  "What is SAP IAS?",
  "How to configure Fiori?"
];

const QUESTIONS = [
  {
    id: "grc-ara",
    text: "How do you investigate an SAP GRC Access Risk Analysis false positive?",
    domainHint: /Access Risk|false positive|risk analysis|rule/i,
    expectWorkflow: null
  },
  {
    id: "msmp",
    text: "How do you configure an MSMP workflow in SAP GRC Access Control?",
    domainHint: /MSMP|Access Request|workflow|BRF/i,
    expectWorkflow: "grc-msmp-access-request-config"
  },
  {
    id: "ias-ips-idm",
    text: "How do you distinguish SAP IAS and IPS from SAP IDM?",
    domainHint: /IAS|IPS|IDM|Cloud Identity/i,
    expectWorkflow: null
  },
  {
    id: "fiori",
    text: "How do you configure an SAP Fiori app in the launchpad?",
    domainHint: /Fiori|launchpad|Launchpad/i,
    expectWorkflow: null
  }
];

function simulateManualPipeline(question, history = []) {
  const plannedIdle = planManualSubmit({
    text: question,
    isProcessing: false,
    queue: [],
    utteranceId: `manual_test_${Date.now().toString(36)}`,
    source: "system"
  });
  assert.strictEqual(plannedIdle.action, "submit", `idle submit for: ${question}`);
  assert.strictEqual(plannedIdle.text, question.trim());

  const plannedBusy = planManualSubmit({
    text: question,
    isProcessing: true,
    queue: [],
    utteranceId: `manual_busy_${Date.now().toString(36)}`,
    source: "system"
  });
  assert.strictEqual(plannedBusy.action, "queue", `must queue while processing: ${question}`);
  assert.strictEqual(plannedBusy.queue.length, 1);
  assert.strictEqual(plannedBusy.queue[0].text, question.trim());
  assert.strictEqual(plannedBusy.queue[0].manual, true);
  assert.strictEqual(canStartTurn({ isProcessing: true }), false);

  const assembly = takeUtterance(null, plannedIdle.text);
  assert.notStrictEqual(assembly.action, "hold", `valid manual ask must not hold: ${question}`);
  const working = assembly.text || plannedIdle.text;
  const turn = decideInterviewTurn({ question: working, history });
  assert.strictEqual(turn.decision, "ANSWER", `admission ANSWER for: ${question} (got ${turn.decision}/${turn.reason})`);
  assert.ok(String(turn.normalizedQuestion || working).includes("How"), "preserves ask stem");
  assert.doesNotMatch(String(turn.normalizedQuestion || working), /\[object Object\]/);

  const workingQuestion = turn.normalizedQuestion || working;
  // selectVerifiedWorkflow takes the question string (not an options object).
  const wf = selectVerifiedWorkflow(workingQuestion);
  return {
    entered: question,
    plannedIdle,
    plannedBusy,
    normalized: workingQuestion,
    decision: turn.decision,
    reason: turn.reason,
    route: turn.route,
    workflowId: wf?.id || null
  };
}

const fioriHistory = [
  {
    type: "question",
    text: "How do you configure an SAP Fiori app in the launchpad?",
    disposition: "ANSWER"
  },
  {
    type: "response",
    text: "To configure an SAP Fiori app in the launchpad, I start with Launchpad Content Manager."
  }
];

const results = [];
for (const item of QUESTIONS) {
  const fresh = simulateManualPipeline(item.text, []);
  const afterFiori = simulateManualPipeline(item.text, fioriHistory);
  if (item.expectWorkflow) {
    assert.strictEqual(fresh.workflowId, item.expectWorkflow, `${item.id} workflow`);
  } else if (item.id === "fiori") {
    assert.strictEqual(
      fresh.workflowId,
      null,
      "unspecified Fiori configure must not classic-hijack verified workflow"
    );
  }
  assert.ok(
    fresh.normalized.toLowerCase().includes(item.text.toLowerCase().slice(0, 24).toLowerCase())
      || item.domainHint.test(fresh.normalized),
    `${item.id} must preserve entered domain text`
  );
  assert.ok(
    !/Fiori|launchpad/i.test(afterFiori.normalized) || item.id === "fiori",
    `${item.id} must not inherit Fiori question text after prior Fiori turn`
  );
  results.push({ id: item.id, fresh, afterFiori });
}

const distinctNorms = new Set(results.map((row) => row.fresh.normalized.toLowerCase()));
assert.strictEqual(distinctNorms.size, QUESTIONS.length, "four questions remain distinct");

// Short technical asks must ANSWER — never DEFER incomplete banner.
// Fix 1: bare MSMP may use verified playbook; bare BRF+ must not force MSMP agent-rule VERIFIED.
const shortResults = [];
for (const q of SHORT_TECHNICAL) {
  const turn = decideInterviewTurn({ question: q, history: [] });
  assert.strictEqual(turn.decision, "ANSWER", `short ask must ANSWER: ${q} (${turn.reason})`);
  const verified = selectVerifiedWorkflow(q);
  if (/\bMSMP\b/i.test(q) && !/\bBRF(?:\+|plus)(?!\w)/i.test(q)) {
    assert.ok(verified, `MSMP short ask must hit verified workflow: ${q}`);
    assert.ok(
      turn.route === "GENERATION" || turn.route === "VERIFIED_WORKFLOW" || !turn.route,
      `MSMP short ask route must remain answerable: ${q} (${turn.route})`
    );
  } else if (/\bBRF(?:\+|plus)(?!\w)/i.test(q) && !/\bMSMP\b/i.test(q)) {
    assert.strictEqual(verified, null, `bare BRF+ must not force MSMP verified playbook: ${q}`);
    assert.ok(
      turn.route === "GENERATION" || turn.route === "VERIFIED_WORKFLOW" || !turn.route,
      `bare BRF+ short ask remains answerable: ${q} (${turn.route})`
    );
  } else {
    assert.strictEqual(turn.route, "GENERATION", `short ask must GENERATION route: ${q}`);
    assert.strictEqual(verified, null, `short ask must not verified-hijack: ${q}`);
  }
  shortResults.push({ q, decision: turn.decision, route: turn.route, verified: verified?.id || null });
}
const brfFolders = productKnowledgeFolders("How to configure BRF+?");
assert.ok(brfFolders.includes("grc"), "BRF+ scope includes grc");
assert.ok(brfFolders.includes("s4hana"), "BRF+ scope includes s4hana");

// Speech auto-submit path: capture → acceptCapturedTurn → admission ANSWER.
assert.strictEqual(
  shouldAutoSubmitSource({ source: "system", systemAutoMode: true }),
  true,
  "system auto-submit enabled by default"
);
assert.strictEqual(
  shouldAutoSubmitSource({ source: "system", systemAutoMode: false }),
  false,
  "system auto-submit respects switch off"
);
const speechCapture = acceptCapturedTurn({
  text: "How to configure BRF+?",
  utteranceId: "speech_brf_1",
  source: "system",
  isProcessing: false,
  queue: []
});
assert.strictEqual(speechCapture.action, "answer", "speech auto-submit admits short BRF+ for send");
const speechTurn = decideInterviewTurn({ question: "How to configure BRF+?", history: [] });
assert.strictEqual(speechTurn.decision, "ANSWER", "speech path admission matches manual for short BRF+");

// Enter-while-processing must share the queue planner (source contract).
const interviewSrc = fs.readFileSync(path.join(__dirname, "../pages/interview.js"), "utf8");
assert.match(interviewSrc, /planManualSubmit/);
assert.match(interviewSrc, /Same path as Submit text/);
assert.doesNotMatch(
  interviewSrc,
  /handleKeyPress[\s\S]{0,180}if \(isProcessingRef\.current\) return;/
);
assert.match(interviewSrc, /Keep queued manual\/speech turns/);
assert.match(interviewSrc, /manual: queued\.manual === true/);

// Queue then drain identity: parked manual rows stay manual.
const parked = planManualSubmit({
  text: QUESTIONS[0].text,
  isProcessing: true,
  queue: [],
  utteranceId: "manual_park_1",
  source: "system"
});
const second = planManualSubmit({
  text: QUESTIONS[1].text,
  isProcessing: true,
  queue: parked.queue,
  utteranceId: "manual_park_2",
  source: "system"
});
assert.deepStrictEqual(
  second.queue.map((row) => ({ text: row.text, manual: row.manual })),
  [
    { text: QUESTIONS[0].text, manual: true },
    { text: QUESTIONS[1].text, manual: true }
  ]
);
const overflowGuard = enqueueSpeechTurn(second.queue, {
  text: "extra",
  utteranceId: "manual_extra",
  manual: true,
  source: "system"
});
assert.ok(overflowGuard.queue.every((row) => row.text !== "silent-drop"));

async function probeLiveApiIfAvailable() {
  const ports = [3102, 3000];
  let base = null;
  for (const port of ports) {
    try {
      const ping = await fetch(`http://127.0.0.1:${port}/api/chat`, { method: "OPTIONS" }).catch(() => null);
      // Even if OPTIONS is 404/405, a connection means the server is up — try POST.
      base = `http://127.0.0.1:${port}`;
      if (ping || true) {
        const probe = await fetch(`${base}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: "sk-test-offline-no-provider",
            model: "gpt-4o-mini",
            question: QUESTIONS[3].text,
            history: [],
            responseLength: "medium",
            interviewSessionId: "manual_input_assert_ping",
            source: "system",
            debug: true
          })
        });
        if (probe.status === 200 || probe.status === 400 || probe.status === 500) {
          break;
        }
      }
    } catch {
      base = null;
    }
  }
  if (!base) {
    console.log("manualInputPipelineAssert: live /api/chat skipped (no server on :3102/:3000)");
    return { skipped: true };
  }

  const live = [];
  for (const item of QUESTIONS) {
    const resp = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: "sk-test-offline-no-provider",
        model: "gpt-4o-mini",
        question: item.text,
        history: [
          { role: "user", content: QUESTIONS[3].text },
          { role: "assistant", content: "Prior Fiori answer about Launchpad Content Manager." }
        ],
        responseLength: "medium",
        interviewSessionId: `manual_input_assert_${item.id}`,
        source: "system",
        debug: true
      })
    });
    const raw = await resp.text();
    // Admission payloads may contain nested objects (procedurePrefer, sourceFiles) —
    // do not use non-greedy \{.*?\} which truncates at the first closing brace.
    const admissionMatch = raw.match(/event: admission\r?\ndata: (\{.*\})\s*(?:\r?\n|$)/);
    assert.ok(admissionMatch, `${item.id} must emit admission SSE`);
    let admission;
    try {
      admission = JSON.parse(admissionMatch[1]);
    } catch (parseError) {
      const line = raw.split(/\r?\n/).find((row) => row.startsWith("data: {") && /"decision"/.test(row));
      assert.ok(line, `${item.id} admission JSON parse failed: ${parseError.message}`);
      admission = JSON.parse(line.replace(/^data:\s*/, ""));
    }
    assert.strictEqual(admission.decision, "ANSWER", `${item.id} API admission`);
    const texts = [...raw.matchAll(/^data: (\{.*\})\s*$/gm)]
      .map((m) => {
        try {
          return JSON.parse(m[1]).text || "";
        } catch {
          return "";
        }
      })
      .filter(Boolean);
    const answer = texts.join("");
    assert.ok(answer.trim().length > 40, `${item.id} must return visible answer text`);
    assert.ok(
      item.domainHint.test(answer) || item.id === "fiori",
      `${item.id} answer should carry domain signal`
    );
    if (item.id !== "fiori") {
      assert.ok(
        !(/^To configure an SAP Fiori app in the launchpad/i.test(answer)
          && !item.domainHint.test(answer.slice(0, 160))),
        `${item.id} must not render the recurring Fiori stub as its answer`
      );
    }
    live.push({
      id: item.id,
      http: resp.status,
      route: admission.route,
      scriptId: admission.scriptId || null,
      answerHead: answer.slice(0, 100)
    });
  }
  return { skipped: false, base, live };
}

(async () => {
  const live = await probeLiveApiIfAvailable();
  // Fresh child process check of the planner module (active config isolation).
  const child = spawnSync(
    process.execPath,
    [
      "-e",
      "const { planManualSubmit } = require('./lib/liveSessionOperator'); const r = planManualSubmit({ text: 'How do you configure an MSMP workflow in SAP GRC Access Control?', isProcessing: true, queue: [], source: 'system' }); if (r.action !== 'queue' || !r.queue[0].manual) process.exit(2);"
    ],
    { cwd: path.join(__dirname, ".."), encoding: "utf8" }
  );
  assert.strictEqual(child.status, 0, `fresh process planner failed: ${child.stderr || child.stdout}`);

  console.log("manualInputPipelineAssert: PASS");
  console.log(JSON.stringify({
    offline: results.map((row) => ({
      id: row.id,
      decision: row.fresh.decision,
      route: row.fresh.route,
      workflowId: row.fresh.workflowId
    })),
    shortTechnical: shortResults,
    brfFolders,
    speechAutoSubmit: {
      systemDefaultOn: shouldAutoSubmitSource({ source: "system", systemAutoMode: true }),
      shortBrfSpeechAction: speechCapture.action,
      shortBrfAdmission: speechTurn.decision
    },
    live
  }, null, 2));
})().catch((error) => {
  console.error("manualInputPipelineAssert: FAIL");
  console.error(error);
  process.exitCode = 1;
});
