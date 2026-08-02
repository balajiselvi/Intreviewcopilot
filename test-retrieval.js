const fs = require("fs");

const index = JSON.parse(
    fs.readFileSync("./data/knowledge-index.json", "utf8")
);

console.log("Total Chunks:", index.totalChunks);

console.log("First File:", index.chunks[0].sourceFile);

console.log("Embedding Length:", index.chunks[0].embedding.length);