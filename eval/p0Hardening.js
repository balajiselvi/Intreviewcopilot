const { generateAnswer } = require("./lib/generateAnswer");

const JD = `Head of Global SAP IT Security & Compliance. Landscape: S/4, SuccessFactors, BW/4, SAC, Datasphere, Ariba, CAR, BTP, RISE. Planes: SF=HR attributes; IAS=authn; IPS=provisioning; IAG=governance; app=enforcement.`;

const opts = { jobDescription: JD };

function deniesSapOwnsConnector(answer) {
  return /never.{0,48}SAP owns/i.test(answer)
    || /SAP does not own/i.test(answer)
    || /do not say SAP owns/i.test(answer)
    || /not (?:always )?(?:make )?SAP (?:the )?Cloud Connector/i.test(answer);
}

function hasBadFab(answer) {
  if (/partners handled|outsourced infrastructure|business refused to split/i.test(answer)) return true;
  if (/SAP owns (?:the )?Cloud Connector/i.test(answer) && !deniesSapOwnsConnector(answer)) return true;
  if (/\bI (?:worked|led|ran).{0,40}(Accenture|Chalhoub)/i.test(answer)) return true;
  return false;
}

function score(item, answer) {
  const fails = [];
  for (const re of item.must || []) {
    if (!re.test(answer)) fails.push("missing " + re);
  }
  for (const re of item.mustNot || []) {
    if (re.test(answer)) {
      if (deniesSapOwnsConnector(answer) && /SAP owns/.test(String(re))) continue;
      fails.push("forbidden " + re);
    }
  }
  if (hasBadFab(answer) && !(item.allowFabricationHit)) fails.push("fabrication/ownership pattern");
  return fails;
}

function sacHistory() {
  return [
    { role: "user", content: "Explain SAC security." },
    { role: "assistant", content: "I keep SAC teams and stories separate from Datasphere and S/4 data rights after IAS login. If login works, I check team and folder rights on the story, then the model and source." }
  ];
}

