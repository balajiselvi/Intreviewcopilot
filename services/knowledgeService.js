const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

const { cleanText } = require("../utils/textCleaner");
const { DocumentSchema } = require("../models/contracts");
const { appConfig } = require("../config/appConfig");
const { logger } = require("../lib/logger");

async function extractPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    return cleanText(data.text);
}

async function extractDOCX(filePath) {
    const result = await mammoth.extractRawText({
        path: filePath,
    });

    return cleanText(result.value);
}

async function extractTXT(filePath) {
    const text = fs.readFileSync(filePath, "utf8");

    return cleanText(text);
}

async function readFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {

        case ".pdf":
            return await extractPDF(filePath);

        case ".docx":
            return await extractDOCX(filePath);

        case ".txt":
            return await extractTXT(filePath);

        default:
            return "";
    }
}

function checksum(value) {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
}

function categoryFrom(relativePath) {
    const parts = relativePath.split(path.sep);
    return parts.length > 1 ? parts[0] : "Root";
}

function createDocument({ file, fullPath, rootFolder, stat, content }) {
    const relativePath = path.relative(rootFolder, fullPath);
    const sourceFolder =
        path.dirname(relativePath) === "."
            ? "Root"
            : path.dirname(relativePath);
    const documentId = `doc_${checksum(
        `${appConfig.knowledge.source}:${relativePath.replace(/\\/g, "/")}`
    )}`;
    const documentChecksum = checksum(content);
    const createdAt = (stat.birthtime || stat.ctime).toISOString();
    const updatedAt = stat.mtime.toISOString();

    return DocumentSchema.parse({
        id: documentId,
        documentId,
        documentChecksum,
        checksum: documentChecksum,
        version: appConfig.knowledge.documentVersion,
        createdAt,
        updatedAt,
        source: appConfig.knowledge.source,
        category: categoryFrom(relativePath),
        fileName: file,
        filePath: fullPath,
        sourceFolder,
        extension: path.extname(file).toLowerCase(),
        size: stat.size,
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        content,
        metadata: {
            documentId,
            documentChecksum,
            parserVersion: appConfig.knowledge.parserVersion,
            schemaVersion: appConfig.knowledge.schemaVersion
        }
    });
}

async function scanFolderWithReport(folder, rootFolder = folder, report = {
    documents: [],
    errors: [],
    warnings: []
}) {

    const files = fs.readdirSync(folder);

    for (const file of files) {

        const fullPath = path.join(folder, file);

        try {

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {

                await scanFolderWithReport(fullPath, rootFolder, report);

            } else {

                const content = await readFile(fullPath);

                const document = createDocument({
                    file,
                    fullPath,
                    rootFolder,
                    stat,
                    content
                });

                // Retain legacy aliases for the existing knowledge-test API.
                report.documents.push({
                    ...document,
                    filename: document.fileName,
                    path: document.filePath,
                    characters: document.characterCount,
                    words: document.wordCount,
                    preview: document.content.substring(0, 300)
                });

                logger.info("knowledge.document.loaded", {
                    documentId: document.id,
                    fileName: document.fileName
                });

            }

        } catch (err) {

            const error = {
                stage: "document-load",
                fileName: file,
                message: err instanceof Error ? err.message : String(err)
            };
            report.errors.push(error);
            logger.warn("knowledge.document.failed", {
                fileName: file,
                error: err
            });

        }

    }

    return report;
}

async function scanFolder(folder) {
    const report = await scanFolderWithReport(folder);
    return report.documents;
}

async function loadKnowledgeDocuments(
    folder = appConfig.knowledge.sourceDirectory
) {
    return scanFolder(folder);
}

async function loadKnowledgeDocumentsWithReport(
    folder = appConfig.knowledge.sourceDirectory
) {
    return scanFolderWithReport(folder);
}

module.exports = {

    scanFolder,
    loadKnowledgeDocuments,
    loadKnowledgeDocumentsWithReport

};
