const fs = require("fs");
const file = "C:/Users/balaj/.cursor/projects/d-My-Projects-InterviewCopilot/terminals/590938.txt";
const start = Date.now();
function tick() {
  const text = fs.readFileSync(file, "utf8");
  const done = text.includes("liveFailures") || text.includes("exit_code");
  const cases = (text.match(/ \| ok \|/g) || []).length + (text.match(/FAIL:/g) || []).length;
  if (done && text.includes("\"total\"")) {
    console.log(text.slice(-2200));
    process.exit(0);
  }
  if (Date.now() - start > 900000) {
    console.log("TIMEOUT cases " + cases);
    console.log(text.slice(-800));
    process.exit(2);
  }
  console.log("progress cases " + cases);
  setTimeout(tick, 20000);
}
tick();
