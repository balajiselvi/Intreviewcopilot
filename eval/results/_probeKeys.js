const fs = require("fs");
function scan(f) {
  if (!fs.existsSync(f)) return { f, exists: false };
  const vars = [];
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    if (!/KEY|OPENAI|ANTHROPIC|AZURE|LLM|GEMINI|GROQ/i.test(m[1])) continue;
    const raw = m[2].trim().replace(/^['"]|['"]$/g, "");
    vars.push({ name: m[1], set: raw.length > 0, len: raw.length });
  }
  return { f, exists: true, vars };
}
for (const f of [".env.local", ".env"]) console.log(JSON.stringify(scan(f), null, 2));
