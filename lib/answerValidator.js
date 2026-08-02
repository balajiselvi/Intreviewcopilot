function validateAnswer(answer, question, evidence = {}) {
    return {
        valid: true,
        score: 100,
        issues: [],
        warnings: [],
        suggestions: []
    };
}

module.exports = {
    validateAnswer
};