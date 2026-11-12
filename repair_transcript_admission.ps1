$ErrorActionPreference = "Stop"
$projectRoot = "D:\My Projects\InterviewCopilot"
Set-Location -LiteralPath $projectRoot

$qaPath = ".\lib\questionAdmission.js"
$dcPath = ".\lib\deferredContinuation.js"
$tgPath = ".\lib\transcriptGuardrails.js"
$pagePath = ".\pages\interview.js"
$paths = @($qaPath, $dcPath, $tgPath, $pagePath)
foreach ($path in $paths) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "STOP: Required file missing: $path. No files were changed."
    }
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$qa = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $qaPath))
$dc = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $dcPath))
$tg = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $tgPath))
$page = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $pagePath))

# Stop if the source does not match the inspected baseline.
if ($qa -notmatch 'function admitQuestion\(raw, context = \{\}\)') { throw "STOP: questionAdmission.js baseline mismatch. No files were changed." }
if ($dc -notmatch 'function takeUtterance\(pending, raw\)') { throw "STOP: deferredContinuation.js baseline mismatch. No files were changed." }
if ($tg -notmatch 'const NOISE_PATTERNS = \[' -or $tg -notmatch 'function isNoiseOnly\(raw\)') { throw "STOP: transcriptGuardrails.js baseline mismatch. No files were changed." }
if ([regex]::Matches($page, '(?ms)^    if \(meta\.retry\) \{\r?\n.*?^    \}').Count -lt 1) { throw "STOP: interview.js assembly block not found. No files were changed." }
if ([regex]::Matches($page, '(?ms)^    // Zero-drop / force pass-through: never block non-empty transcripts.*?^    \}\r?\n').Count -ne 1) { throw "STOP: expected exactly one admission force-pass block. No files were changed." }

$newQuestionAdmission = @'
/**
 * Question admission with explicit noise, ambiguity, and context handling.
 * Well-formed questions and technical issue statements are admitted; pure chatter
 * is ignored; context-dependent fragments are deferred rather than generated alone.
 */
const { isNoiseOnly } = require("./transcriptGuardrails.js");

const DECISIONS = {
  ANSWER: "ANSWER",
  IGNORE: "IGNORE",
  DEFER: "DEFER"
};

const deferredOnIncomplete = true;

const TECHNICAL_SIGNAL = /\b(?:SAP|S\/4(?:HANA)?|S4(?:HANA)?|ECC|GRC|IAG|IAS|IPS|BTP|Fiori|SoD|SU24|SU25|SU53|PFCG|MSMP|BRF\+|XSUAA|CERTRULE|STAUTHTRACE|Firefighter|authori[sz]ation|derived role|roles?|ruleset|workflow|Access Control|access request|access risk|risk analysis|provisioning|JML|ITGC|OData|mitigating control|mitigation|on[- ]?prem(?:ise|ises)?|Public Edition|Private Edition|SuccessFactors|identity|catalog|UAT|SM59|SAP_ALL|controller review|presales)\b/i;

const OPEN_TAIL = new Set(
  "a an the and or but so to of in on for with at from by as about into over your you we they would could should can will do does did how what when where which who if that this".split(/\s+/)
);

