import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useGitHubStore } from "../store/githubStore";
import { useAuthStore } from "../store/authStore";
import DeploymentsCard from "../components/DeploymentsCard";
import { GitHubRepoPicker } from "../components/GitHubRepoPicker";
import type { Deployments } from "../store/deployStore";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import { Github, Plus } from "lucide-react";

export default function DeploymentsPage() {
  const { deployments, fetchDeployments } = useDeploy();
  const { status, fetchStatus, connect, disconnect } = useGitHubStore();
  const { fetchUser } = useAuthStore();
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeployments();
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const github = searchParams.get("github");
    const message = searchParams.get("message");

    if (github === "connected") {
      addToast({
        title: "GitHub connected",
        description: "Click New deployment to pick a repository.",
        color: "success",
      });
      fetchUser();
      fetchStatus();
      setSearchParams({}, { replace: true });
      setPickerOpen(true);
    } else if (github === "error") {
      addToast({
        title: "GitHub connection failed",
        description: message || "Something went wrong",
        color: "danger",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchUser, fetchStatus]);

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

  function handleNewDeployment() {
    if (status?.connected) {
      setPickerOpen(true);
      return;
    }
    connect();
  }

  return (
    <PageContainer>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          badge="Deployments"
          title="Your projects"
          description="Manage live deployments and push new projects from GitHub."
          className="mb-0"
        />
        <Button onClick={handleNewDeployment} className="shrink-0">
          <Plus className="h-4 w-4" />
          New deployment
        </Button>
      </div>

      {status?.connected && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <Github className="h-4 w-4" />
            <span>
              GitHub connected as{" "}
              <span className="font-medium text-on-dark">@{status.username}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => disconnect().then(() => fetchUser())}
            className="text-xs text-muted underline hover:text-on-dark"
          >
            Disconnect
          </button>
        </div>
      )}

      {deployments.length === 0 ? (
        <Card padding="lg" className="mb-8 text-center">
          <p className="text-lg font-medium text-on-dark">No deployments yet</p>
          <p className="mt-2 text-sm text-muted">
            {status?.connected
              ? "Click New deployment to pick a repo from GitHub."
              : "Connect GitHub or deploy from a public URL."}
          </p>
          {!status?.connected && (
            <Button className="mt-6" onClick={() => connect()}>
              <Github className="h-4 w-4" />
              Connect GitHub
            </Button>
          )}
        </Card>
      ) : (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Active deployments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deployments.map((v: Deployments) => (
              <DeploymentsCard data={v} key={v._id} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-hairline pt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Deploy from public URL
        </h2>
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
              <p className="mt-2 text-sm text-error">Enter a valid GitHub repo URL</p>
            )}
          </div>
          <Button
            onClick={handleManualDeploy}
            variant="secondary"
            className="shrink-0"
          >
            Deploy from URL
          </Button>
        </div>
      </div>

      <GitHubRepoPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </PageContainer>
  );
}
