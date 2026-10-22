/**
 * Session-level illustrative timeline.
 * Not knowledge, not the candidate's history, and not a second model call.
 * The stored assumption is what later turns in the same scenario must reuse.
 */

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, eighteen: 18, twenty: 20, twentyfour: 24
};

const CONTINUITY = /\b(this|that|the same|established|the plan|the timeline|the programme|the program|the schedule|the cutover|the go-live|this implementation|this project|we discussed|you described|that plan|the hypercare|in the plan)\b/i;
const NEW_SCENARIO = /\b(different project|another project|separate project|unrelated project|new programme|new program|brand-new|new interview|separate upgrade|separate implementation)\b/i;
const SCHEDULE_TOPIC = /\b(timeline|schedule|phase|milestone|month|cutover|hypercare|go-live|go live|rollback|uat|testing|role build|security|workstream|delay|slip)\b/i;
const UNRELATED_PRODUCT = /\b(joule|ariba|analytics cloud|\bSAC\b|successfactors|datasphere|customer activity repository)\b/i;

function numberValue(raw) {
  const token = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] || null;
}

function durationMonths(text) {
  const source = String(text || "");
  const hyphen = source.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*-\s*month\b/i);
  const words = source.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+months?\b/i);
  return numberValue(hyphen?.[1] || words?.[1]);
}

function projectType(text) {
  const source = String(text || "");
  if (/\bRISE\b/i.test(source)) return "rise";
  if (/\b(upgrade|support package|feature package)\b/i.test(source)) return "upgrade";
  if (/\b(greenfield|brownfield|system conversion|selective data transition|new implementation|implementation)\b/i.test(source)) return "implementation";
  return "";
}

function extractPhases(text) {
  const phases = [];
  const seen = new Set();
  const add = (start, end, label) => {
    const clean = String(label || "")
      .replace(/^(?:with|and)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!start || !end || clean.length < 3) return;
    const key = `${start}-${end}`;
    if (seen.has(key)) return;
    seen.add(key);
    phases.push({ start, end, label: clean.slice(0, 180) });
  };
  const source = String(text || "");
  for (const match of source.matchAll(/\bMonths?\s+(\d+)\s*(?:[–—-]\s*(\d+))?\s*:\s*([^\n.]+)/gi)) {
    add(Number(match[1]), match[2] ? Number(match[2]) : Number(match[1]), match[3]);
  }
  for (const match of source.matchAll(/([^,.;]+?)\s+in\s+Months?\s+(\d+)\s*(?:[–—-]\s*(\d+))?/gi)) {
    add(Number(match[2]), match[3] ? Number(match[3]) : Number(match[2]), match[1]);
  }
  return phases;
}

function assumptionSource(question) {
  if (/\b(assume|our plan|we have|approved plan|the programme is|the program is)\b/i.test(question)) return "candidate";
  return "illustrative";
}

function extractTimeline(answer) {
  const duration = durationMonths(answer);
  const phases = extractPhases(answer);
  if (!duration || phases.length < 2) return null;
  return {
    projectType: projectType(answer) || "implementation",
    durationMonths: duration,
    durationLabel: `${duration} months`,
    phases,
    delays: [],
    changeNote: "",
    source: "illustrative"
  };
}

function allDurations(text) {
  const found = [];
  const pattern = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*-\s*|\s+)months?\b/gi;
  for (const match of String(text || "").matchAll(pattern)) {
    const value = numberValue(match[1]);
    if (value) found.push(value);
  }
  return found;
}

function explicitDurationChange(question, active) {
  if (!active?.durationMonths) return null;
  if (!/\b(reduce|shorten|extend|increase|change|now|instead|down to|up to|becomes?|only)\b/i.test(question)) return null;
  return [...allDurations(question)].reverse().find((value) => value !== active.durationMonths) || null;
}

function explicitDelay(question) {
  if (!/\b(delay|slip|slips|late|behind)\b/i.test(question)) return "";
  const match = String(question || "").match(/\b(\d+|two|three|four|one)\s*-?\s*weeks?\b/i);
  return match ? match[0].replace(/\s+/g, " ") : "";
}

function isNewScenario(question, active) {
  if (!active) return false;
  if (NEW_SCENARIO.test(question)) return true;
  const asked = projectType(question);
  if (asked && active.projectType && asked !== active.projectType && !CONTINUITY.test(question)) return true;
  return false;
}

function isLinkedFollowUp(question, active) {
  if (!active?.durationMonths) return false;
  if (isNewScenario(question, active)) return false;
  if (UNRELATED_PRODUCT.test(question) && !CONTINUITY.test(question) && !projectType(question)) return false;
  return CONTINUITY.test(question) || SCHEDULE_TOPIC.test(question);
}

function formatTimeline(active, question) {
  const phaseLines = (active.phases || []).map((phase) => (
    phase.start === phase.end
      ? `Month ${phase.start}: ${phase.label}`
      : `Months ${phase.start}-${phase.end}: ${phase.label}`
  ));
  const delayLines = (active.delays || []).map((delay) => `Recorded delay: ${delay}. Move only the dependent milestones.`);
  const change = explicitDurationChange(question, active);
  const delay = explicitDelay(question);
  const lines = [
    "Session assumption only. This is not the candidate's history, not a knowledge-base fact, and not a universal SAP duration.",
    `Project type: ${active.projectType || "implementation"}.`,
    `Baseline duration: ${active.baselineDurationMonths || active.durationMonths} months. Source: ${active.source || "illustrative"}.`,
    active.forecastNote
      ? `Forecast: ${active.forecastNote}`
      : `Forecast duration matches the baseline. No delay is recorded.`,
    phaseLines.length ? `Phase windows:\n${phaseLines.join("\n")}` : "",
    active.changeNote || "",
    delayLines.join("\n"),
    "Reuse these windows for this scenario. Do not replace the duration, move a phase, or invent a new go-live date unless the current question explicitly changes a constraint.",
    "A delay keeps the baseline duration and moves only the dependent forecast milestones. Say that the forecast end extends by the delay. Do not describe the programme as still ending on the original date unless you also name a feasible recovery.",
    "A verified product constraint still wins. Explain the conflict and the smallest adjustment that keeps the rest of this plan consistent.",
    change ? `The interviewer is changing the duration to ${change} months. Keep unaffected earlier windows and restate the consequence.` : "",
    delay ? `The interviewer is adding this delay: ${delay}. Do not change the overall duration unless the question also changes it.` : ""
  ];
  return lines.filter(Boolean).join("\n");
}

