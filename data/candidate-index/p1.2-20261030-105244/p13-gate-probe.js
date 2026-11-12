const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..", "..");
const activePath = path.join(root, "data", "knowledgeIndex.json");
const candPath = path.join(__dirname, "knowledgeIndex.json");
const candMan = path.join(__dirname, "knowledgeManifest.json");

function load(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

async function retrieve(label, indexFile, questions) {
  process.env.KNOWLEDGE_INDEX_FILE = indexFile;
  process.env.KNOWLEDGE_MANIFEST_FILE = indexFile.replace(/knowledgeIndex\.json$/i, "knowledgeManifest.json");
  process.env.KNOWLEDGE_REPORT_FILE = indexFile.replace(/knowledgeIndex\.json$/i, "knowledgeReport.json");
  Object.keys(require.cache).forEach((k) => {
    if (/[\\/](config|services|lib|models|container)[\\/]/.test(k) || /vectorSearch|retrievalService|liveReliability/.test(k)) {
      delete require.cache[k];
    }
  });
  // Also clear application container singleton if present
  try {
    const containerPath = require.resolve(path.join(root, "lib", "container.js"));
    delete require.cache[containerPath];
  } catch (_) {}

  const { searchKnowledge } = require(path.join(root, "services", "vectorSearch"));
  const { productKnowledgeFolders, selectProductScopedChunks } = require(path.join(root, "lib", "productKnowledgeScope"));
  const { analyzeInterviewQuestion } = await import(pathToFileURL(path.join(root, "lib", "interviewAnalyzer.js")).href);
  const cfg = require(path.join(root, "config", "appConfig.js"));
  const resolved = path.resolve(cfg.knowledge.indexFile);
  if (path.resolve(resolved) !== path.resolve(indexFile)) {
    throw new Error(`Index mismatch for ${label}: resolved=${resolved} expected=${indexFile}`);
  }

  const out = [];
  for (const question of questions) {
    const analysis = analyzeInterviewQuestion(question, []);
    const folders = productKnowledgeFolders(question);
    const candidates = await searchKnowledge(
      question,
      analysis,
      12,
      folders.length ? { metadataFilters: { sourceFolders: folders } } : {}
    );
    const scoped = selectProductScopedChunks(question, candidates).slice(0, 8);
    out.push({
      question,
      folders,
      resolvedIndex: resolved,
      top: scoped.map((c, i) => ({
        rank: i + 1,
        score: Number((c.score ?? c.semanticScore ?? 0).toFixed(4)),
        path: `${c.sourceFolder}/${c.sourceFile}`,
        heading: c.heading || c.section,
        chunkId: c.id || c.chunkId,
        text: String(c.content || "").replace(/\s+/g, " ").slice(0, 500),
        fullLen: String(c.content || "").length,
        taskSignals: {
          configure: /configur|GRFNMW|stage|path|initiator|agent|MSMP/i.test(String(c.content || "") + " " + String(c.heading || "")),
          troubleshoot: /troubleshoot|no approver|fail|log|diagnos/i.test(String(c.content || "") + " " + String(c.heading || "")),
          implement: /implement|workshop|hypercare|rollout|greenfield|brownfield/i.test(String(c.content || "") + " " + String(c.heading || ""))
        }
      }))
    });
  }
  return { label, resolvedIndex: resolved, results: out };
}

function pathToFileURL(p) {
  return require("url").pathToFileURL(p);
}

function nearDup(a, b) {
  const ta = String(a || "").toLowerCase().replace(/\s+/g, " ").slice(0, 280);
  const tb = String(b || "").toLowerCase().replace(/\s+/g, " ").slice(0, 280);
  if (!ta || !tb) return false;
  if (ta === tb) return true;
  // simple overlap ratio on tokens
  const sa = new Set(ta.split(" ").filter((w) => w.length > 3));
  const sb = new Set(tb.split(" ").filter((w) => w.length > 3));
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = new Set([...sa, ...sb]).size || 1;
  return inter / union >= 0.72;
}

function analyzeMsmpDuplicates(top) {
  const dups = [];
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      if (top[i].heading === top[j].heading || nearDup(top[i].text, top[j].text)) {
        dups.push({ a: i + 1, b: j + 1, headingA: top[i].heading, headingB: top[j].heading, sameHeading: top[i].heading === top[j].heading });
      }
    }
  }
  return dups;
}

