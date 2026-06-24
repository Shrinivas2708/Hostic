import crypto from "crypto";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET!;

export type GitHubOAuthState = {
  userId: string;
};

export function createGitHubOAuthState(userId: string): string {
  return jwt.sign({ userId }, secret, { expiresIn: "10m" });
}

export function verifyGitHubOAuthState(state: string): GitHubOAuthState | null {
  try {
    const decoded = jwt.verify(state, secret) as GitHubOAuthState;
    if (!decoded?.userId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getGitHubOAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGitHubCallbackUrl(),
    scope: "read:user repo",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function getGitHubCallbackUrl(): string {
  return (
    process.env.GITHUB_CALLBACK_URL ||
    `${(process.env.API_PUBLIC_URL || "http://localhost:5000").replace(/\/$/, "")}/api/github/callback`
  );
}

export function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

export async function exchangeGitHubCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getGitHubCallbackUrl(),
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "OAuth exchange failed");
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type || "bearer",
    scope: data.scope || "",
  };
}

export async function fetchGitHubUser(accessToken: string): Promise<{
  id: number;
  login: string;
  avatar_url: string;
}> {
  const res = await githubFetch(accessToken, "https://api.github.com/user");
  return res.json();
}

export async function githubFetch(
  accessToken: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res;
}

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  description: string | null;
  updated_at: string;
  owner: { login: string; avatar_url: string };
};

export async function listUserReposPaginated(
  accessToken: string,
  options: {
    page?: number;
    per_page?: number;
    q?: string;
    username?: string;
  }
): Promise<{ repos: GitHubRepo[]; has_more: boolean; page: number }> {
  const page = Math.max(1, options.page ?? 1);
  const per_page = Math.min(Math.max(options.per_page ?? 10, 1), 30);

  if (options.q?.trim() && options.username) {
    const query = encodeURIComponent(
      `${options.q.trim()} in:name,description user:${options.username}`
    );
    const res = await githubFetch(
      accessToken,
      `https://api.github.com/search/repositories?q=${query}&per_page=${per_page}&page=${page}&sort=updated`
    );
    const data = (await res.json()) as {
      items: GitHubRepo[];
      total_count: number;
    };
    const items = data.items ?? [];
    return {
      repos: items,
      has_more: page * per_page < (data.total_count ?? 0),
      page,
    };
  }

  const res = await githubFetch(
    accessToken,
    `https://api.github.com/user/repos?per_page=${per_page}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`
  );
  const batch = (await res.json()) as GitHubRepo[];
  return {
    repos: batch,
    has_more: batch.length === per_page,
    page,
  };
}

/** @deprecated Use listUserReposPaginated */
export async function listUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const { repos } = await listUserReposPaginated(accessToken, {
    page: 1,
    per_page: 30,
  });
  return repos;
}

export async function getRepo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const res = await githubFetch(
    accessToken,
    `https://api.github.com/repos/${owner}/${repo}`
  );
  return res.json();
}

export async function listRepoBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const res = await githubFetch(
    accessToken,
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`
  );
  const branches = (await res.json()) as { name: string }[];
  return branches.map((b) => b.name);
}

export async function createRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  payloadUrl: string,
  secret: string
): Promise<number> {
  const res = await githubFetch(
    accessToken,
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push"],
        config: {
          url: payloadUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    }
  );

  const data = (await res.json()) as { id: number };
  return data.id;
}

export async function updateRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  hookId: number,
  updates: {
    active?: boolean;
    secret?: string;
    url?: string;
  }
): Promise<void> {
  const config: Record<string, string> = {};
  if (updates.secret) config.secret = updates.secret;
  if (updates.url) config.url = updates.url;

  await githubFetch(
    accessToken,
    `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        active: updates.active,
        config: Object.keys(config).length ? config : undefined,
      }),
    }
  );
}

export async function deleteRepoWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  hookId: number
): Promise<void> {
  await githubFetch(
    accessToken,
    `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`,
    { method: "DELETE" }
  );
}

export function parseOwnerRepo(
  repoUrl: string
): { owner: string; repo: string } | null {
  const match = repoUrl.trim().match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
