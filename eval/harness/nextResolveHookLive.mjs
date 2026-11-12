/**
 * LIVE-audit resolve hook: Next-style extensionless relative imports ONLY.
 * Does NOT redirect `openai` — real SDK / paid provider required.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

function tryStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "openai") {
    // Explicitly use the real package — never short-circuit to mockOpenai.
    return nextResolve(specifier, context);
  }

  const parent = context.parentURL || "";
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (isRelative && parent.startsWith("file:")) {
    const parentPath = fileURLToPath(parent);
    const baseDir = path.dirname(parentPath);
    const abs = path.resolve(baseDir, specifier);
    const asJs = abs.endsWith(".js") || abs.endsWith(".mjs") || abs.endsWith(".cjs") || abs.endsWith(".json")
      ? abs
      : `${abs}.js`;
    const st = tryStat(asJs);
    if (st?.isFile()) {
      return { shortCircuit: true, url: pathToFileURL(asJs).href };
    }
    const indexJs = path.join(abs, "index.js");
    if (tryStat(indexJs)?.isFile()) {
      return { shortCircuit: true, url: pathToFileURL(indexJs).href };
    }
  }

  return nextResolve(specifier, context);
}
