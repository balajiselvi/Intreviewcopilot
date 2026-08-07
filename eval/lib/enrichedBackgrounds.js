const { CANDIDATE_BACKGROUND } = require("./candidateBackground");

// Test-only payloads for eval/testEnrichedBackgrounds.js -- NOT used by the live product. These
// take the real CANDIDATE_BACKGROUND and insert ONE additional sentence of genuine
// decision-and-rationale narrative (a rejected alternative + why) into the existing GRC and
// Fiori project bullets, changing nothing else -- same scope numbers, same structure, same
// anti-fabrication rules -- to isolate "does background content shape (decision narrative vs.
// scope inventory) affect leverage" as a single variable, per
// eval/results/LEVERAGING_BENCHMARK_2026-08-07.md's root-cause diagnosis.

const GRC_SOD_SENTENCE_ANCHOR = "Architected the enterprise authorization architecture and a 250+ rule SoD framework adopted as the audit and build-quality baseline for the whole programme.";
const GRC_DECISION_NARRATIVE = "To satisfy strict local data-privacy mandates across the European legal entities during that rollout, I rejected a single global MSMP approval workflow in favor of localized stage-level approval paths with dynamic agent routing per country, accepting the added workflow-maintenance overhead to keep each jurisdiction's approval chain independently audit-defensible. I also overrode several default SU24 authorization proposals where accepting them would have caused cross-system authorization inflation, deliberately narrowing scope below the vendor default rather than accepting it as-is.";

const FIORI_SENTENCE_ANCHOR = "Architected Fiori authorization models and OData/API service controls.";
const FIORI_DECISION_NARRATIVE = "When Gateway OData performance degraded noticeably under concurrent launchpad load, I rejected a single monolithic role-to-catalog assignment model in favor of splitting OData catalogs into fine-grained groups per functional area, deliberately accepting higher role-maintenance overhead in exchange for keeping tile response times consistently sub-second.";

function insertAfter(text, anchor, addition) {
  if (!text.includes(anchor)) throw new Error(`anchor not found: ${anchor.slice(0, 50)}`);
  return text.replace(anchor, `${anchor} ${addition}`);
}

const ENRICHED_GRC_BACKGROUND = insertAfter(CANDIDATE_BACKGROUND, GRC_SOD_SENTENCE_ANCHOR, GRC_DECISION_NARRATIVE);
const ENRICHED_FIORI_BACKGROUND = insertAfter(CANDIDATE_BACKGROUND, FIORI_SENTENCE_ANCHOR, FIORI_DECISION_NARRATIVE);

module.exports = { ENRICHED_GRC_BACKGROUND, ENRICHED_FIORI_BACKGROUND };
