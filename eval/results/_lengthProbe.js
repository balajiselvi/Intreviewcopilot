const { APP_BASE_URL } = require("../lib/env");

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

async function ask(responseLength, question, history = [], sessionId = "len_probe") {
  const res = await fetch(`${APP_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      question,
      responseLength,
      history,
      interviewSessionId: sessionId
    })
  });
  const text = await res.text();
  const events = [];
  for (const block of text.split("\n\n")) {
    const data = block.split("\n").filter((line) => line.startsWith("data: ")).map((line) => line.slice(6)).join("");
    if (!data || data === "[DONE]") continue;
    try { events.push(JSON.parse(data)); } catch { /* non-json */ }
  }
  const admission = events.find((event) => event.route) || {};
  const generation = events.find((event) => event.finish_reason != null || (event.maxTokens != null && !event.route)) || {};
  const answer = events.map((event) => event.text || "").join("").trim();
  return {
    requested: responseLength,
    effective: admission.responseLength || null,
    status: res.status,
    route: admission.route || null,
    maxTokens: generation.maxTokens ?? admission.maxTokens ?? null,
    finish: generation.finish_reason ?? null,
    words: words(answer),
    heading: /direct answer|technical mechanism|validation and operational boundary|key takeaways/i.test(answer),
    answer
  };
}

(async () => {
  const generatedQuestion = "When two sponsors disagree about security scope and the test window is already full, how do you decide what risk to accept?";
  const procedureQuestion = "If the user cannot access a Fiori app, how do you troubleshoot?";
  const modes = ["concise", "medium", "lengthy"];
  const generated = {};
  const procedure = {};
  for (const mode of modes) {
    generated[mode] = await ask(mode, generatedQuestion, [], `len_gen_${mode}`);
    procedure[mode] = await ask(mode, procedureQuestion, [], `len_proc_${mode}`);
  }
  const invalid = await ask("interview", generatedQuestion, [], "len_gen_invalid");
  const summary = {
    generated: Object.fromEntries(modes.map((mode) => [mode, {
      requested: generated[mode].requested,
      effective: generated[mode].effective,
      route: generated[mode].route,
      maxTokens: generated[mode].maxTokens,
      finish: generated[mode].finish,
      words: generated[mode].words,
      heading: generated[mode].heading
    }])),
    procedure: Object.fromEntries(modes.map((mode) => [mode, {
      requested: procedure[mode].requested,
      effective: procedure[mode].effective,
      route: procedure[mode].route,
      words: procedure[mode].words,
      heading: procedure[mode].heading,
      hasPublic: /Public Edition/i.test(procedure[mode].answer),
      hasPfcg: /PFCG/.test(procedure[mode].answer),
      hasSu53: /SU53/.test(procedure[mode].answer),
      hasTask: /business task/i.test(procedure[mode].answer)
    }])),
    invalidEffective: invalid.effective,
    invalidMaxTokens: invalid.maxTokens
  };
  console.log(JSON.stringify(summary, null, 2));
  console.log("\nCONCISE\n" + generated.concise.answer);
  console.log("\nLENGTHY\n" + generated.lengthy.answer);
  if (generated.concise.effective !== "concise" || generated.lengthy.effective !== "lengthy" || generated.medium.effective !== "medium") {
    throw new Error("saved response length did not reach the generation admission event");
  }
  if (!(generated.concise.maxTokens < generated.medium.maxTokens && generated.medium.maxTokens < generated.lengthy.maxTokens)) {
    throw new Error("response length did not change the generation ceiling");
  }
  if (invalid.maxTokens !== generated.medium.maxTokens || invalid.effective !== "medium") {
    throw new Error("invalid length did not fall back to medium");
  }
  if (generated.concise.heading || generated.medium.heading || generated.lengthy.heading) {
    throw new Error("generated answer used a report heading");
  }
  if (!(generated.concise.words > 0 && generated.concise.words < generated.medium.words && generated.medium.words < generated.lengthy.words)) {
    throw new Error(`word counts did not increase with the setting: concise ${generated.concise.words}, medium ${generated.medium.words}, lengthy ${generated.lengthy.words}`);
  }
  for (const mode of modes) {
    const row = summary.procedure[mode];
    if (row.effective !== mode) throw new Error(`procedure path did not receive ${mode}`);
    if (row.heading) throw new Error(`procedure ${mode} used a heading`);
    if (!row.hasPublic || !row.hasPfcg || !row.hasSu53 || !row.hasTask) {
      throw new Error(`procedure ${mode} dropped a required distinction`);
    }
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