function candidateIndexSelfChecks() {
  const idx = load(candPath);
  const man = load(candMan);
  const active = load(activePath);
  const CITATION_ID = "chunk_05062f25aec1b0c58780677c56a0ce8a7d5689b4412daf7e5866dbbb70a33f0f";
  const BODY_ID = "chunk_c06bb7006f0118654844d379a6c0596f26d8bccbb8c63fcd46a7a88be6fc5de9";
  const HEADING_ID = "chunk_2d2d272bae8e5d754abee169d4da339da897f332698252cc13ffe578884deb78";
  const find = (id) => idx.chunks.find((c) => (c.id || c.chunkId) === id);
  const modelId = "Xenova/all-MiniLM-L6-v2";

  // AC/PC scope using candidate chunks (same logic as assert)
  const { productKnowledgeFolders, selectProductScopedChunks, isProcessControlPrimaryChunk } = require(path.join(root, "lib", "productKnowledgeScope.js"));
  function rankByTerms(question, folders, n = 16) {
    const allow = new Set((folders || []).map((f) => String(f).toLowerCase()));
    const terms = [...new Set((String(question).toLowerCase().match(/[a-z0-9+/]{4,}/g) || []))];
    return idx.chunks
      .filter((c) => !allow.size || allow.has(String(c.sourceFolder || "").toLowerCase()))
      .map((c) => {
        const h = String(c.heading || c.section || "").toLowerCase();
        const f = String(c.sourceFile || "").toLowerCase();
        const b = String(c.content || "").toLowerCase().slice(0, 500);
        let s = 0;
        for (const t of terms) {
          if (h.includes(t)) s += 4;
          if (f.includes(t)) s += 2;
          if (b.includes(t)) s += 1;
        }
        return { c, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, n)
      .map((x) => x.c);
  }
  function scopedFor(question) {
    const folders = productKnowledgeFolders(question);
    const ranked = rankByTerms(question, folders, 20);
    return selectProductScopedChunks(question, ranked);
  }
  const acQ = "How would you lead an SAP GRC Access Control implementation from requirements workshops through production hypercare?";
  const acScoped = scopedFor(acQ);
  const pcQ = "How do I implement a manual assessment in SAP GRC Process Control?";
  const pcScoped = scopedFor(pcQ);
  const ffScoped = scopedFor("How do you configure Firefighter emergency access in SAP GRC Access Control?");
  const msmpScoped = scopedFor("How do you configure an MSMP workflow for an access request in SAP Access Control?");

  const iasChunks = idx.chunks.filter((c) => c.sourceFile === "ias.md");
  const msmpCand = idx.chunks.filter((c) => c.sourceFile === "msmp.md");
  const msmpAct = active.chunks.filter((c) => c.sourceFile === "msmp.md");
  const techCand = msmpCand.filter((c) => /Technical Configuration Sequence/i.test(c.heading || ""));
  const techAct = msmpAct.filter((c) => /Technical Configuration Sequence/i.test(c.heading || ""));
  const cfgCand = msmpCand.filter((c) => /Configure an MSMP workflow/i.test(c.heading || ""));
  const cfgAct = msmpAct.filter((c) => /Configure an MSMP workflow/i.test(c.heading || ""));

  return {
    encoder: {
      embeddingModel: idx.embeddingModel,
      manifestEmbedding: man.embeddingVersion,
      dimsOk: idx.chunks.every((c) => Array.isArray(c.embedding) && c.embedding.length === 384),
      countsMatch: idx.totalChunks === man.totalChunks && idx.chunks.length === man.totalChunks,
      totalChunks: idx.totalChunks
    },
    siblingIdsInCandidate: {
      citation: Boolean(find(CITATION_ID)),
      body: Boolean(find(BODY_ID)),
      heading: Boolean(find(HEADING_ID)),
      citationHeading: find(CITATION_ID)?.heading || null,
      bodyHeading: find(BODY_ID)?.heading || null
    },
    acPcScopeOnCandidate: {
      acHasPcPrimary: acScoped.some((c) => isProcessControlPrimaryChunk(c)),
      acHasProcessControlFile: acScoped.some((c) => /process-control\.md/i.test(c.sourceFile || "")),
      acHasAcLane: acScoped.some((c) => /arm|msmp|brf-plus|ara|brm|firefighter|connectors|grc-overview|grc-principal|grc-scenarios/i.test(c.sourceFile || "")),
      pcHasPc: pcScoped.some((c) => /process-control/i.test(c.sourceFile || "") || /\bProcess Control\b/i.test(c.heading || "")),
      ffHasPcPrimary: ffScoped.some((c) => isProcessControlPrimaryChunk(c)),
      msmpHasPcPrimary: msmpScoped.some((c) => isProcessControlPrimaryChunk(c)),
      msmpHasProcedure: msmpScoped.some((c) => /msmp|brf-plus|arm/i.test(c.sourceFile || "") || /\bMSMP\b|\baccess request\b/i.test(c.heading || ""))
    },
    iasStaleGone: {
      unlikeCI: iasChunks.some((c) => /Unlike Cloud Identity \(which focuses on provisioning/i.test(c.content || "")),
      ciBrings: iasChunks.some((c) => /Cloud Identity brings user data/i.test(c.content || "")),
      suite: iasChunks.some((c) => /SAP Cloud Identity Services/i.test(c.content || "")),
      sourceTarget: iasChunks.some((c) => /source or target/i.test(c.content || ""))
    },
    msmpChunkInventory: {
      activeTotal: msmpAct.length,
      candidateTotal: msmpCand.length,
      activeTechSeq: techAct.length,
      candidateTechSeq: techCand.length,
      activeConfigure: cfgAct.length,
      candidateConfigure: cfgCand.length,
      techSeqPreviews: techCand.map((c) => ({
        id: (c.id || c.chunkId || "").slice(0, 18),
        len: String(c.content || "").length,
        preview: String(c.content || "").replace(/\s+/g, " ").slice(0, 180)
      }))
    }
  };
}

(async () => {
  const msmpQuestions = [
    "How do you configure MSMP in SAP GRC?",
    "Explain the MSMP workflow configuration process.",
    "How do you configure approval stages and paths in MSMP?",
    "Explain SAP GRC Access Control implementation.",
    "How do you troubleshoot an MSMP workflow?"
  ];
  const controlQuestions = [
    "What is SAP IAS?",
    "What is SAP IPS?",
    "What is the difference between IAS and IPS?",
    "How do you secure SAP Fiori?",
    "Explain an SAP GRC Process Control implementation.",
    "How do you configure Firefighter emergency access in SAP GRC?"
  ];

  const self = candidateIndexSelfChecks();
  const activeMsmp = await retrieve("active", activePath, msmpQuestions);
  const candMsmp = await retrieve("candidate", candPath, msmpQuestions);
  const activeCtrl = await retrieve("active-controls", activePath, controlQuestions);
  const candCtrl = await retrieve("candidate-controls", candPath, controlQuestions);

  const msmpCompare = msmpQuestions.map((q, i) => {
    const a = activeMsmp.results[i];
    const c = candMsmp.results[i];
    return {
      question: q,
      activeResolved: a.resolvedIndex,
      candidateResolved: c.resolvedIndex,
      activeTop: a.top,
      candidateTop: c.top,
      activeDups: analyzeMsmpDuplicates(a.top),
      candidateDups: analyzeMsmpDuplicates(c.top),
      activeTechSeqCount: a.top.filter((t) => /Technical Configuration Sequence/i.test(t.heading)).length,
      candidateTechSeqCount: c.top.filter((t) => /Technical Configuration Sequence/i.test(t.heading)).length,
      activeConfigureCount: a.top.filter((t) => /Configure an MSMP/i.test(t.heading)).length,
      candidateConfigureCount: c.top.filter((t) => /Configure an MSMP/i.test(t.heading)).length
    };
  });

  const controls = controlQuestions.map((q, i) => {
    const a = activeCtrl.results[i];
    const c = candCtrl.results[i];
    const aKey = a.top.map((t) => t.path + "::" + t.heading).join(" | ");
    const cKey = c.top.map((t) => t.path + "::" + t.heading).join(" | ");
    return {
      question: q,
      rankingChanged: aKey !== cKey,
      activeTop3: a.top.slice(0, 3).map((t) => `${t.path} | ${t.heading} | ${t.score}`),
      candidateTop3: c.top.slice(0, 3).map((t) => `${t.path} | ${t.heading} | ${t.score}`),
      activeBlur: a.top.filter((t) => /Unlike Cloud Identity|Cloud Identity brings user data|Cloud Identity is the provisioning/i.test(t.text)).length,
      candidateBlur: c.top.filter((t) => /Unlike Cloud Identity|Cloud Identity brings user data|Cloud Identity is the provisioning/i.test(t.text)).length,
      candidateSourceTarget: c.top.some((t) => /source or target/i.test(t.text)),
      activeFiles: [...new Set(a.top.map((t) => t.path))],
      candidateFiles: [...new Set(c.top.map((t) => t.path))]
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    selfChecks: self,
    msmpCompare,
    controls,
    loadProof: {
      activeMsmpIndex: activeMsmp.resolvedIndex,
      candidateMsmpIndex: candMsmp.resolvedIndex,
      activeCtrlIndex: activeCtrl.resolvedIndex,
      candidateCtrlIndex: candCtrl.resolvedIndex
    }
  };
  fs.writeFileSync(path.join(__dirname, "p13-gate-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    wrote: path.join(__dirname, "p13-gate-report.json"),
    selfChecks: self,
    loadProof: report.loadProof,
    msmpSummary: msmpCompare.map((m) => ({
      q: m.question,
      activeTech: m.activeTechSeqCount,
      candTech: m.candidateTechSeqCount,
      activeCfg: m.activeConfigureCount,
      candCfg: m.candidateConfigureCount,
      candDups: m.candidateDups.length,
      activeTop1: m.activeTop[0] && (m.activeTop[0].heading + " @ " + m.activeTop[0].score),
      candTop1: m.candidateTop[0] && (m.candidateTop[0].heading + " @ " + m.candidateTop[0].score)
    })),
    controlsSummary: controls
  }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
