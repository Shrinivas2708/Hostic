import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { formatDate } from "../exports";
import { addToast } from "@heroui/toast";
import { Spinner } from "@heroui/spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { getDeploymentUrl } from "../lib/config";
import { Github, Zap } from "lucide-react";

export default function DeploymentDetailsPage() {
  const { id } = useParams();
  const {
    fetchDeployment,
    fetchBuilds,
    deployment,
    builds,
    error,
    loading,
    redeploy,
    deleteDeployment,
  } = useDeploy();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchDeployment(id);
      fetchBuilds(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentBuildName = builds.find(
    (v) => v._id === deployment?.current_build_id
  );

  const handleDelete = async () => {
    if (!deployment?._id) return;
    try {
      await deleteDeployment(deployment._id);
      addToast({
        title: "Success",
        color: "success",
        description: "Deployment deleted!",
      });
      navigate("/deployments");
    } catch {
      addToast({
        title: "Error",
        color: "danger",
        description: "Unable to delete the deployment!",
      });
    }
  };

  const handleRedeploy = async () => {
    if (!deployment?._id) return;
    const data = await redeploy(deployment._id);
    if (data) {
      navigate(`/deployments/${data.deployment_id}/${data.build_name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[30rem] w-full items-center justify-center">
        <Spinner color="default" />
      </div>
    );
  }

  if (error) {
    return (
      <PageContainer narrow className="text-center">
        <p className="text-error">Error while fetching deployment.</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => navigate("/deployments")}
        >
          Go back
        </Button>
      </PageContainer>
    );
  }

  if (!deployment) {
    return (
      <PageContainer narrow className="text-center">
        <p className="text-muted">Deployment not found.</p>
      </PageContainer>
    );
  }

  const siteUrl = getDeploymentUrl(deployment.slug);
  const autoDeployActive = deployment.githubWebhookManaged ?? false;

  return (
    <PageContainer>
      <PageHeader
        badge="Deployment"
        title={deployment.slug}
        description={deployment.repo_url}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card padding="md" className="space-y-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Repository</dt>
                <dd>
                  <a
                    href={deployment.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline"
                  >
                    {deployment.repo_url.split("/").slice(-2).join("/")}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Branch</dt>
                <dd className="font-mono">{deployment.branch}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Directory</dt>
                <dd className="font-mono">{deployment.buildDir || "./"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Project type</dt>
                <dd className="capitalize">{deployment.projectType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">Install</dt>
                <dd className="font-mono text-right text-xs">
                  {deployment.installCommands}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">Build</dt>
                <dd className="font-mono text-right text-xs">
                  {deployment.buildCommands}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Current build</dt>
                <dd className="font-mono">
                  {currentBuildName?.build_name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Created</dt>
                <dd>{formatDate(deployment.createdAt)}</dd>
              </div>
            </dl>

            {autoDeployActive ? (
              <div className="flex items-start gap-2 rounded-md border border-brand/25 bg-brand/5 px-3 py-2.5 text-sm">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="font-medium text-on-dark">Auto-deploy enabled</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Pushes to{" "}
                    <span className="font-mono text-on-dark">
                      {deployment.branch}
                    </span>{" "}
                    on{" "}
                    <span className="font-mono text-on-dark">
                      {deployment.githubRepoFullName ??
                        deployment.repo_url.split("/").slice(-2).join("/")}
                    </span>{" "}
                    trigger a new build automatically.
                  </p>
                  {deployment.lastWebhookAt && (
                    <p className="mt-1 text-xs text-muted">
                      Last push deploy: {formatDate(deployment.lastWebhookAt)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-hairline bg-surface-elevated px-3 py-2.5 text-sm">
                <Github className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-on-dark">Auto-deploy off</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Connect GitHub and redeploy from a linked repo to enable
                    push-to-deploy.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-2 h-8 px-3 text-xs"
                    onClick={() => navigate("/deployments")}
                  >
                    Connect GitHub
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-hairline pt-6">
              <Button onClick={() => window.open(siteUrl)}>Visit site</Button>
              <Button variant="secondary" onClick={handleRedeploy}>
                Re-deploy
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-on-dark">
            Build history
          </h2>
          {builds.length === 0 ? (
            <p className="text-sm text-muted">No builds found.</p>
          ) : (
            <ul className="space-y-3">
              {[...builds].reverse().map((build) => (
                <li key={build._id}>
                  <Card
                    padding="sm"
                    className="cursor-pointer transition-colors hover:border-hairline-strong"
                    onClick={() =>
                      navigate(
                        `/deployments/${deployment._id}/${build.build_name}`
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-medium">
                        {build.build_name}
                      </span>
                      <div className="flex items-center gap-2">
                        {build.triggeredBy === "webhook" && (
                          <span className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand">
                            auto
                          </span>
                        )}
                        <StatusBadge status={build.status} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {formatDate(build.startedAt!) || "N/A"} →{" "}
                      {formatDate(build.finishedAt!) || "N/A"}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
