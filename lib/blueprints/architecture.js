function getBlueprint(question, analysis = {}) {

    return {
        type: "architecture",

        opening:
            "Start with a concise overview of the architecture.",

        body: [
            {
                title: "Purpose",
                instruction:
                    "Explain why this architecture exists."
            },
            {
                title: "Architecture Components",
                instruction:
                    "Describe all major SAP components and their responsibilities."
            },
            {
                title: "Integration Flow",
                instruction:
                    "Explain how the components communicate."
            },
            {
                title: "Implementation",
                instruction:
                    "Describe implementation steps from a real SAP project."
            },
            {
                title: "Best Practices",
                instruction:
                    "Explain enterprise implementation recommendations."
            },
            {
                title: "Common Interview Follow-up",
                instruction:
                    "Mention likely follow-up questions and expected answers."
            }
        ],

        closing:
            "Finish with the business value and architectural benefits."
    };

}

module.exports = {
    getBlueprint
};