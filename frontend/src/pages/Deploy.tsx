import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useGitHubStore } from "../store/githubStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addToast } from "@heroui/toast";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Spinner } from "@heroui/spinner";
import type { Data } from "../store/deployStore";
import { parseGithubRepoUrl } from "../lib/projectDefaults";
import { RefreshCw, Sparkles } from "lucide-react";

function Deploy() {
  const [searchParams] = useSearchParams();
  const urlParam = searchParams.get("url");
  const ownerParam = searchParams.get("owner");
  const repoParam = searchParams.get("repo");
  const navigate = useNavigate();
  const { fetchRepoDetails, fetchProjectDefaults } = useGitHubStore();
  const [data, setData] = useState<Data>({
    repo_url: "",
    project_type: "",
    buildCommands: "",
    installCommands: "",
    buildDir: "./",
    branch: "main",
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedPath, setDetectedPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [repoLabel, setRepoLabel] = useState("");
  const { createDeployment, error } = useDeploy();

  const repoIdentity = useMemo(() => {
    if (ownerParam && repoParam) {
      return { owner: ownerParam, repo: repoParam };
    }
    return parseGithubRepoUrl(data.repo_url);
  }, [ownerParam, repoParam, data.repo_url]);

  const applyDetectedDefaults = useCallback(
    async (branch: string, buildDir: string) => {
      if (!repoIdentity) return;

      setDetecting(true);
      try {
        const result = await fetchProjectDefaults(
          repoIdentity.owner,
          repoIdentity.repo,
          { branch, dir: buildDir }
        );

        setData((prev) => ({
          ...prev,
          project_type: result.project_type,
          installCommands: result.installCommands,
          buildCommands: result.buildCommands,
        }));
        setDetectedPath(result.detected ? result.package_json_path : null);
      } catch {
        setDetectedPath(null);
      } finally {
        setDetecting(false);
      }
    },
    [repoIdentity, fetchProjectDefaults]
  );

  useEffect(() => {
    async function loadRepo() {
      if (ownerParam && repoParam) {
        setLoadingRepo(true);
        try {
          const { repo, branches: branchList } = await fetchRepoDetails(
            ownerParam,
            repoParam
          );
          setData((prev) => ({
            ...prev,
            repo_url: repo.html_url,
            branch: repo.default_branch,
          }));
          setBranches(branchList);
          setRepoLabel(repo.full_name);
          await applyDetectedDefaults(repo.default_branch, "./");
        } catch {
          addToast({
            title: "Error",
            description: "Could not load repository. Connect GitHub first.",
            color: "danger",
          });
          navigate("/deployments");
        } finally {
          setLoadingRepo(false);
        }
        return;
      }

      if (urlParam) {
        setData((prev) => ({ ...prev, repo_url: urlParam }));
        setRepoLabel(urlParam.split("/").slice(-2).join("/"));
        const parsed = parseGithubRepoUrl(urlParam);
        if (parsed) {
          await applyDetectedDefaults("main", "./");
        }
        return;
      }

      addToast({
        title: "No repository selected",
        description: "Pick a repo from your deployments page.",
        color: "danger",
      });
      navigate("/deployments");
    }

    loadRepo();
  }, [
    urlParam,
    ownerParam,
    repoParam,
    navigate,
    fetchRepoDetails,
    applyDetectedDefaults,
  ]);

  useEffect(() => {
    if (!repoIdentity || loadingRepo) return;

    const timer = setTimeout(() => {
      applyDetectedDefaults(data.branch ?? "main", data.buildDir);
    }, 450);

    return () => clearTimeout(timer);
  }, [
    data.buildDir,
    data.branch,
    repoIdentity,
    loadingRepo,
    applyDetectedDefaults,
  ]);

  const handleDeploy = async () => {
    if (!data.buildCommands) {
      addToast({
        title: "Error",
        description: "Build command is required!",
        color: "danger",
      });
      return;
    }
    if (!data.installCommands) {
      addToast({
        title: "Error",
        description: "Install command is required!",
        color: "danger",
      });
      return;
    }
    if (!data.project_type) {
      addToast({
        title: "Error",
        description: "Project type is required!",
        color: "danger",
      });
      return;
    }

    setSubmitting(true);
    const result = await createDeployment(data);
    setSubmitting(false);

    if (!result) {
      addToast({
        title: "Error",
        description: error || "Deployment failed",
        color: "danger",
      });
      return;
    }

    if (result.deployment_id && result.build_name) {
      addToast({
        title: "Success",
        description: ownerParam
          ? "Deployment started! Pushes to this branch will auto-redeploy."
          : "Deployment started successfully!",
        color: "success",
      });
      navigate(`/deployments/${result.deployment_id}/${result.build_name}`);
    }
  };

  if (loadingRepo) {
    return (
      <div className="flex h-[30rem] items-center justify-center">
        <Spinner color="default" />
      </div>
    );
  }

  return (
    <PageContainer narrow>
      <PageHeader
        badge="New deployment"
        title="Configure build"
        description={
          ownerParam
            ? `Deploying ${repoLabel} — settings are read from package.json; edit anything below.`
            : "Build commands are suggested from package.json when possible — you can override them."
        }
      />

      <Card padding="md" className="space-y-4">
        <div>
          <Label htmlFor="repo">Repository</Label>
          <Input
            id="repo"
            className="mt-2 font-mono text-sm"
            value={data.repo_url}
            readOnly={Boolean(ownerParam)}
            onChange={(e) =>
              setData((prev) => ({ ...prev, repo_url: e.target.value }))
            }
          />
        </div>

        {repoIdentity && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand/20 bg-brand/5 px-3 py-2.5 text-sm">
            <div className="flex items-start gap-2 text-on-dark">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                {detectedPath ? (
                  <>
                    Detected from{" "}
                    <span className="font-mono text-xs">{detectedPath}</span>
                  </>
                ) : detecting ? (
                  "Reading package.json…"
                ) : (
                  "No package.json at this path — using static defaults"
                )}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              loading={detecting}
              onClick={() =>
                applyDetectedDefaults(data.branch ?? "main", data.buildDir)
              }
              className="h-8 shrink-0 px-3 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-detect
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="project-type">Project type</Label>
          <Select
            id="project-type"
            className="mt-2"
            value={data.project_type}
            onChange={(e) =>
              setData((prev) => ({ ...prev, project_type: e.target.value }))
            }
          >
            <option value="">Select framework</option>
            <option value="react">React</option>
            <option value="vite">Vite</option>
            <option value="static">Static</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="branch">Branch</Label>
          {branches.length > 0 ? (
            <Select
              id="branch"
              className="mt-2"
              value={data.branch ?? "main"}
              onChange={(e) =>
                setData((prev) => ({ ...prev, branch: e.target.value }))
              }
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="branch"
              className="mt-2 font-mono text-sm"
              placeholder="main"
              value={data.branch ?? "main"}
              onChange={(e) =>
                setData((prev) => ({ ...prev, branch: e.target.value }))
              }
            />
          )}
          <p className="mt-1 text-xs text-muted">
            Pushes to this branch trigger auto-redeploy
          </p>
        </div>

        <div>
          <Label htmlFor="build-dir">
            Directory{" "}
            <span className="font-normal text-muted">(default: ./)</span>
          </Label>
          <Input
            id="build-dir"
            className="mt-2 font-mono text-sm"
            placeholder="./"
            value={data.buildDir}
            onChange={(e) =>
              setData((prev) => ({ ...prev, buildDir: e.target.value }))
            }
          />
          <p className="mt-1 text-xs text-muted">
            Monorepo? Set e.g. <span className="font-mono">./frontend</span> —
            commands update when this changes
          </p>
        </div>

        <div>
          <Label htmlFor="install">Install commands</Label>
          <Input
            id="install"
            className="mt-2 font-mono text-sm"
            placeholder="npm ci"
            value={data.installCommands}
            onChange={(e) =>
              setData((prev) => ({ ...prev, installCommands: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor="build">Build commands</Label>
          <Input
            id="build"
            className="mt-2 font-mono text-sm"
            placeholder="npm run build"
            value={data.buildCommands}
            onChange={(e) =>
              setData((prev) => ({ ...prev, buildCommands: e.target.value }))
            }
          />
        </div>

        <Button onClick={handleDeploy} loading={submitting} className="w-full">
          Deploy
        </Button>
      </Card>
    </PageContainer>
  );
}

export default Deploy;
