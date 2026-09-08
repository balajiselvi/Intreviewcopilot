const { generateAnswer } = require("./lib/generateAnswer");

function flags(label, answer, checks) {
  const text = answer || "";
  const lower = text.toLowerCase();
  console.log("\n==== " + label + " ====\n" + text + "\nlen=" + text.length);
  for (const [name, re, want] of checks) {
    const hit = re.test(text) || re.test(lower);
    const ok = want ? hit : !hit;
    console.log((ok ? "OK  " : "FAIL") + " " + name);
  }
}

(async () => {
  const hyper = await generateAnswer(
    "How would you run SAP security hypercare in the first two weeks after an S/4 go-live?"
  );
  flags("HYPERCARE", hyper.answer, [
    ["mentions SUIM or PFUD or Firefighter or IPS", /SUIM|PFUD|Firefighter|IPS|IAG|gold matrix/i, true],
    ["does not treat SU53 as the hypercare operating model lead", /monitoring tools \(st03\/sm21\/su53\)|sign off.*SU53|SU53.*exit criteria/i, false],
    ["no fabricated recent ticket", /last year I|I remember when I fixed|ticket INC/i, false]
  ]);

  const beh = await generateAnswer(
    "Tell me about a production access incident you personally resolved last year."
  );
  flags("BEH", beh.answer, [
    ["methodology voice", /I would|my method|When I approach|I'd handle/i, true],
    ["no invented incident", /I remember when|last year I resolved|ticket #|INC\d/i, false]
  ]);

  const neg = await generateAnswer(
    "A user gets SU53 after FB01. How do you diagnose it?"
  );
  flags("NEG_SU53", neg.answer, [
    ["still allows SU53 for diagnosis", /SU53|STAUTHTRACE|ST01/i, true]
  ]);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
