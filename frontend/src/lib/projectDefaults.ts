export type ProjectType = "react" | "vite" | "static";

export type DetectedProjectDefaults = {
  project_type: ProjectType;
  installCommands: string;
  buildCommands: string;
  detected: boolean;
  package_json_path: string;
  branch: string;
  buildDir: string;
};

export function parseGithubRepoUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.trim().match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
