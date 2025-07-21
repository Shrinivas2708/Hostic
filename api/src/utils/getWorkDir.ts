// src/utils/getWorkDir.ts
import fs from "fs";
import path from "path";

/**
 * Returns a clean per-build working directory.
 * ALWAYS under <project-root>/tmp/hostit-builds/<buildId>.
 */
export async function getWorkDir(buildId: string): Promise<string> {
  const baseDir = path.join(process.cwd(), "tmp", "hostit-builds");
  const workDir = path.join(baseDir, buildId);

  await fs.promises.mkdir(baseDir, { recursive: true });
  await fs.promises.rm(workDir, { recursive: true, force: true });
  await fs.promises.mkdir(workDir, { recursive: true });

  return workDir;
}
