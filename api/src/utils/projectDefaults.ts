export type ProjectType = "react" | "vite" | "static";

export type DetectedProjectDefaults = {
  project_type: ProjectType;
  installCommands: string;
  buildCommands: string;
};

export function normalizeBuildDirQuery(buildDir?: string): string {
  const raw = (buildDir ?? "./").trim().replace(/\\/g, "/");
  if (!raw || raw === ".") return "";
  return raw.replace(/^\.\/+/, "").replace(/\/$/, "");
}

export function packageJsonPath(buildDir?: string): string {
  const dir = normalizeBuildDirQuery(buildDir);
  return dir ? `${dir}/package.json` : "package.json";
}

export function packageLockPath(buildDir?: string): string {
  const dir = normalizeBuildDirQuery(buildDir);
  return dir ? `${dir}/package-lock.json` : "package-lock.json";
}

export function detectProjectDefaultsFromPackageJson(
  pkgJson: string | null,
  hasPackageLock: boolean
): DetectedProjectDefaults {
  if (!pkgJson) {
    return {
      project_type: "static",
      installCommands: "npm ci",
      buildCommands: "npm run build",
    };
  }

  let pkg: {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  try {
    pkg = JSON.parse(pkgJson);
  } catch {
    return {
      project_type: "static",
      installCommands: "npm ci",
      buildCommands: "npm run build",
    };
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasVite = Boolean(deps.vite);
  const hasReact = Boolean(deps.react);

  let project_type: ProjectType = "static";
  if (hasVite) project_type = "vite";
  else if (hasReact) project_type = "react";

  const buildCommands = pkg.scripts?.build
    ? "npm run build"
    : project_type === "static"
      ? "echo no build"
      : "npm run build";

  const installCommands = hasPackageLock ? "npm ci" : "npm install";

  return {
    project_type,
    installCommands,
    buildCommands,
  };
}
