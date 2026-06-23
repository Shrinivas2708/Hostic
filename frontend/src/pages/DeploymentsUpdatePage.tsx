import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { formatDate } from "../exports";
import { addToast } from "@heroui/toast";
import { Spinner } from "@heroui/spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Copy, RefreshCw } from "lucide-react";

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    addToast({
      title: "Copied",
      description: `${label} copied to clipboard`,
      color: "success",
    });
  });
}

export default function DeploymentDetailsPage() {
  const { id } = useParams();
  const {
    fetchDeployment,
    fetchBuilds,
    fetchWebhookInfo,
    updateAutoDeploy,
    regenerateWebhookSecret,
    deployment,
    builds,
    webhookInfo,
    error,
    loading,
    redeploy,
    deleteDeployment,
  } = useDeploy();
  const navigate = useNavigate();
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [togglingAutoDeploy, setTogglingAutoDeploy] = useState(false);

  const loadWebhook = useCallback(async () => {
    if (!id) return;
    setWebhookLoading(true);
    await fetchWebhookInfo(id);
    setWebhookLoading(false);
  }, [id, fetchWebhookInfo]);

  useEffect(() => {
    if (id) {
      fetchDeployment(id);
      fetchBuilds(id);
      loadWebhook();
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

  const handleToggleAutoDeploy = async () => {
    if (!deployment?._id || !webhookInfo) return;
    setTogglingAutoDeploy(true);
    const next = !webhookInfo.auto_deploy;
    await updateAutoDeploy(deployment._id, next);
    setTogglingAutoDeploy(false);
    addToast({
      title: next ? "Auto-deploy enabled" : "Auto-deploy disabled",
      color: "success",
    });
  };

  const handleRegenerateSecret = async () => {
    if (!deployment?._id) return;
    await regenerateWebhookSecret(deployment._id);
    addToast({
      title: "Webhook secret regenerated",
      description: "Update the secret in your GitHub webhook settings.",
      color: "success",
    });
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

  const siteUrl = `https://${deployment.slug}.apps.shribuilds.in`;

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
                <dd>{deployment.branch}</dd>
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

          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-on-dark">
                  Auto-deploy
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Redeploy automatically when you push to GitHub
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={webhookInfo?.auto_deploy ?? false}
                disabled={webhookLoading || togglingAutoDeploy}
                onClick={handleToggleAutoDeploy}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  webhookInfo?.auto_deploy ? "bg-brand" : "bg-surface-elevated"
                } ${webhookLoading ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                    webhookInfo?.auto_deploy ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {webhookLoading ? (
              <div className="flex justify-center py-6">
                <Spinner color="default" size="sm" />
              </div>
            ) : webhookInfo ? (
              <div className="space-y-4 border-t border-hairline pt-4 text-sm">
                {webhookInfo.github_webhook_managed ? (
                  <>
                    <p className="rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-on-dark">
                      GitHub webhook is managed automatically for{" "}
                      <span className="font-mono">
                        {webhookInfo.github_repo}
                      </span>
                      . Push to{" "}
                      <span className="font-mono">{webhookInfo.branch}</span>{" "}
                      to trigger a redeploy.
                    </p>
                    {webhookInfo.last_webhook_at && (
                      <p className="text-xs text-muted">
                        Last auto-deploy trigger:{" "}
                        {formatDate(webhookInfo.last_webhook_at)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                <div>
                  <p className="mb-2 font-medium text-on-dark">
                    1. Add a GitHub webhook
                  </p>
                  <p className="mb-2 text-muted">
                    In your repo → Settings → Webhooks → Add webhook
                  </p>
                  <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated p-3">
                    <code className="flex-1 break-all text-xs">
                      {webhookInfo.webhook_url}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(webhookInfo.webhook_url, "Webhook URL")
                      }
                      className="shrink-0 text-muted hover:text-on-dark"
                      aria-label="Copy webhook URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-medium text-on-dark">
                    2. Set the webhook secret
                  </p>
                  <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated p-3">
                    <code className="flex-1 break-all text-xs">
                      {webhookInfo.webhook_secret}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          webhookInfo.webhook_secret,
                          "Webhook secret"
                        )
                      }
                      className="shrink-0 text-muted hover:text-on-dark"
                      aria-label="Copy webhook secret"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-2 h-8 px-3 text-xs"
                    onClick={handleRegenerateSecret}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Regenerate secret
                  </Button>
                </div>

                <ul className="list-inside list-disc space-y-1 text-muted">
                  <li>Content type: <span className="font-mono text-on-dark">application/json</span></li>
                  <li>Event: <span className="font-mono text-on-dark">Just the push event</span></li>
                  <li>
                    Watches branch:{" "}
                    <span className="font-mono text-on-dark">
                      {webhookInfo.branch}
                    </span>
                  </li>
                </ul>

                {webhookInfo.last_webhook_at && (
                  <p className="text-xs text-muted">
                    Last auto-deploy trigger:{" "}
                    {formatDate(webhookInfo.last_webhook_at)}
                  </p>
                )}
                  </>
                )}
              </div>
            ) : null}
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
