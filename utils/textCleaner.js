function cleanText(text) {
    if (!text) return "";

    return text
        .replace(/\r/g, "")
        .replace(/\t/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\u0000/g, "")
        .trim();
}

module.exports = {
    cleanText
};