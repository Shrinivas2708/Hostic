// src/utils/detectArtifactPath.ts
import fs from "fs";
import path from "path";
import type { BuildLogger } from "./logger";

/**
 * Recursively search for a build output directory (dist, build, etc.).
 * Returns absolute path or null.
 */
export function detectArtifactPath(
  workDir: string,
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

  function searchDir(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (candidates.has(entry.name)) {
          logger.success(`Found output: ${path.relative(workDir, fullPath) || entry.name}`);
          return fullPath;
        }
        const found = searchDir(fullPath);
        if (found) return found;
      }
    }
    return null;
  }

  const result = searchDir(workDir);
  if (!result) logger.error("No build output directory found");
  return result;
}
