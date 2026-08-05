const { buildKnowledgeIndex } = require("../services/knowledgeIndexService");

(async () => {
    try {
        console.log("Building knowledge index...");

        const result = await buildKnowledgeIndex();

        console.log(result);

        console.log("Knowledge build completed.");

    } catch (err) {

        console.error(err);

    }
})();