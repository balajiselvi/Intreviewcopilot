const { chatJSON } = require("./lib/openaiClient");
const { segmentTranscript, extractJudgmentRecordFromSpan } = require("../lib/engineeringMemory/extraction");

// Offline validation of lib/engineeringMemory/extraction.js -- build order step 2, per
// docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 10: "validated OFFLINE against
// hand-written transcripts spanning multiple experience_type values, before touching a live
// conversation." No wiring into any live acquisition flow here -- just segmentation +
// per-span extraction against known transcripts, printed for manual verification (this
// project's established discipline: never trust an automated pass/fail alone for LLM output
// quality, read the actual result).

// Transcript A: two DISTINCT decisions in one narrative -- tests segmentation, and includes a
// decoy use of the word "alternative" in the second span with no actual rejected alternative
// given (a real adversarial test of the fabrication guard, not a friendly one).
const TRANSCRIPT_A = `So on that engagement we had two separate problems come up. First was the SoD ruleset -- we had 320 conflicting rules after consolidating from three legacy systems, and country compliance meant we couldn't just waive them. I ended up going with a derived role model instead of one big global role, because localizing a single shared role for every country would have been a mess. That held up fine through the audit.

Then separately, later in the same project, we had to secure the Cloud Connector between BTP and the on-prem backend. There wasn't really an alternative I seriously considered there -- I just went with the standard TrustStore-based certificate setup and mutual TLS, following the reference architecture. That part was pretty uneventful.`;

// Transcript B: a production failure with no alternative, and outcome stated but NOT framed as
// a generalized lesson -- tests that the extractor doesn't invent alternative_rejected or
// over-eagerly promote "it got better after" into a fabricated lesson_learned.
const TRANSCRIPT_B = `We had an emergency once -- a Firefighter session got left open way longer than it should have because the controller review didn't happen on time, over a weekend. I ended up tightening the reason-code enforcement and set up an automated alert if a session ran past 4 hours. After that we didn't have another lapse like it.`;

// Transcript C: explicit hedging about the facts themselves -- tests recall_confidence
// detection specifically, not general uncertainty about opinions.
const TRANSCRIPT_C = `This was a while back, I think maybe two or three years into that role, so I don't remember the exact numbers, but it was something like two thousand users, roughly. We redesigned the authorization model for Finance and HR to be least-privilege -- separated access so payroll data was locked down at the infotype level. I'm fairly sure that was driven by an internal audit finding, though I don't recall the exact finding wording.`;

async function runCase(label, transcript) {
  console.log(`\n${"=".repeat(70)}\n${label}\n${"=".repeat(70)}`);
  const spans = await segmentTranscript(transcript, { chatJSON });
  console.log(`Segmented into ${spans.length} span(s).`);

  const records = [];
  for (let i = 0; i < spans.length; i++) {
    console.log(`\n--- span ${i + 1} ---`);
    console.log(spans[i].slice(0, 150) + (spans[i].length > 150 ? "..." : ""));
    const extracted = await extractJudgmentRecordFromSpan(spans[i], { chatJSON });
    console.log(JSON.stringify(extracted, null, 2));
    records.push(extracted);
  }
  return { label, spans, records };
}

(async () => {
  const results = [];
  results.push(await runCase("TRANSCRIPT A: two decisions, one with a decoy 'alternative' mention", TRANSCRIPT_A));
  results.push(await runCase("TRANSCRIPT B: production failure, no alternative, no explicit lesson", TRANSCRIPT_B));
  results.push(await runCase("TRANSCRIPT C: hedging language about facts", TRANSCRIPT_C));

  require("fs").writeFileSync(
    require("path").join(__dirname, "results", "engineering_memory_extraction_test.json"),
    JSON.stringify(results, null, 2),
    "utf-8"
  );

  console.log(`\n${"=".repeat(70)}\nMANUAL VERIFICATION CHECKLIST (read the output above against these)\n${"=".repeat(70)}`);
  console.log("A: expect 2 spans. Span 1 should have a real alternative_rejected (single global role). Span 2 should have alternative_rejected = null despite the word 'alternative' appearing in the source text -- if it's non-null, the fabrication guard failed.");
  console.log("B: alternative_rejected should be null (none was described). lesson_learned should be null or should NOT be a fabricated generalization beyond what was said -- 'after that we didn't have another lapse' is an outcome, not a stated lesson.");
  console.log("C: recall_confidence should be 'low' (or arguably 'medium') given explicit hedging on the user count and the audit-finding detail -- if it's 'high', confidence detection failed.");
})();
