import { useEffect, useState } from "react";
import { useDeploy } from "../hooks/useDeploy";
import DeploymentsCard from "../components/DeploymentsCard";
import type { Deployments } from "../store/deployStore";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

export default function DeploymentsPage() {
  const { deployments, fetchDeployments } = useDeploy();
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateUrl(value: string) {
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(value.trim());
  }

  function handleNavigate() {
    const valid = validateUrl(url);
    setClicked(true);
    setIsValid(valid);
    if (valid) navigate(`/deploy?url=${encodeURIComponent(url)}`);
  }

  return (
    <PageContainer>
      <PageHeader
        badge="Deployments"
        title="Your projects"
        description="Paste a GitHub URL to deploy a new frontend app, or manage existing deployments."
      />

      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-start">
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
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
          />
          {clicked && !isValid && (
            <p className="mt-2 text-sm text-error">
              Enter a valid GitHub repo URL (e.g. https://github.com/user/repo)
            </p>
          )}
        </div>
        <Button onClick={handleNavigate} className="shrink-0">
          New deployment
        </Button>
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline py-20 text-center">
          <p className="text-lg font-medium text-on-dark">No deployments yet</p>
          <p className="mt-2 text-sm text-muted">
            Paste a GitHub URL above to deploy your first project.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deployments.map((v: Deployments) => (
            <DeploymentsCard data={v} key={v._id} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
