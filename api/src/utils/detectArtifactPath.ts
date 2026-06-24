// src/utils/detectArtifactPath.ts
import fs from "fs";
import path from "path";
import type { BuildLogger } from "./logger";

/**
 * Recursively search for a build output directory (dist, build, etc.).
 * Returns absolute path or null.
 */
export function detectArtifactPath(
  projectRoot: string,
  projectType: string,
  logger: BuildLogger
): string | null {
  logger.log(`Detecting build output (${projectType})`);

  const typeHints: Record<string, string[]> = {
    vite: ["dist"],
    react: ["dist", "build"],
    static: ["public", "dist", "build"],
  };

  const candidates = new Set([
    ...(typeHints[projectType] ?? []),
    "dist",
    "build",
    "out",
    "public",
  ]);

  function searchDir(dir: string, depth: number): string | null {
    if (depth > 4) return null;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;

        if (candidates.has(entry.name)) {
          logger.success(
            `Found output: ${path.relative(projectRoot, fullPath) || entry.name}`
          );
          return fullPath;
        }

        const found = searchDir(fullPath, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const result = searchDir(projectRoot, 0);
  if (!result) logger.error("No build output directory found");
  return result;
}
