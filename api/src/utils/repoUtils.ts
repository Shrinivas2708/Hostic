/**
 * Normalize a GitHub repo URL to "owner/repo" for webhook matching.
 */
export function normalizeGitHubRepo(repoUrl: string): string | null {
  const match = repoUrl.trim().match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;
  return `${match[1]}/${match[2]}`.toLowerCase();
}

export function parsePushBranch(ref: string): string | null {
  if (!ref?.startsWith("refs/heads/")) return null;
  return ref.slice("refs/heads/".length);
}
