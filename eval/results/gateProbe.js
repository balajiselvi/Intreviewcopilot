async function main() {
  const response = await fetch("http://127.0.0.1:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      question: "Design a GRC SoD architecture.",
      candidateResume: "12+ years in SAP."
    })
  });
  const raw = await response.text();
  console.log("HTTP", response.status, "LEN", raw.length);
  console.log(raw.slice(0, 2500));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
