/**
 * Interview-day latency budgets and trace helpers (EOD hardening).
 * Defaults from sprint: first visible <2.5s, stall 4s, complete <20s.
 */
const crypto = require("crypto");

const BUDGETS_MS = Object.freeze({
  firstToken: Number(process.env.LIVE_BUDGET_FIRST_TOKEN_MS) || 2500,
  stall: Number(process.env.LIVE_BUDGET_STALL_MS) || 4000,
  total: Number(process.env.LIVE_BUDGET_TOTAL_MS) || 20000
});

function createTraceId() {
  try {
    return `tr_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  } catch {
    return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function createStageTimer(traceId = createTraceId()) {
  const startedAt = Date.now();
  const stages = {};
  let firstTokenMs = null;
  let lastChunkAt = null;
  return {
    traceId,
    startedAt,
    budgets: BUDGETS_MS,
    mark(name) {
      stages[name] = Date.now() - startedAt;
      return stages[name];
    },
    markFirstToken() {
      if (firstTokenMs == null) {
        firstTokenMs = Date.now() - startedAt;
        lastChunkAt = Date.now();
        stages.first_token = firstTokenMs;
      } else {
        lastChunkAt = Date.now();
      }
      return firstTokenMs;
    },
    stallExceeded() {
      if (lastChunkAt == null) return false;
      return Date.now() - lastChunkAt > BUDGETS_MS.stall;
    },
    firstTokenExceeded() {
      if (firstTokenMs != null) return false;
      return Date.now() - startedAt > BUDGETS_MS.firstToken;
    },
    totalExceeded() {
      return Date.now() - startedAt > BUDGETS_MS.total;
    },
    snapshot() {
      return {
        traceId,
        firstTokenMs,
        totalMs: Date.now() - startedAt,
        stages: { ...stages },
        budgets: BUDGETS_MS
      };
    }
  };
}

module.exports = {
  BUDGETS_MS,
  createTraceId,
  createStageTimer
};
