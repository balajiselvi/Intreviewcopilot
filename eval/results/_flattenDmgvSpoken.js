const fs = require("fs");
const path = require("path");
const { flattenDmgvTemplateToProse } = require("../../lib/generationGuard.js");

const file = path.join(__dirname, "../../lib/verifiedWorkflow.js");
let src = fs.readFileSync(file, "utf8");

const re = /spokenAnswer:\s*\[([\s\S]*?)\]\.join\("\\n"\)/g;
let count = 0;
src = src.replace(re, (full, inner) => {
  if (!/Decision|Mechanism|Governance|Validation/.test(inner)) return full;
  const parts = [];
  const strRe = /"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = strRe.exec(inner))) {
    parts.push(JSON.parse(`"${m[1]}"`));
  }
  if (!parts.length) return full;
  const prose = flattenDmgvTemplateToProse(parts.join("\n"));
  count += 1;
  return `spokenAnswer: ${JSON.stringify(prose)}`;
});

fs.writeFileSync(file, src);
console.log(`converted ${count} spokenAnswer blocks`);
