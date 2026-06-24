import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { formatDate } from "../exports";
import { addToast } from "@heroui/toast";
import { Spinner } from "@heroui/spinner";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { getDeploymentUrl } from "../lib/config";
import { parseGithubRepoUrl } from "../lib/projectDefaults";
import { useGitHubStore } from "../store/githubStore";
import { Github, RefreshCw, Zap } from "lucide-react";

type SettingsForm = {
  branch: string;
  buildDir: string;
  project_type: string;
  installCommands: string;
  buildCommands: string;
  auto_deploy: boolean;
};

function settingsFromDeployment(d: {
  branch: string;
  buildDir?: string;
  projectType: string;
  installCommands?: string;
  buildCommands?: string;
  autoDeploy?: boolean;
}): SettingsForm {
  return {
    branch: d.branch || "main",
    buildDir: d.buildDir || "./",
    project_type: d.projectType,
    installCommands: d.installCommands ?? "",
    buildCommands: d.buildCommands ?? "",
    auto_deploy: d.autoDeploy ?? true,
  };
}

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
    updateDeployment,
  } = useDeploy();
  const navigate = useNavigate();
  const { fetchProjectDefaults } = useGitHubStore();
  const [settings, setSettings] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeployment(id);
      fetchBuilds(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (deployment) {
      setSettings(settingsFromDeployment(deployment));
    }
  }, [deployment]);

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

  const handleDetectSettings = async () => {
    if (!deployment || !settings) return;

    const parsed = parseGithubRepoUrl(deployment.repo_url);
    if (!parsed) {
      addToast({
        title: "Cannot detect",
        description: "Only GitHub repositories are supported.",
        color: "danger",
      });
      return;
    }

    setDetecting(true);
    try {
      const result = await fetchProjectDefaults(parsed.owner, parsed.repo, {
        branch: settings.branch,
        dir: settings.buildDir,
      });

      setSettings((s) =>
        s
          ? {
              ...s,
              project_type: result.project_type,
              installCommands: result.installCommands,
              buildCommands: result.buildCommands,
            }
          : s
      );

      addToast({
        title: result.detected ? "Settings detected" : "Using defaults",
        description: result.detected
          ? `Read ${result.package_json_path}`
          : "No package.json at that path — filled static defaults",
        color: result.detected ? "success" : "warning",
      });
    } catch {
      addToast({
        title: "Detection failed",
        description: "Connect GitHub or check branch / directory.",
        color: "danger",
      });
    } finally {
      setDetecting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!deployment?._id || !settings) return;

    if (!settings.buildCommands.trim()) {
      addToast({
        title: "Error",
        description: "Build command is required",
        color: "danger",
      });
      return;
    }
    if (!settings.installCommands.trim()) {
      addToast({
        title: "Error",
        description: "Install command is required",
        color: "danger",
      });
      return;
    }
    if (!settings.project_type) {
      addToast({
        title: "Error",
        description: "Project type is required",
        color: "danger",
      });
      return;
    }

    setSaving(true);
    const result = await updateDeployment(deployment._id, {
      branch: settings.branch,
      buildDir: settings.buildDir,
      project_type: settings.project_type,
      installCommands: settings.installCommands,
      buildCommands: settings.buildCommands,
      auto_deploy: settings.auto_deploy,
    });
    setSaving(false);

    if (result) {
      addToast({
        title: "Settings saved",
        description: "Redeploy to apply build changes.",
        color: "success",
      });
    } else {
      addToast({
        title: "Error",
        description: "Could not update deployment settings",
        color: "danger",
      });
    }
  };

  if (loading && !deployment) {
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

  if (!deployment || !settings) {
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Overview
            </h2>
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

            <div className="flex flex-wrap gap-3 border-t border-hairline pt-4">
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Build settings
              </h2>
              <Button
                type="button"
                variant="outline"
                loading={detecting}
                onClick={handleDetectSettings}
                className="h-8 px-3 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Detect from repo
              </Button>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                className="mt-2 font-mono text-sm"
                value={settings.branch}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, branch: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="build-dir">Directory</Label>
              <Input
                id="build-dir"
                className="mt-2 font-mono text-sm"
                placeholder="./"
                value={settings.buildDir}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, buildDir: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="project-type">Project type</Label>
              <Select
                id="project-type"
                className="mt-2"
                value={settings.project_type}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, project_type: e.target.value })
                }
              >
                <option value="react">React</option>
                <option value="vite">Vite</option>
                <option value="static">Static</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="install">Install command</Label>
              <Input
                id="install"
                className="mt-2 font-mono text-sm"
                value={settings.installCommands}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, installCommands: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="build">Build command</Label>
              <Input
                id="build"
                className="mt-2 font-mono text-sm"
                value={settings.buildCommands}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, buildCommands: e.target.value })
                }
              />
            </div>

            {autoDeployActive ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-brand/25 bg-brand/5 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 accent-brand"
                  checked={settings.auto_deploy}
                  onChange={(e) =>
                    setSettings((s) => s && { ...s, auto_deploy: e.target.checked })
                  }
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium text-on-dark">
                    <Zap className="h-4 w-4 text-brand" />
                    Auto-deploy on push
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Push to{" "}
                    <span className="font-mono">{settings.branch}</span> on{" "}
                    {deployment.githubRepoFullName ??
                      deployment.repo_url.split("/").slice(-2).join("/")}
                  </span>
                </span>
              </label>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-hairline bg-surface-elevated px-3 py-2.5 text-sm">
                <Github className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <p className="text-xs text-muted">
                  Auto-deploy is available when this deployment is linked to
                  GitHub via the repo picker.
                </p>
              </div>
            )}

            <Button
              onClick={handleSaveSettings}
              loading={saving}
              className="w-full"
            >
              Save settings
            </Button>
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