const cases = [
  {
    id: "P0.1-orig",
    q: "Login works. Can the user still be blocked from the story?",
    history: sacHistory(),
    must: [/story|team|folder|content|model/i],
    mustNot: [/XSUAA/i]
  },
  ...[
    "SSO succeeds but the story is blank.",
    "They can log in. Why is the SAC story still denied?",
    "Authentication is fine. They cannot open the story.",
    "Login is successful. Still blocked from the story.",
    "IAS login works. Can content still hide the story?",
    "The user authenticates. The story does not appear.",
    "Password works. They cannot see that story.",
    "Is it still IAS if login already works?",
    "Same user, same story, still no access after login.",
    "Cannot see the story after a successful login."
  ].map((q, i) => ({
    id: "P0.1-p" + (i + 1),
    q,
    history: sacHistory(),
    must: [/story|team|folder|content|model|SAC/i],
    mustNot: [/XSUAA/i]
  })),
  {
    id: "P0.1-neg-btp",
    q: "What about BTP XSUAA role collections?",
    history: sacHistory(),
    must: [/XSUAA|role collection/i]
  },
  {
    id: "P0.1-pos-first",
    q: "Explain SAC security.",
    must: [/SAC|Analytics Cloud|team|folder|story/i],
    mustNot: [/XSUAA/i]
  },
  {
    id: "P0.2-friday-leaver",
    q: "An employee resigns Friday at 17:00. How do you remove SAP access before Monday?",
    must: [/IPS|SCIM|SuccessFactors|lifecycle/i],
    mustNot: [/notify IT Monday|wait until Monday|manual SU01|lock them in SU01/i]
  },
  ...[
    "Leaver at 5pm Friday. What happens to S/4 and IAS over the weekend?",
    "How do you handle a same-day termination in a hybrid SF IPS landscape?",
    "Contractor last day is Friday evening. How is access revoked?",
    "HR marks the employee as terminated at close of business Friday. What runs?",
    "Do we lock the user in SU01 when someone leaves on Friday night?",
    "Weekend leaver: who removes BTP, SAC, and S/4 access?",
    "Immediate leaver after 17:00. Is the control SU01?",
    "SuccessFactors termination Friday. When does target access die?",
    "How should a hybrid leaver be processed instead of a helpdesk ticket Monday?",
    "If IT is offline until Monday, how does the Friday leaver still lose access?"
  ].map((q, i) => ({
    id: "P0.2-leaver-p" + (i + 1),
    q,
    must: [/IPS|SCIM|deprovision|revok|lifecycle/i],
    mustNot: [/notify IT Monday|wait until Monday/i]
  })),
  {
    id: "P0.2-future-joiner",
    q: "HR already created a future-dated hire in SuccessFactors. Should we create the IAS account today?",
    must: [/effective|start date|active|until|lifecycle|not merely|when the hire/i],
    mustNot: [/create the IAS account immediately|create IAS today|provision today because HR/i]
  },
  ...[
    "The employee record exists but start date is next month. Do we provision IAS now?",
    "Future-dated joiner in SF. When does IPS create S/4 access?",
    "Hire is in SuccessFactors with a future effective date. Immediate IAS?",
    "Should an inactive future employee get a live IAS user?",
    "Joiner record saved today, start date in two weeks. What do you provision now?",
    "Does an HR row alone justify creating the IAS account?",
    "Pre-hire in SuccessFactors Employee Central. Baseline S/4 roles today or after the start date?",
    "When does a future-dated joiner become an active identity?",
    "IPS source has the person. Access should wait until when?",
    "Do not skip effective dating: future joiner IAS policy."
  ].map((q, i) => ({
    id: "P0.2-joiner-p" + (i + 1),
    q,
    must: [/effective|start date|active|until|not yet|lifecycle/i],
    mustNot: [/immediately create IAS|create IAS today because HR/i]
  })),
  {
    id: "P0.2-mover",
    q: "The user moves from Finance to Retail. What happens to old and new access?",
    must: [/revok|remove|obsolete|old/i],
    mustNot: [/append only|keep Finance and add Retail without/i]
  },
  {
    id: "P0.3-cc",
    q: "In RISE with SAP, who owns the Cloud Connector?",
    must: [/customer|on-prem|on premise|operated/i],
    mustNot: [/SAP owns (?:the )?Cloud Connector|SAP operates (?:the )?Cloud Connector/i]
  },
  ...[
    "Does SAP operate Cloud Connector in a typical RISE hybrid setup?",
    "Who manages SCC next to a RISE private cloud?",
    "Cloud Connector ownership in RISE: customer or SAP?",
    "Is Cloud Connector part of SAP-managed RISE infrastructure?",
    "Where does Cloud Connector sit in hybrid RISE connectivity?",
    "Can I say SAP owns Cloud Connector on RISE?",
    "Who patches and operates the on-premises Cloud Connector?",
    "RISE shared responsibility: Cloud Connector versus hyperscaler ops.",
    "Principal propagation through Cloud Connector: who runs the box?",
    "Does the RISE contract always make SAP the Cloud Connector operator?"
  ].map((q, i) => ({
    id: "P0.3-p" + (i + 1),
    q,
    must: [/customer|on-prem|on premise|contract/i],
    mustNot: [/SAP owns (?:the )?Cloud Connector/i]
  })),
  {
    id: "P0.4-partners",
    q: "Walk me through how you configured IAG. Did partners handle the infrastructure?",
    must: [/IAG/i],
    mustNot: [/partners handled|partner owned infrastructure|outsourced the infrastructure/i]
  },
  {
    id: "P0.4-star",
    q: "Tell me about a time the business refused to split a conflicting role.",
    must: [/I would|my approach|mitigat|The way I/i],
    mustNot: [/I encountered a situation|business refused to split|they refused to split/i]
  },
  {
    id: "P0.4-metric",
    q: "A stakeholder challenges why S_TABU_DIS is too broad. What do you say? Do not talk about SoD false positives.",
    mustNot: [/70\s*[–-]\s*80|70 to 80|70-80/]
  },
  {
    id: "P0.4-eminov",
    q: "Did you work with IAS at Eminnov, or only IDM 8.0?",
    must: [/IAS/i],
    mustNot: [/did not work directly with IAS|no IAS at Eminnov|IAS was not part of Eminnov/i]
  },
  { id: "CTRL-iag-ips", q: "Where does IPS fit in joiner handling, and what does it not decide?", must: [/IPS|provision/i], mustNot: [/IPS approves SoD|IPS authenticates/i] },
  { id: "CTRL-ias-ips", q: "What belongs in IAS versus IPS?", must: [/authenticat/i], mustNot: [/IAS provisions|IPS authenticates/i] },
  { id: "CTRL-ariba", q: "How is access actually controlled inside an Ariba realm?", must: [/group|permission|realm/i], mustNot: [/PFCG role in Ariba/i] },
  { id: "CTRL-car", q: "How would you secure SAP Customer Activity Repository POS data?", must: [/CAR|HANA|POS|blueprint/i] },
  { id: "CTRL-fiori", q: "How do you handle Fiori authorization errors when a user gets a blank tile?", must: [/catalog|STAUTHTRACE|ST01|SU53/i] },
  { id: "CTRL-rat", q: "How did you rationalize legacy ECC roles when moving to S/4HANA Fiori?", must: [/ST03N|ST10/i] },
  { id: "CTRL-sod", q: "How did you reduce SoD findings that were mostly false positives?", must: [/ACTVT|70|80/i] },
  { id: "CTRL-anti-fab", q: "Which Accenture and Chalhoub programmes did you lead?", must: [/Dover|Eminnov|Fabtech|not|never/i], mustNot: [/I led (the )?(Accenture|Chalhoub)|I worked at (Accenture|Chalhoub)/i] }
];

(async () => {
  let failed = 0;
  for (const item of cases) {
    const r = await generateAnswer(item.q, { ...opts, history: item.history });
    const fails = score(item, r.answer || "");
    const status = fails.length ? "FAIL" : "OK";
    if (fails.length) failed += 1;
    console.log("\n==== " + item.id + " " + status + " (" + r.latencyMs + "ms) ====");
    console.log(r.answer);
    if (fails.length) console.log("FLAGS: " + fails.join("; "));
  }
  console.log("\nSUMMARY failed=" + failed + "/" + cases.length);
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
