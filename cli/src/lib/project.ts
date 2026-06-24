import fs from "fs";
import path from "path";
import simpleGit from "simple-git";

export type GitContext = {
  repoUrl: string;
  branch: string;
  repoRoot: string;
  /** Path from repo root to cwd, e.g. "frontend" (empty at repo root) */
  projectDir: string;
};

export function normalizeRepoUrl(url: string): string {
  const trimmed = url.trim().replace(/\.git$/, "");
  const ssh = trimmed.match(/^git@github\.com:(.+)$/i);
  if (ssh) return `https://github.com/${ssh[1]}`;
  return trimmed;
}

/** Walk up from cwd to find the directory that contains `.git`. */
export function findGitRoot(start: string): string | null {
  let dir = path.resolve(start);
  const { root } = path.parse(dir);

  while (true) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

export async function detectGitContext(cwd: string): Promise<GitContext | null> {
  const resolved = path.resolve(cwd);
  const repoRoot = findGitRoot(resolved);
  if (!repoRoot) return null;

  const git = simpleGit(repoRoot);

  let branch = "main";
  try {
    const ref = (await git.revparse(["--abbrev-ref", "HEAD"])).trim();
    if (ref && ref !== "HEAD") branch = ref;
  } catch {
    // Repo exists but has no commits yet — default branch name
  }

  const remotes = await git.getRemotes(true);
  const origin = remotes.find((r) => r.name === "origin");
  const rawUrl = origin?.refs?.fetch ?? origin?.refs?.push;
  if (!rawUrl) return null;

  const rel = path.relative(repoRoot, resolved);
  const projectDir =
    rel && rel !== "." ? rel.split(path.sep).join("/") : "";

  return {
    repoUrl: normalizeRepoUrl(rawUrl),
    branch,
    repoRoot,
    projectDir,
  };
}

export type ProjectDefaults = {
  project_type: "react" | "vite" | "static";
  installCommands: string;
  buildCommands: string;
};

export function detectProjectDefaults(cwd: string): ProjectDefaults {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return {
      project_type: "static",
      installCommands: "npm ci",
      buildCommands: "npm run build",
    };
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasVite = Boolean(deps.vite);
  const hasReact = Boolean(deps.react);

  let project_type: ProjectDefaults["project_type"] = "static";
  if (hasVite) project_type = "vite";
  else if (hasReact) project_type = "react";

  const buildCommands = pkg.scripts?.build
    ? "npm run build"
    : project_type === "static"
      ? "echo no build"
      : "npm run build";

  const installCommands = fs.existsSync(path.join(cwd, "package-lock.json"))
    ? "npm ci"
    : "npm install";

  return {
    project_type,
    installCommands,
    buildCommands,
  };
}

export function buildDirFromProjectPath(projectDir: string): string {
  if (!projectDir) return "./";
  return `./${projectDir.replace(/\\/g, "/")}`;
}

/** Normalize build dir for matching deployments (./frontend === frontend). */
export function normalizeBuildDirForMatch(buildDir?: string): string {
  const raw = (buildDir ?? "./").trim().replace(/\\/g, "/");
  if (!raw || raw === ".") return "./";
  return `./${raw.replace(/^\.\/+/, "").replace(/\/$/, "")}`;
}
