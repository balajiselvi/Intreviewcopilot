function getBlueprint(question, analysis = {}) {

    return {
        type: "concept",

        opening:
            "Start with a concise definition in 2-3 sentences.",

        body: [
            {
                title: "Business Purpose",
                instruction:
                    "Explain why this SAP component or feature exists."
            },
            {
                title: "Technical Explanation",
                instruction:
                    "Explain how it works technically."
            },
            {
                title: "Configuration",
                instruction:
                    "Describe important configuration or setup steps."
            },
            {
                title: "Real Project Example",
                instruction:
                    "Give a realistic implementation example from an SAP project."
            },
            {
                title: "Best Practices",
                instruction:
                    "Mention enterprise best practices."
            },
            {
                title: "Common Interview Follow-up",
                instruction:
                    "Mention likely follow-up questions."
            }
        ],

        closing:
            "Summarize the key takeaway in one sentence."
    };

}

module.exports = {
    getBlueprint
};