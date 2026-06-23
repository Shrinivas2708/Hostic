import { create } from "zustand";
import axios from "../lib/axios";

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

type GitHubStore = {
  status: GitHubStatus | null;
  repos: GitHubRepo[];
  loadingRepos: boolean;
  fetchStatus: () => Promise<GitHubStatus>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchRepos: () => Promise<GitHubRepo[]>;
  fetchRepoDetails: (
    owner: string,
    repo: string
  ) => Promise<{ repo: GitHubRepo; branches: string[] }>;
};

export const useGitHubStore = create<GitHubStore>((set) => ({
  status: null,
  repos: [],
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
    set({ status: { connected: false, username: null }, repos: [] });
  },

  fetchRepos: async () => {
    set({ loadingRepos: true });
    try {
      const res = await axios.get("/github/repos");
      const repos = res.data.repos as GitHubRepo[];
      set({ repos, loadingRepos: false });
      return repos;
    } catch {
      set({ loadingRepos: false });
      throw new Error("Failed to load repositories");
    }
  },

  fetchRepoDetails: async (owner: string, repo: string) => {
    const res = await axios.get(`/github/repos/${owner}/${repo}`);
    return res.data as { repo: GitHubRepo; branches: string[] };
  },
}));
