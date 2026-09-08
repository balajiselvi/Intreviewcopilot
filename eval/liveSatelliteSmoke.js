const { generateAnswer } = require("./lib/generateAnswer");

const CASES = [
  {
    id: "sac",
    q: "Tell me about your SAP Analytics Cloud security experience.",
    want: [/\bI\b/, /IAS/i],
    forbid: [/Chalhoub|Accenture/i, /I configured every SAC/i]
  },
  {
    id: "ariba",
    q: "What is your SAP Ariba security and JML experience?",
    want: [/IPS/i, /IAS/i],
    forbid: [/Chalhoub/i]
  },
  {
    id: "car",
    q: "Tell me about your SAP CAR security experience.",
    want: [/blueprint|architecture|not the same/i],
    forbid: [/I configured CAR DCL/i, /Chalhoub/i]
  },
  {
    id: "five",
    q: "How do S/4, SuccessFactors, IAG, IAS, IPS and SAC work together?",
    want: [/IAS/i, /IPS/i, /IAG/i],
    forbid: [/Chalhoub/i]
  },
  {
    id: "mover",
    q: "What happens if a user changes from Finance to Retail?",
    want: [/revok/i, /IPS/i],
    forbid: [/Chalhoub/i]
  },
  {
    id: "ias-trap",
    q: "Can IAS authorize access to SAC, Datasphere and Ariba?",
    want: [/not/i, /authenticat/i],
    forbid: [/IAS is the authorization authority/i]
  }
];

(async () => {
  let failed = 0;
  for (const c of CASES) {
    const r = await generateAnswer(c.q);
    const a = r.answer || "";
    console.log("\n======== " + c.id + " (" + r.latencyMs + "ms) ========\n" + a);
    for (const re of c.want) {
      if (!re.test(a)) {
        console.log("FAIL missing " + re);
        failed += 1;
      }
    }
    for (const re of c.forbid) {
      if (re.test(a)) {
        console.log("FAIL forbidden " + re);
        failed += 1;
      }
    }
  }
  if (failed) {
    console.error("\nliveSatelliteSmoke failures:", failed);
    process.exit(1);
  }
  console.log("\nliveSatelliteSmoke: PASS");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
