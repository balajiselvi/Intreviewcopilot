export function createInterviewChunks(documents) {
    const chunks = [];

    for (const document of documents) {

        const text = document.content || "";

        // Split on interview questions (Q1, Q24, Q125 ...)
        const sections = text.split(/(?=Q\d+\.)/g);

        for (const section of sections) {

            const trimmed = section.trim();

            if (trimmed.length < 100) {
                continue;
            }

            const questionMatch = trimmed.match(/^Q(\d+)\./);

            const questionNumber = questionMatch
                ? questionMatch[1]
                : "Unknown";

            const categoryMatch = text.match(/CATEGORY\s+\d+\s+[–-]\s+(.*)/i);

            const chapterMatch = text.match(/Chapter\s+\d+\s+[–-]\s+(.*)/i);

            chunks.push({
                id: `${document.fileName}-Q${questionNumber}`,
                fileName: document.fileName,
                extension: document.extension,
                questionNumber,
                category: categoryMatch
                    ? categoryMatch[1].trim()
                    : "",
                chapter: chapterMatch
                    ? chapterMatch[1].trim()
                    : "",
                content: trimmed
            });
        }
    }

    return chunks;
}