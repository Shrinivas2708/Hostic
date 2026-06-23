import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useGitHubStore } from "../store/githubStore";
import { useAuthStore } from "../store/authStore";
import DeploymentsCard from "../components/DeploymentsCard";
import type { Deployments } from "../store/deployStore";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import { Github, Lock, Globe, RefreshCw } from "lucide-react";

export default function DeploymentsPage() {
  const { deployments, fetchDeployments } = useDeploy();
  const { status, repos, loadingRepos, fetchStatus, connect, disconnect, fetchRepos } =
    useGitHubStore();
  const { fetchUser } = useAuthStore();
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [repoSearch, setRepoSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeployments();
    fetchStatus().then((s) => {
      if (s.connected) fetchRepos();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const github = searchParams.get("github");
    const message = searchParams.get("message");

    if (github === "connected") {
      addToast({
        title: "GitHub connected",
        description: "Pick a repository below to deploy.",
        color: "success",
      });
      fetchUser();
      fetchStatus().then((s) => {
        if (s.connected) fetchRepos();
      });
      setSearchParams({}, { replace: true });
    } else if (github === "error") {
      addToast({
        title: "GitHub connection failed",
        description: message || "Something went wrong",
        color: "danger",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchUser, fetchStatus, fetchRepos]);

  function validateUrl(value: string) {
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(value.trim());
  }

  function handleManualDeploy() {
    const valid = validateUrl(url);
    setClicked(true);
    setIsValid(valid);
    if (valid) navigate(`/deploy?url=${encodeURIComponent(url)}`);
  }

  function handleRepoSelect(repo: { owner: string; name: string }) {
    navigate(`/deploy?owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}`);
  }

  const filteredRepos = repos.filter((r) => {
    const q = repoSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      r.full_name.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <PageContainer>
      <PageHeader
        badge="Deployments"
        title="Your projects"
        description="Connect GitHub to browse repos and auto-deploy on every push."
      />

      <Card padding="md" className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface-elevated">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-on-dark">
                {status?.connected
                  ? `Connected as @${status.username}`
                  : "Connect your GitHub account"}
              </p>
              <p className="text-sm text-muted">
                {status?.connected
                  ? "Select a repo to deploy — webhooks are configured automatically."
                  : "Authorize Hostic to list repos and set up push-to-deploy webhooks."}
              </p>
            </div>
          </div>
          {status?.connected ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => fetchRepos()}
                loading={loadingRepos}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="ghost" onClick={() => disconnect().then(() => fetchUser())}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={() => connect()}>Connect GitHub</Button>
          )}
        </div>
      </Card>

      {status?.connected && (
        <div className="mb-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-on-dark">Your repositories</h2>
            <Input
              placeholder="Search repos..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {loadingRepos && repos.length === 0 ? (
            <div className="flex justify-center py-16">
              <Spinner color="default" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <p className="text-sm text-muted">No repositories found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRepos.map((repo) => (
                <Card
                  key={repo.id}
                  padding="sm"
                  className="cursor-pointer transition-colors hover:border-hairline-strong"
                  onClick={() => handleRepoSelect({ owner: repo.owner, name: repo.name })}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={repo.owner_avatar}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-on-dark">
                          {repo.full_name}
                        </p>
                        {repo.private ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-muted" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                          {repo.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted">
                        Default branch: {repo.default_branch}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-10 border-t border-hairline pt-8">
        <p className="mb-3 text-sm font-medium text-muted">
          Or paste a public repo URL manually
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              placeholder="https://github.com/user/repo"
              className={clsx(
                clicked && !isValid && "border-error focus-visible:ring-error"
              )}
              onChange={(e) => {
                setClicked(false);
                setUrl(e.target.value);
                setIsValid(true);
              }}
              value={url}
              onKeyDown={(e) => e.key === "Enter" && handleManualDeploy()}
            />
            {clicked && !isValid && (
              <p className="mt-2 text-sm text-error">
                Enter a valid GitHub repo URL
              </p>
            )}
          </div>
          <Button onClick={handleManualDeploy} variant="secondary" className="shrink-0">
            Deploy from URL
          </Button>
        </div>
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline py-16 text-center">
          <p className="text-lg font-medium text-on-dark">No deployments yet</p>
          <p className="mt-2 text-sm text-muted">
            {status?.connected
              ? "Select a repository above to deploy your first project."
              : "Connect GitHub or paste a repo URL to get started."}
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-on-dark">
            Active deployments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deployments.map((v: Deployments) => (
              <DeploymentsCard data={v} key={v._id} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
