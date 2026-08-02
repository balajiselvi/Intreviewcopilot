(async () => {

    const module = await import("./services/embeddingService.js");

    console.log(module);

    const embedding =
        await module.generateEmbedding(
            "What is SAP GRC ARM?"
        );

    console.log(
        "Embedding Length:",
        embedding.length
    );

})();