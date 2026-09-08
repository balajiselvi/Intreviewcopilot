const { recallExperience, formatMemoryCard } = require("./lib/expertiseCards");

const q = process.argv.slice(2).join(" ").trim();
if (!q) {
  console.error('Usage: node eval/prepRecall.js "Tell me about your IAG experience"');
  process.exit(1);
}

const { strongest, secondary } = recallExperience(q);
console.log("QUESTION: " + q);
console.log("\n===== STRONGEST EXPERIENCE =====\n");
console.log(formatMemoryCard(strongest));
if (secondary.length) {
  console.log("\n===== SECONDARY =====\n");
  for (const c of secondary) {
    console.log(c.id + " — " + c.project);
  }
}
console.log("\n===== WHAT NOT TO CLAIM =====");
console.log("- Do not turn KB/product facts into 'I implemented' unless they appear in the card.");
console.log("- Chalhoub, retail, Accenture, Jebel Ali: not in the expertise document.");
console.log("- Metrics marked VERIFY: only speak them if you remember they are true.");
