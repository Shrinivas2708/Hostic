import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@heroui/spinner";
import { useGitHubStore, type GitHubRepo } from "../store/githubStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Github, Globe, Lock, Search, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function GitHubRepoPicker({ open, onClose }: Props) {
  const navigate = useNavigate();
  const {
    repos,
    reposPage,
    reposHasMore,
    loadingRepos,
    fetchRepos,
    clearRepos,
    status,
  } = useGitHubStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search, open]);

  const loadPage = useCallback(
    (page: number, q: string) => {
      fetchRepos({ page, q, per_page: 8 });
    },
    [fetchRepos]
  );

  useEffect(() => {
    if (!open || !status?.connected) return;
    loadPage(1, debouncedSearch);
  }, [open, status?.connected, debouncedSearch, loadPage]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      clearRepos();
    }
  }, [open, clearRepos]);

  if (!open) return null;

  function handleSelect(repo: GitHubRepo) {
    onClose();
    navigate(
      `/deploy?owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}`
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select a GitHub repository"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative flex max-h-[min(520px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-hairline bg-canvas shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h2 className="font-semibold text-on-dark">Select repository</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface-elevated hover:text-on-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-hairline px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-simple">
          {loadingRepos && repos.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner color="default" size="sm" />
            </div>
          ) : repos.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">
              {debouncedSearch
                ? "No repositories match your search."
                : "No repositories found."}
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {repos.map((repo) => (
                <li key={repo.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(repo)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-elevated"
                  >
                    <img
                      src={repo.owner_avatar}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-on-dark">
                          {repo.full_name}
                        </span>
                        {repo.private ? (
                          <Lock className="h-3 w-3 shrink-0 text-muted" />
                        ) : (
                          <Globe className="h-3 w-3 shrink-0 text-muted" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="truncate text-xs text-muted">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
          <Button
            variant="ghost"
            className="h-8 px-3 text-xs"
            disabled={reposPage <= 1 || loadingRepos}
            onClick={() => loadPage(reposPage - 1, debouncedSearch)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted">Page {reposPage}</span>
          <Button
            variant="ghost"
            className="h-8 px-3 text-xs"
            disabled={!reposHasMore || loadingRepos}
            onClick={() => loadPage(reposPage + 1, debouncedSearch)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
