export function buildAnswerStyle(question = "", analysis = {}) {

    const q = question.toLowerCase();

    // What is...?
    if (/^what\s+is/i.test(question)) {
        return `
Start answering immediately.

Do not define SAP in general.

Explain:
- Purpose
- End-to-end execution flow
- SAP components involved
- One implementation nuance

Keep the answer under 120 words.
`;
    }

    // Explain Architecture
    if (q.includes("architecture")) {
        return `
Start with the architecture.

Explain the execution flow in sequence.

Mention:
- Components
- Integration points
- Data flow
- Runtime behaviour

Avoid generic introductions.
`;
    }

    // Difference
    if (
        q.includes("difference") ||
        q.includes("compare") ||
        q.includes("vs")
    ) {
        return `
Start with the core difference.

Then compare:
- Purpose
- Usage
- Configuration
- Example

Finish with one summary sentence.
`;
    }

    // Scenario / Troubleshooting
    if (
        q.includes("scenario") ||
        q.includes("issue") ||
        q.includes("error") ||
        q.includes("troubleshoot")
    ) {
        return `
Answer in this order:

Situation

↓

Analysis

↓

Root Cause

↓

Resolution

↓

Best Practice
`;
    }

    // Default
    return `
Answer naturally like a Senior SAP GRC Architect.

Do not sound like documentation.

Do not start with generic introductions.

Explain the execution flow first.

Mention only relevant SAP components.

Be concise and technically accurate.
`;
}