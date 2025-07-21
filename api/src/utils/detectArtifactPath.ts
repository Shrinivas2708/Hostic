// src/utils/detectArtifactPath.ts
import fs from "fs";
import path from "path";
import type { BuildLogger } from "./logger";

/**
 * Try to find a build output directory.
 * Logs what it checks. Returns absolute path or null.
 */
export function detectArtifactPath(
  workDir: string,
  projectType: string,
  logger: BuildLogger
): string | null {
  logger.log(`🔍 detect artifacts (projectType=${projectType}) in ${workDir}`);

  // Type hints (extend later if wanted)
  const typeHints: Record<string, string[]> = {
    vite: ["dist"],
    react: ["dist", "build"],
    static: ["public", "dist", "build"],
  };

  const candidates = [
    ...(typeHints[projectType] ?? []),
    "dist",
    "build",
    "out",
    "public",
  ];

  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    const full = path.join(workDir, c);
    const exists = fs.existsSync(full);
    logger.log(` • check ${c} -> ${exists ? "FOUND" : "missing"}`);
    if (exists) return full;
  }

  logger.error("No artifact directory found.");
  return null;
}
