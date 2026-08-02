import { pipeline } from "@xenova/transformers";

let extractor = null;

async function getExtractor() {
    if (!extractor) {
        console.log("Loading embedding model...");
        extractor = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
        console.log("Embedding model loaded.");
    }

    return extractor;
}

export async function generateEmbedding(text) {

    const model = await getExtractor();

    const output = await model(text, {
        pooling: "mean",
        normalize: true
    });

    return Array.from(output.data);

}

export async function generateEmbeddings(chunks) {

    const results = [];

    for (let i = 0; i < chunks.length; i++) {

        console.log(`Embedding ${i + 1} of ${chunks.length}`);

        const embedding = await generateEmbedding(chunks[i].content);

        results.push({
            ...chunks[i],
            embedding
        });

    }

    return results;

}