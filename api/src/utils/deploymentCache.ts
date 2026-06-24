import crypto from "crypto";
import fs from "fs";
import path from "path";
import git from "simple-git";
import { findProjectRoot } from "./findProjectRoot";
import type { BuildLogger } from "./logger";

const SKIP_COPY_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".git",
]);

const LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"] as const;

export function getDeploymentCacheDir(deploymentId: string): string {
  return path.join(process.cwd(), "tmp", "hostit-cache", deploymentId);
}

export function getLockfileInfo(
  projectRoot: string
): { hash: string; file: string } | null {
  for (const file of LOCKFILES) {
    const lockPath = path.join(projectRoot, file);
    if (fs.existsSync(lockPath)) {
      const content = fs.readFileSync(lockPath);
      return {
        hash: crypto.createHash("sha256").update(content).digest("hex"),
        file,
      };
    }
  }

  const pkgPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    const content = fs.readFileSync(pkgPath);
    return {
      hash: crypto.createHash("sha256").update(content).digest("hex"),
      file: "package.json",
    };
  }

  return null;
}

export async function syncCachedRepo(
  cacheDir: string,
  repoUrl: string,
  branch: string,
  logger: BuildLogger
): Promise<string> {
  const repoDir = path.join(cacheDir, "repo");
  await fs.promises.mkdir(cacheDir, { recursive: true });

  const hasGit = fs.existsSync(path.join(repoDir, ".git"));

  if (!hasGit) {
    if (fs.existsSync(repoDir)) {
      await fs.promises.rm(repoDir, { recursive: true, force: true });
    }
    logger.log(`Cloning branch "${branch}" (first fetch for this deployment)...`);
    await git().clone(repoUrl, repoDir, ["--branch", branch, "--single-branch"]);
    logger.success(`Repository cloned (${branch})`);
  } else {
    logger.log(`Updating cached repository (${branch})...`);
    const g = git(repoDir);
    await g.fetch("origin", branch);
    await g.checkout(branch);
    await g.reset(["--hard", `origin/${branch}`]);
    logger.success(`Repository updated to latest ${branch}`);
  }

  return repoDir;
}

export async function copyRepoToWorkDir(
  repoDir: string,
  workDir: string,
  logger: BuildLogger
): Promise<void> {
  logger.log("Preparing build workspace from cache...");
  await fs.promises.mkdir(workDir, { recursive: true });

  const entries = await fs.promises.readdir(repoDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_COPY_DIRS.has(entry.name)) continue;

    const srcPath = path.join(repoDir, entry.name);
    const destPath = path.join(workDir, entry.name);

    if (entry.isDirectory()) {
      await fs.promises.cp(srcPath, destPath, {
        recursive: true,
        filter: (src) => !shouldSkipCachedPath(src, repoDir),
      });
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }

  logger.log("Workspace ready");
}

function shouldSkipCachedPath(src: string, repoRoot: string): boolean {
  const rel = path.relative(repoRoot, src);
  if (!rel || rel.startsWith("..")) return false;
  return rel.split(path.sep).some((part) => SKIP_COPY_DIRS.has(part));
}

export function resolveProjectRoot(
  workDir: string,
  buildDir: string,
  logger: BuildLogger
): string {
  const normalizedBuildDir = buildDir || "./";
  const fullPath = path.resolve(workDir, normalizedBuildDir);

  if (fs.existsSync(path.join(fullPath, "package.json"))) {
    logger.log(`Using project directory: ${normalizedBuildDir}`);
    return fullPath;
  }

  logger.log(`No package.json in ${normalizedBuildDir}, detecting project root...`);
  const detected = findProjectRoot(workDir);
  if (!detected) {
    throw new Error("package.json not found in repository");
  }

  logger.log(
    `Detected project root: ${path.relative(workDir, detected) || "."}`
  );
  return detected;
}

export async function removeDeploymentCache(deploymentId: string): Promise<void> {
  const cacheDir = getDeploymentCacheDir(deploymentId);
  if (fs.existsSync(cacheDir)) {
    await fs.promises.rm(cacheDir, { recursive: true, force: true });
  }
}
