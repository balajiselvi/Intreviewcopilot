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
    let reused = 0;

    for (const chunk of chunks) {
        // Unchanged documents already carry embeddings from the prior index.
        // Reuse them so a controlled rebuild only embeds newly parsed chunks.
        if (Array.isArray(chunk.embedding) && chunk.embedding.length > 0) {
            reused += 1;
            results.push(chunk);
            continue;
        }

        console.log(`Embedding ${++i}/${chunks.length - reused}`);

        const embedding = await generateEmbedding(chunk.content);

        results.push({
            ...chunk,
            embedding
        });

    }

    if (reused) {
        console.log(`Reused ${reused} existing embeddings; generated ${i} new embeddings.`);
    }

    return results;
}

module.exports = {
    generateEmbedding,
    generateEmbeddings
};