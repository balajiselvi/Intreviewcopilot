import path from "node:path";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !path.extname(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}
