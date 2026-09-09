const { generateAnswer } = require("./lib/generateAnswer");

const Q = "How did you handle user identity provisioning during your S/4HANA cloud migration?";

(async () => {
  const { answer, latencyMs } = await generateAnswer(Q);
  console.log("latencyMs", latencyMs);
  console.log(answer);
  console.log("\n--- layout score ---");
  const checks = [
    ["no layout headings", /DIRECT SPOKEN OPENING|TECHNICAL STEPS AND REAL TIME EVIDENCE|TRAP \/ DEFENSE WARNING/i, false],
    ["first person I", /\bI\b/],
    ["IPS provisioning", /IPS/i],
    ["IAS not mixed as provisioner", /IAS/i],
    ["Dover or SCIM", /Dover|SCIM/i],
    ["no 35 percent", /35\s*%|35 percent/i, false],
    ["no Chalhoub/Accenture", /Chalhoub|Accenture/i, false],
    ["no markdown asterisks", /\*/, false]
  ];
  let failed = 0;
  for (const row of checks) {
    const [name, re, want = true] = row;
    const hit = re.test(answer);
    const ok = hit === want;
    console.log((ok ? "PASS" : "FAIL") + " " + name);
    if (!ok) failed += 1;
  }
  if (failed) process.exit(1);
  console.log("layoutProvisionSmoke: PASS");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