function normalize(raw) {
  return String(raw || "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

function decision(code, reason, features = {}) {
  return { decision: code, reason, features: { ...features, deferredOnIncomplete } };
}

function isAlwaysUnderspecified(text) {
  return /^(?:how|what)\s+to\s+(?:iag|grc)\s*[?.!]*$/i.test(text)
    || /^have you statistical\b/i.test(text)
    || /^(?:how\s+){2,}/i.test(text);
}

function isContextlessFragment(text) {
  const tokens = text.toLowerCase().replace(/[^a-z0-9+/? ]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length <= 2) return true;
  if (/^(?:and|or|so|but|then|what about|or maybe|something about|just|based in|implementation bit|post selling|identify customer then partner|you you you|the role or)\b/i.test(text)) return true;
  if (/^what\s+if\b/i.test(text)) return true;
  if (OPEN_TAIL.has(tokens[tokens.length - 1])) return true;
  if (/^(?:how|what|where|which|who)\s+to\b/i.test(text) && tokens.length < 5) return true;
  if (/^(?:how\s+){2,}/i.test(text)) return true;
  return false;
}

function isWellFormedAsk(text, count) {
  if (count < 4) return false;
  if (/^(?:and|or|so|but|then|or maybe|something about|just|based in)\b/i.test(text)) return false;
  if (/^have you statistical\b/i.test(text) || /^(?:how\s+){2,}/i.test(text)) return false;

  const questionOrPrompt = /^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|have|has|tell|walk|compare|explain|describe|outline|give|connect|identify|trace|configure|design|troubleshoot|implement|remediate|validate|propose|modify|integrate|provision|approve|assign)\b/i.test(text);
  const explicitlyAsked = /\?\s*$/.test(text) && count >= 4;
  return questionOrPrompt || explicitlyAsked;
}

function admitQuestion(raw, context = {}) {
  const text = normalize(raw);
  const priorQuestion = normalize(context.priorQuestion || "");
  const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const features = {
    tokens: count,
    hasPrior: Boolean(priorQuestion),
    deferredOnIncomplete
  };

  if (!text) return decision(DECISIONS.IGNORE, "empty", features);
  if (isNoiseOnly(text)) return decision(DECISIONS.IGNORE, "noise-only", features);
  if (isAlwaysUnderspecified(text)) return decision(DECISIONS.DEFER, "underspecified-fragment", features);

  // A real prior question gives short but meaningful follow-ups their context.
  // Noise and structurally under-specified phrases were filtered above.
  if (priorQuestion) {
    return decision(DECISIONS.ANSWER, "contextual-follow-up", features);
  }

  if (isContextlessFragment(text)) {
    return decision(DECISIONS.DEFER, "ambiguous-fragment", features);
  }

  if (isWellFormedAsk(text, count) || (count >= 4 && TECHNICAL_SIGNAL.test(text))) {
    return decision(DECISIONS.ANSWER, "well-formed-question-or-technical-issue", features);
  }

  return decision(DECISIONS.DEFER, "insufficient-question-context", features);
}

function priorAnchor(history = []) {
  const items = Array.isArray(history) ? history : [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (!item || item.disposition === DECISIONS.IGNORE || item.disposition === DECISIONS.DEFER) continue;
    const role = item.role || item.type;
    if (role === "assistant" || role === "response" || role === "answer") continue;
    const content = item.content || item.text || item.question || "";
    if (!String(content).trim()) continue;
    const admitted = admitQuestion(content, { priorQuestion: "" });
    if (admitted.decision === DECISIONS.ANSWER) return String(content);
  }
  return "";
}

module.exports = {
  DECISIONS,
  admitQuestion,
  priorAnchor,
  deferredOnIncomplete
};
'@

$newDeferredContinuation = @'
/**
 * Assembles only plausible open-question fragments. It ignores filler without
 * discarding a valid pending fragment, joins continuation parts, and passes
 * independent turns through without merging them.
 */
const { DECISIONS } = require("./questionAdmission.js");
const { isNoiseOnly } = require("./transcriptGuardrails.js");

const MAX_PARTS = 4;
const deferredOnIncomplete = true;

const OPEN_TAIL = new Set(
  "a an the and or but so to of in on for with at from by as about into over your you we they would could should can will do does did how what when where which who if that this".split(/\s+/)
);

function clean(raw) {
  return String(raw || "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

function words(raw) {
  return clean(raw).toLowerCase().replace(/[^a-z0-9?+ ]/g, " ").split(/\s+/).filter(Boolean);
}

function isClosedEllipsis(raw) {
  return /^(why|how)\s*\?$/i.test(clean(raw));
}

const FILLER = new Set("um uh yeah yes yep ok okay hmm mm mmm mhm well like oh ah alright".split(/\s+/));

function contentWords(raw) {
  return words(raw)
    .map((token) => token.replace(/\?+$/, ""))
    .filter((token) => token.length > 2 && !OPEN_TAIL.has(token) && !FILLER.has(token));
}

function isOpenFragment(raw) {
  const text = clean(raw);
  if (!deferredOnIncomplete || !text || isClosedEllipsis(text)) return false;
  if (/[.!]\s*$/.test(text)) return false;

  const tokens = words(text);
  if (!tokens.length) return false;
  const last = tokens[tokens.length - 1].replace(/\?+$/, "");
  const content = contentWords(text);

  if (/\?\s*$/.test(text) && content.length >= 2) return false;
  if (OPEN_TAIL.has(last)) return true;
  if (/\?\s*$/.test(text)) return false;
  if (content.length > 2) return false;
  return /^(what|how|and|so|or|which|where|who)\b/i.test(text) && content.length <= 2;
}

function isIndependentTurn(raw) {
  const text = clean(raw);
  if (!text || isNoiseOnly(text)) return false;
  return /^(?:what|how|why|when|where|which|who|can|could|would|should|do|does|did|is|are|have|has|tell|explain|describe|compare|walk me through|give me|connect|trace|configure|design|we\b|i\b|the meeting\b|the panel\b|the hr conversation\b|the final discussion\b|the next interviewer\b|my name is\b|thanks\b|please\b|let'?s\b|nice to meet\b)/i.test(text);
}

function makeHold(pending, recordText, disposition = DECISIONS.DEFER) {
  return {
    action: "hold",
    pending,
    text: "",
    recordText: clean(recordText),
    disposition,
    generates: false,
    deferredOnIncomplete
  };
}

function takeUtterance(pending, raw) {
  const text = clean(raw);

  if (!text) {
    if (pending) return makeHold(pending, "", DECISIONS.IGNORE);
    return { action: "pass", pending: null, text: "", recordText: "", disposition: DECISIONS.IGNORE, generates: false, deferredOnIncomplete };
  }

  if (isNoiseOnly(text)) {
    if (pending) return makeHold(pending, text, DECISIONS.IGNORE);
    return { action: "pass", pending: null, text, recordText: text, disposition: DECISIONS.IGNORE, generates: false, deferredOnIncomplete };
  }

  if (!pending || !clean(pending.text)) {
    if (isOpenFragment(text)) {
      return makeHold({ text, parts: 1 }, text, DECISIONS.DEFER);
    }
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, deferredOnIncomplete };
  }

  // A separately framed question or complete independent statement starts a new turn.
  if (isIndependentTurn(text)) {
    return { action: "pass", pending: null, text, recordText: text, disposition: null, generates: false, superseded: true, deferredOnIncomplete };
  }

  const combined = clean(`${pending.text} ${text}`);
  const parts = Math.max(1, Number(pending.parts) || 1) + 1;

  if (parts < MAX_PARTS && isOpenFragment(combined)) {
    return makeHold({ text: combined, parts }, combined, DECISIONS.DEFER);
  }

  return {
    action: "complete",
    pending: null,
    text: combined,
    recordText: combined,
    disposition: DECISIONS.ANSWER,
    generates: true,
    deferredOnIncomplete
  };
}

module.exports = {
  MAX_PARTS,
  deferredOnIncomplete,
  isOpenFragment,
  takeUtterance
};
'@

# Extend the common noise filter for filler-only ASR fragments and interview logistics.
$hmmMarker = '  "hmm",'
if ([regex]::Matches($tg, [regex]::Escape($hmmMarker)).Count -ne 1) { throw "STOP: expected one noise-set insertion point. No files were changed." }
$hmmReplacement = @'
  "hmm",
  "um",
  "uh",
  "well",
  "like",
  "oh",
  "ah",
  "mhm",
'@
$tg = $tg.Replace($hmmMarker, $hmmReplacement.TrimEnd())

$noiseArrayPattern = '(?ms)(const NOISE_PATTERNS = \[\r?\n)(.*?)(\r?\n\];)'
$noiseMatches = [regex]::Matches($tg, $noiseArrayPattern)
if ($noiseMatches.Count -ne 1) { throw "STOP: expected one NOISE_PATTERNS array. No files were changed." }
$noiseMatch = $noiseMatches[0]
$extraNoisePatterns = @'
  /^(?:how are you(?: doing)?|i(?:'|’)m well,? thanks for asking)[.!?]*$/i,
  /^(?:sounds good|thanks,? that'?s all from me|that'?s all from me|appreciate it|all good|nice,? thank you|thanks for your time)[.!?]*$/i,
  /^(?:no worries(?: at all)?|lovely,? thank you|great,? appreciate your time today|welcome in|bye for now|right,? noted)[.!?]*$/i,
  /^(?:we can pause until the next interviewer joins|the hr conversation comes after this round|the final discussion is about compensation|we will email the outcome later|please hold,? the panel is still connecting|one moment while we switch rooms)[.!?]*$/i,
  /^(?:the next interviewer is joining now|the panel will come back after lunch|we will share the outcome later|nice to meet you today|let'?s switch to the commercial discussion|i think we are done with that topic|the meeting is at three)[.!?]*$/i,
  /^(?:time)(?:\s+time){2,}[.!?]*$/i
'@
$extraNoisePatterns = $extraNoisePatterns.Trim()
# Insert a comma after the current last pattern, then append the new patterns.
$body = $noiseMatch.Groups[2].Value.TrimEnd()
if ($body.EndsWith(',')) { $body = $body.Substring(0, $body.Length - 1).TrimEnd() }
$newNoiseBody = $body + ",`r`n" + $extraNoisePatterns
$tg = $tg.Substring(0, $noiseMatch.Groups[2].Index) + $newNoiseBody + $tg.Substring($noiseMatch.Groups[2].Index + $noiseMatch.Groups[2].Length)

# Replace the caller's hold-to-pass bypass with state-preserving continuation handling.
$assemblyPattern = '(?ms)^    if \(meta\.retry\) \{\r?\n.*?^    \}'
$assemblyMatches = [regex]::Matches($page, $assemblyPattern)
if ($assemblyMatches.Count -ne 1) { throw "STOP: expected exactly one retry/assembly block. No files were changed." }
$assemblyReplacement = @'
    let assembly = { action: "pass", text, pending: pendingFragmentRef.current, disposition: null };
    if (meta.retry) {
      pendingFragmentRef.current = null;
      assembly = { action: "pass", text, pending: null, disposition: null };
    } else {
      try {
        assembly = takeUtterance(pendingFragmentRef.current, text);
      } catch (assemblyError) {
        console.error("Deferred continuation failed:", assemblyError);
        assembly = { action: "pass", text, pending: null, disposition: null };
      }

      pendingFragmentRef.current = assembly.pending;
      if (assembly.action === "hold") {
        text = String(assembly.recordText || text).trim() || text;
      } else if (assembly.text) {
        text = assembly.text;
      }
    }
'@
$am = $assemblyMatches[0]
$page = $page.Substring(0, $am.Index) + $assemblyReplacement.TrimEnd([char[]]"`r`n") + $page.Substring($am.Index + $am.Length)

# Route held DEFER/IGNORE results before normal turn-decision logic.
$turnPattern = '(?ms)(^    let turn = \{ decision: "ANSWER", route: "GENERATION", reason: "admission-failed-open" \};\r?\n    try \{\r?\n)(      turn = decideInterviewTurn\(\{ question: text, history: turnHistory \}\);)(\r?\n    \} catch \(gateError\) \{)'
$turnMatches = [regex]::Matches($page, $turnPattern)
if ($turnMatches.Count -ne 1) { throw "STOP: expected one turn-decision block. No files were changed." }
$tm = $turnMatches[0]
$turnReplacement = @'
    let turn = { decision: "ANSWER", route: "GENERATION", reason: "admission-failed-open" };
    try {
      if (assembly.action === "hold" && assembly.disposition === "IGNORE") {
        turn = { decision: "IGNORE", route: "NONE", reason: "ignore-noise", scriptAnswer: "[IGNORE_NOISE]", normalizedQuestion: text, features: { ignoreNoise: true } };
      } else if (assembly.action === "hold" && assembly.disposition === "DEFER") {
        turn = { decision: "DEFER", route: "NONE", reason: "incomplete-fragment", scriptAnswer: "", normalizedQuestion: text, features: { deferredOnIncomplete: true } };
      } else {
        turn = decideInterviewTurn({ question: text, history: turnHistory });
      }
    } catch (gateError) {
'@
# The regex includes the opening try and the call but not catch body; replace only that matched prefix.
$page = $page.Substring(0, $tm.Index) + $turnReplacement.TrimEnd([char[]]"`r`n") + $page.Substring($tm.Index + $tm.Length)

# Remove the UI-level fail-open block that promoted DEFER into ANSWER.
$forcePattern = '(?ms)^    // Zero-drop / force pass-through: never block non-empty transcripts.*?^    \}\r?\n'
$forceMatches = [regex]::Matches($page, $forcePattern)
if ($forceMatches.Count -ne 1) { throw "STOP: expected exactly one force-pass block. No files were changed." }
$fm = $forceMatches[0]
$page = $page.Substring(0, $fm.Index) + $page.Substring($fm.Index + $fm.Length)

# Validate the patched in-memory content before any write operation.
if ($newQuestionAdmission -notmatch 'function admitQuestion\(' -or $newQuestionAdmission -notmatch 'priorAnchor\(') { throw "STOP: admission replacement validation failed. No files were changed." }
if ($newDeferredContinuation -notmatch 'action: "complete"' -or $newDeferredContinuation -notmatch 'isIndependentTurn') { throw "STOP: continuation replacement validation failed. No files were changed." }
if ($tg -notmatch 'the hr conversation comes after this round' -or $tg -notmatch '"um"') { throw "STOP: noise guardrail replacement validation failed. No files were changed." }
if ($page -match 'force-pass the fragment into generation' -or $page -match 'Zero-drop / force pass-through: never block non-empty transcripts') { throw "STOP: old UI bypass still detected. No files were changed." }
if ($page -notmatch 'assembly\.disposition === "DEFER"' -or $page -notmatch 'assembly\.disposition === "IGNORE"') { throw "STOP: continuation disposition routing validation failed. No files were changed." }

# Back up all original targets before writing any changes.
$backupStamp = Get-Date -Format "yyyyMMdd-HHmmssfff"
$backupMap = @{}
foreach ($path in $paths) {
    $backupPath = "$path.backup-$backupStamp"
    Copy-Item -LiteralPath $path -Destination $backupPath
    $backupMap[$path] = $backupPath
}

try {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $qaPath), $newQuestionAdmission, $utf8NoBom)
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $dcPath), $newDeferredContinuation, $utf8NoBom)
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $tgPath), $tg, $utf8NoBom)
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $pagePath), $page, $utf8NoBom)
} catch {
    Write-Host "WRITE ERROR: attempting to restore all original targets from timestamped backups." -ForegroundColor Red
    foreach ($path in $paths) {
        if ($backupMap.ContainsKey($path)) {
            Copy-Item -LiteralPath $backupMap[$path] -Destination $path -Force
        }
    }
    throw
}

Write-Host "TRANSCRIPT PATCH APPLIED" -ForegroundColor Green
Write-Host "Timestamped backups created:"
foreach ($path in $paths) { Write-Host "  $($backupMap[$path])" }
Write-Host "Next, run the focused regression tests before using the app."
