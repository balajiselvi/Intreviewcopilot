import { useCallback, useState } from "react";
import Head from "next/head";

/**
 * Interview-day pre-flight. Ready is blocked until server checks pass and mic probe runs.
 */
export default function PreflightPage() {
  const [result, setResult] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runChecks = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/preflight");
      const json = await response.json();
      setResult(json);
    } catch (err) {
      setError(String(err?.message || err));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const probeMic = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setMicOk(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      setMicOk(false);
    }
  }, []);

  const serverReady = Boolean(result?.ready);
  const ready = serverReady && micOk === true;

  return (
    <>
      <Head>
        <title>Interview Copilot — Pre-flight</title>
      </Head>
      <main style={{ fontFamily: "Georgia, serif", maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>Interview-day pre-flight</h1>
        <p style={{ color: "#333", lineHeight: 1.5 }}>
          Ready is blocked until server checks pass and microphone access succeeds. Safe mode is ON by default.
        </p>
        <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
          <button type="button" onClick={runChecks} disabled={busy} style={{ padding: "10px 16px" }}>
            {busy ? "Checking…" : "Run server checks"}
          </button>
          <button type="button" onClick={probeMic} style={{ padding: "10px 16px" }}>
            Probe microphone
          </button>
          <a href="/interview" style={{ padding: "10px 16px", border: "1px solid #333", textDecoration: "none", color: ready ? "#0a0" : "#999", pointerEvents: ready ? "auto" : "none" }}>
            {ready ? "Ready — open interview" : "Ready blocked"}
          </a>
        </div>
        {error ? <p style={{ color: "#a00" }}>{error}</p> : null}
        <p>
          Microphone: {micOk === null ? "not probed" : micOk ? "PASS" : "FAIL"}
          {" · "}
          Server: {result ? (result.ready ? "PASS" : "FAIL") : "not run"}
        </p>
        {result ? (
          <ul style={{ lineHeight: 1.6 }}>
            {(result.checks || []).map((check) => (
              <li key={check.id}>
                <strong>{check.ok ? "PASS" : "FAIL"}</strong> {check.id}: {check.detail}
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </>
  );
}
