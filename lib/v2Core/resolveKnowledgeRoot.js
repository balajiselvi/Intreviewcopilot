/**
 * Prefer explicit KNOWLEDGE_SOURCE_DIR, then sibling InterviewCopilot_V2 gold KB (175 md),
 * then local ./knowledge.
 */
import fs from "fs";
import path from "path";

export function resolveKnowledgeRoot(cwd = process.cwd()) {
  const fromEnv = String(process.env.KNOWLEDGE_SOURCE_DIR || "").trim();
  if (fromEnv) {
    const abs = path.resolve(cwd, fromEnv);
    if (fs.existsSync(abs)) return abs;
  }

  const siblingV2 = path.resolve(cwd, "..", "InterviewCopilot_V2", "knowledge");
  if (fs.existsSync(siblingV2)) return siblingV2;

  const local = path.resolve(cwd, "knowledge");
  return local;
}

export function applyKnowledgeRootEnv(cwd = process.cwd()) {
  const root = resolveKnowledgeRoot(cwd);
  process.env.KNOWLEDGE_SOURCE_DIR = root;
  return root;
}
