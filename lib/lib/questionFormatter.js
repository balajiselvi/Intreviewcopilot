export function formatInterviewQuestion(question = "") {
    const q = question.toLowerCase();

    if (
        /^which/i.test(question) ||
        /^list/i.test(question) ||
        /^name/i.test(question) ||
        q.includes("transaction code") ||
        q.includes("t-code") ||
        q.includes("tables") ||
        q.includes("authorization object")
    ) {
        return {
            type: "inventory",
            prompt: `${question}

OUTPUT FORMAT (MANDATORY)

Return category headings with bullet points.

For every item include one concise purpose.

Never answer in paragraph form.`
        };
    }

    return {
        type: "default",
        prompt: question
    };
}