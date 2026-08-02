function getBlueprint(question, analysis) {

    return {
        opening: "Provide a concise definition.",

        body: [
            { section: "Purpose" },
            { section: "Architecture" },
            { section: "Configuration" },
            { section: "Real Project Example" },
            { section: "Best Practices" }
        ],

        implementationInsight:
            "Explain how it is implemented in enterprise SAP projects.",

        closing:
            "Summarize the business value."
    };

}

module.exports = {
    getBlueprint
};