function asksToEstablishTimeline(question) {
  return /\b(timeline|schedule|illustrative|how long|month)\b/i.test(question);
}

function isContextOnlyTimeline(text) {
  const source = String(text || "");
  if (/\?/.test(source) || /\b(?:how|what|why|when|where|which|would you|do you|can you)\b/i.test(source)) return false;
  if (extractTimeline(source)) return true;
  if (explicitDelay(source)) return true;
  return /\b(?:reduce|shorten|extend|change)\b/i.test(source) && allDurations(source).length > 0;
}

function asksForUnspecifiedSchedule(question) {
  return /\b(timeline|how long|what timeline|schedule would you|how many months)\b/i.test(question)
    && !durationMonths(question);
}

function unspecifiedTimelinePolicy(question, active) {
  if (!asksForUnspecifiedSchedule(question)) return "";
  if (active?.durationMonths && isLinkedFollowUp(question, active) && !isNewScenario(question, active)) return "";
  return [
    "There is no standard duration for this programme. I would set the schedule from the source and target releases, the landscape, custom code, integrations, test scope, downtime, and the risk the sponsor accepts.",
    "I would not quote a universal month range. That is not a product rule. If you name the scope, I can propose one illustrative plan and keep that plan for the follow-up questions in this scenario.",
    "That plan would be a session assumption, not a personal project and not a verified SAP duration. A technical dependency still wins over a date that cannot be met."
  ].join(" ");
}

function timelinePromptForTurn({ active, question }) {
  if (active && isNewScenario(question, active)) {
    return "This is a new scenario. Do not reuse the previous scenario's duration, phase dates, or go-live. If this question does not name a duration, do not invent a universal duration; say the schedule belongs to the approved plan.";
  }
  if (active && isLinkedFollowUp(question, active)) return formatTimeline(active, question);
  if (!active && asksToEstablishTimeline(question)) {
    const named = durationMonths(question);
    return [
      "The interviewer is asking for an illustrative schedule for this session.",
      named
        ? `Use ${named} months, because the question names that duration. State each window as "Months N-M: ...".`
        : "If the question does not name a duration, do not invent a universal SAP duration. Say the schedule belongs to the approved plan.",
      "Label the schedule as an illustrative session assumption, not as personal history."
    ].join(" ");
  }
  return "";
}

function newScenarioId() {
  return `scn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nextScenarioTimeline({ active, question, answer }) {
  const delay = explicitDelay(question);
  const changedDuration = explicitDurationChange(question, active);
  if (isNewScenario(question, active)) {
    const extracted = extractTimeline(answer);
    if (!extracted) return { action: "clear" };
    return {
      action: "replace",
      timeline: { ...extracted, scenarioId: newScenarioId(), baselineDurationMonths: extracted.durationMonths, source: assumptionSource(question), delays: [] }
    };
  }
  if (!active?.durationMonths) {
    const fromQuestion = extractTimeline(question);
    const extracted = fromQuestion || extractTimeline(answer);
    if (!extracted) return { action: "keep" };
    return {
      action: "replace",
      timeline: {
        ...extracted,
        scenarioId: newScenarioId(),
        baselineDurationMonths: extracted.durationMonths,
        source: fromQuestion ? "candidate" : assumptionSource(question)
      }
    };
  }
  if (changedDuration) {
    const extracted = extractTimeline(answer);
    const replacementPhases = extracted?.phases?.length ? extracted.phases : active.phases;
    const overflow = (replacementPhases || []).filter((phase) => phase.end > changedDuration);
    return {
      action: "replace",
      timeline: {
        ...active,
        durationMonths: changedDuration,
        durationLabel: `${changedDuration} months`,
        baselineDurationMonths: changedDuration,
        forecastNote: "",
        phases: replacementPhases,
        source: "approved-change",
        changeNote: overflow.length
          ? `The revised duration is ${changedDuration} months. These windows fall outside it: ${overflow.map((phase) => `Months ${phase.start}-${phase.end}`).join(", ")}. Say that conflict instead of keeping both.`
          : `Interviewer changed the duration from ${active.durationMonths} months to ${changedDuration} months.`
      }
    };
  }
  if (delay) {
    const delays = [...(active.delays || [])];
    if (!delays.includes(delay)) delays.push(delay);
    const baseline = active.baselineDurationMonths || active.durationMonths;
    return {
      action: "replace",
      timeline: {
        ...active,
        baselineDurationMonths: baseline,
        delays,
        forecastNote: `Baseline stays ${baseline} months. Forecast end extends by ${delay}. Cutover, go-live, and hypercare move. Earlier phases stay on their baseline windows.`,
        changeNote: `${delay} is a forecast delay, not a new baseline.`
      }
    };
  }
  return { action: "keep" };
}

module.exports = {
  durationMonths,
  extractTimeline,
  isNewScenario,
  isLinkedFollowUp,
  timelinePromptForTurn,
  nextScenarioTimeline,
  unspecifiedTimelinePolicy,
  isContextOnlyTimeline
};
