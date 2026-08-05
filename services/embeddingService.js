let extractor = null;

async function getExtractor() {
    if (!extractor) {
        console.log("Loading embedding model...");

        const { pipeline } = await import("@xenova/transformers");

        extractor = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );

        console.log("Embedding model loaded.");
    }

    return extractor;
}

async function generateEmbedding(text) {
    const model = await getExtractor();

    const output = await model(text, {
        pooling: "mean",
        normalize: true
    });

    return Array.from(output.data);
}

async function generateEmbeddings(chunks) {

    const results = [];

    let i = 0;

    for (const chunk of chunks) {

        console.log(`Embedding ${++i}/${chunks.length}`);

        const embedding = await generateEmbedding(chunk.content);

        results.push({
            ...chunk,
            embedding
        });

    }

    return results;
}

module.exports = {
    generateEmbedding,
    generateEmbeddings
};