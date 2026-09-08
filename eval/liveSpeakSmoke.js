const { generateAnswer } = require("./lib/generateAnswer");

const CASES = [
  {
    id: "rationalize",
    q: "How did you rationalize legacy ECC roles when moving to S/4HANA Fiori?",
    want: [/ST03N/i, /20|25/],
    forbid: [/35\s*%/i, /Accenture/i, /Chalhoub/i]
  },
  {
    id: "fiori-dump",
    q: "How do you handle Fiori authorization errors when a user gets an access dump or blank tile?",
    want: [/STAUTHTRACE|ST01/i, /SU53/i],
    forbid: [/Chalhoub/i]
  },
  {
    id: "jml",
    q: "Walk me through how you automated joiner onboarding with SuccessFactors, IPS, and IAS.",
    want: [/IPS/i, /30/],
    forbid: [/15\s*min/i, /100\s*percent/i]
  },
  {
    id: "sod",
    q: "How did you reduce SoD findings that were mostly false positives?",
    want: [/ACTVT|object/i, /70|80/],
    forbid: [/35\s*%/i]
  },
  {
    id: "ips-sync",
    q: "IPS delta sync failed during hypercare and SAC users lost access. What did you do?",
    want: [/SCIM|regex|transform/i],
    forbid: [/Chalhoub/i]
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
    if (/\*\*/.test(a)) {
      console.log("FAIL markdown asterisks");
      failed += 1;
    }
  }
  if (failed) {
    console.error("\nliveSpeakSmoke failures:", failed);
    process.exit(1);
  }
  console.log("\nliveSpeakSmoke: PASS");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
