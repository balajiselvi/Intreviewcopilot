const { generateAnswer } = require("./lib/generateAnswer");
const { CANDIDATE_BACKGROUND } = require("./lib/candidateBackground");

const JD = "Head of Global SAP IT Security & Compliance. IAS=authn, IPS=provision, IAG=governance, app=enforcement.";

const cases = [
  { id: "IPS_IAG", q: "How does IPS differ from IAG?", must: [/^.{0,180}(provision|lifecycle)/i, /govern|SoD|certif|approv/i], mustNot: [/IAS, IPS, IAG, BTP, and Cloud Connector/i], firstIsDistinction: true },
  { id: "MOVER", q: "Someone changes company code inside the same S/4 client. Walk the mover.", must: [/reconcil|replace|legacy|obsolete|remove|deprovision|old/i, /IPS|provision|derived/i], mustNot: [/feeds into IAS for authentication/i] },
  { id: "MINE", q: "How do you actually clean a bloated PFCG catalog without creating more composites?", must: [/AGR_USERS|usage|last logon|ST03/i], mustNot: [/leverage SU24 to maintain accurate proposals/i] },
  { id: "RISE_CC", q: "In RISE private cloud, who owns Cloud Connector and who owns PFCG?", must: [/customer/i], mustNot: [/SAP owns the Cloud Connector|SAP owns PFCG/i] },
  { id: "BEH", q: "Tell me about a time you disagreed with internal audit on an SoD finding.", must: [/I would|I'd |my method|When I|The way I/i], mustNot: [/I encountered a situation|the audit team acknowledged|ticket INC/i] }
];

function wordCount(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

(async () => {
  let failed = 0;
  for (const item of cases) {
    const r = await generateAnswer(item.q, {
      candidateResume: CANDIDATE_BACKGROUND,
      jobDescription: JD
    });
    const a = r.answer || "";
    const wc = wordCount(a);
    const fails = [];
    if (wc > 280) fails.push("too verbose (" + wc + " words)");
    if (wc < 40 && item.id !== "BEH") fails.push("too short (" + wc + ")");
    for (const re of item.must || []) {
      if (!re.test(a)) fails.push("missing " + re);
    }
    for (const re of item.mustNot || []) {
      if (re.test(a)) fails.push("forbidden " + re);
    }
    if (item.firstIsDistinction) {
      const first = a.split(/[.!?]/)[0] || "";
      if (!/IPS|IAG|provision|govern/i.test(first)) fails.push("first sentence not a distinction");
    }
    const ok = fails.length === 0;
    if (!ok) failed += 1;
    console.log("\n==== " + item.id + (ok ? " OK" : " FAIL") + " words=" + wc + " ====\n" + a);
    if (fails.length) console.log("FLAGS: " + fails.join("; "));
  }

  const seedQ = "Design joiner access from SuccessFactors into S/4.";
  const seed = await generateAnswer(seedQ, { candidateResume: CANDIDATE_BACKGROUND, jobDescription: JD });
  const follow = await generateAnswer("Where does IPS fit, and what does it not decide?", {
    candidateResume: CANDIDATE_BACKGROUND,
    jobDescription: JD
  });
  // follow-up via history
  const base = process.env.EVAL_APP_BASE_URL || "http://localhost:3001";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      question: "Who decides they receive the new business role?",
      candidateResume: CANDIDATE_BACKGROUND,
      jobDescription: JD,
      history: [
        { role: "user", content: seedQ },
        { role: "assistant", content: seed.answer },
        { role: "user", content: "Where does IPS fit, and what does it not decide?" },
        { role: "assistant", content: follow.answer }
      ]
    })
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fu = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data: ")) continue;
      const payload = l.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const obj = JSON.parse(payload);
        if (obj.text) fu += obj.text;
      } catch {
        /* ignore */
      }
    }
  }
  const fuOk = /IAG|GRC|business|owner|approv/i.test(fu) && !/IPS decides/i.test(fu);
  console.log("\n==== FOLLOW-UP " + (fuOk ? "OK" : "FAIL") + " ====\n" + fu.trim());
  if (!fuOk) failed += 1;

  console.log("\nSUMMARY failed=" + failed);
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
