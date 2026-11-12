/**
 * Interview-day pre-flight checks. Blocks Ready when any check fails.
 * Offline-safe: does not spend paid LLM calls.
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import net from "net";

const require = createRequire(import.meta.url);
const APP_CONFIG = require("../../config/appConfig.js");
const { loadLiteChunks, resetKnowledgeCache } = require("../../lib/liveReliability.js");
const { loadPack, DEFAULT_PROFILE_SLUG } = require("../../lib/preparedAnswerPack.js");
const { BUDGETS_MS } = require("../../lib/liveBudgets.js");
const { buildPrincipleLevelFallback } = require("../../lib/generationGuard.js");

export const config = { api: { bodyParser: { sizeLimit: "32kb" } } };

function hasApiKey() {
  try {
    const keys = APP_CONFIG?.llm?.apiKeys || {};
    return Boolean(keys.openai || keys.anthropic || keys.gemini || keys.groq || keys.openrouter);
  } catch {
    return false;
  }
}

function productionBuildPresent() {
  try {
    return fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "method-not-allowed" });
    }

    const profileSlug = String(
      req.query.profile || req.body?.profileSlug || process.env.INTERVIEW_PROFILE_SLUG || DEFAULT_PROFILE_SLUG
    );
    const port = Number(process.env.PORT || req.query.port || 3102);
    const checks = [];

    const apiKeyOk = hasApiKey();
    checks.push({
      id: "api_key",
      ok: apiKeyOk,
      detail: apiKeyOk ? "provider key present" : "no provider API key configured"
    });

    let networkOk = true;
    try {
      await new Promise((resolve, reject) => {
        const socket = net.connect({ host: "127.0.0.1", port: port > 0 ? port : 3102 }, () => {
          socket.end();
          resolve();
        });
        socket.on("error", reject);
        socket.setTimeout(1500, () => {
          socket.destroy();
          reject(new Error("timeout"));
        });
      });
    } catch {
      networkOk = false;
    }
    checks.push({
      id: "network_local",
      ok: networkOk,
      detail: networkOk ? `loopback :${port} reachable` : `loopback :${port} not reachable`
    });

    const prod = productionBuildPresent();
    const isProdProcess = process.env.NODE_ENV === "production";
    checks.push({
      id: "production_build",
      ok: prod || process.env.ALLOW_DEV_PREFLIGHT === "1",
      detail: prod
        ? ".next BUILD_ID present"
        : (process.env.ALLOW_DEV_PREFLIGHT === "1"
          ? "dev bypass ALLOW_DEV_PREFLIGHT=1"
          : ".next BUILD_ID missing — run next build or set ALLOW_DEV_PREFLIGHT=1")
    });
    checks.push({
      id: "production_process",
      ok: isProdProcess || process.env.ALLOW_DEV_PREFLIGHT === "1",
      detail: isProdProcess
        ? "NODE_ENV=production"
        : (process.env.ALLOW_DEV_PREFLIGHT === "1"
          ? "dev bypass ALLOW_DEV_PREFLIGHT=1"
          : "not production process (set ALLOW_DEV_PREFLIGHT=1 to bypass in lab)")
    });

    let warmOk = false;
    let chunkCount = 0;
    try {
      resetKnowledgeCache();
      const chunks = loadLiteChunks();
      chunkCount = Array.isArray(chunks) ? chunks.length : 0;
      warmOk = chunkCount > 0;
      checks.push({
        id: "index_warm",
        ok: warmOk,
        detail: warmOk ? `${chunkCount} chunks loaded` : "knowledge index empty or unreadable"
      });
    } catch (error) {
      checks.push({ id: "index_warm", ok: false, detail: String(error?.message || error) });
    }

    const pack = loadPack(profileSlug);
    const approved = (pack.approvedEntries || []).length;
    checks.push({
      id: "prepared_pack",
      ok: pack.status !== "error",
      detail: `profile=${profileSlug}; entries=${(pack.entries || []).length}; approved=${approved}; status=${pack.status}`
    });

    const started = Date.now();
    const selfTestAnswer = buildPrincipleLevelFallback(
      "How do you configure an MSMP workflow for access requests?"
    );
    const selfTestMs = Date.now() - started;
    const selfOk = Boolean(selfTestAnswer) && selfTestMs < BUDGETS_MS.total;
    checks.push({
      id: "self_test_principle",
      ok: selfOk,
      detail: `principle fallback in ${selfTestMs}ms (offline; not a live LLM timing)`
    });

    checks.push({
      id: "mic_system_audio",
      ok: true,
      detail: "client-side check required in browser (reported separately)"
    });

    const failed = checks.filter((c) => !c.ok && c.id !== "mic_system_audio");
    const ready = failed.length === 0;

    return res.status(200).json({
      ok: ready,
      ready,
      blocked: !ready,
      profileSlug,
      port,
      budgetsMs: BUDGETS_MS,
      checks,
      failures: failed.map((c) => c.id),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      ready: false,
      blocked: true,
      error: String(error?.message || error),
      checks: [{ id: "handler", ok: false, detail: String(error?.message || error) }],
      failures: ["handler"],
      timestamp: new Date().toISOString()
    });
  }
}
