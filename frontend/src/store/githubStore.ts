import { create } from "zustand";
import axios from "../lib/axios";
import type { DetectedProjectDefaults } from "../lib/projectDefaults";

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  description: string | null;
  updated_at: string;
  owner: string;
  owner_avatar: string;
};

type GitHubStatus = {
  connected: boolean;
  username: string | null;
};

type ReposResult = {
  repos: GitHubRepo[];
  page: number;
  per_page: number;
  has_more: boolean;
};

type GitHubStore = {
  status: GitHubStatus | null;
  repos: GitHubRepo[];
  reposPage: number;
  reposHasMore: boolean;
  loadingRepos: boolean;
  fetchStatus: () => Promise<GitHubStatus>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchRepos: (opts?: {
    page?: number;
    q?: string;
    per_page?: number;
  }) => Promise<ReposResult>;
  clearRepos: () => void;
  fetchRepoDetails: (
    owner: string,
    repo: string
  ) => Promise<{ repo: GitHubRepo; branches: string[] }>;
  fetchProjectDefaults: (
    owner: string,
    repo: string,
    opts?: { branch?: string; dir?: string }
  ) => Promise<DetectedProjectDefaults>;
};

export const useGitHubStore = create<GitHubStore>((set) => ({
  status: null,
  repos: [],
  reposPage: 1,
  reposHasMore: false,
  loadingRepos: false,

  fetchStatus: async () => {
    const res = await axios.get("/github/status");
    const status = res.data as GitHubStatus;
    set({ status });
    return status;
  },

  connect: async () => {
    const res = await axios.get("/github/connect");
    window.location.href = res.data.url;
  },

  disconnect: async () => {
    await axios.delete("/github/disconnect");
    set({
      status: { connected: false, username: null },
      repos: [],
      reposPage: 1,
      reposHasMore: false,
    });
  },

  clearRepos: () => {
    set({ repos: [], reposPage: 1, reposHasMore: false });
  },

  fetchRepos: async (opts) => {
    const page = opts?.page ?? 1;
    const q = opts?.q?.trim() ?? "";
    const per_page = opts?.per_page ?? 10;

    set({ loadingRepos: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(per_page),
      });
      if (q) params.set("q", q);

      const res = await axios.get(`/github/repos?${params.toString()}`);
      const data = res.data as ReposResult;

      set({
        repos: data.repos,
        reposPage: data.page,
        reposHasMore: data.has_more,
        loadingRepos: false,
      });

      return data;
    } catch {
      set({ loadingRepos: false });
      throw new Error("Failed to load repositories");
    }
  },

  fetchRepoDetails: async (owner: string, repo: string) => {
    const res = await axios.get(`/github/repos/${owner}/${repo}`);
    return res.data as { repo: GitHubRepo; branches: string[] };
  },

  fetchProjectDefaults: async (owner, repo, opts) => {
    const params = new URLSearchParams();
    if (opts?.branch) params.set("branch", opts.branch);
    if (opts?.dir) params.set("dir", opts.dir);
    const qs = params.toString();
    const res = await axios.get(
      `/github/repos/${owner}/${repo}/detect${qs ? `?${qs}` : ""}`
    );
    return res.data as DetectedProjectDefaults;
  },
}));
