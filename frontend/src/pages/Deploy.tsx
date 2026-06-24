import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useGitHubStore } from "../store/githubStore";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { Spinner } from "@heroui/spinner";
import type { Data } from "../store/deployStore";

function Deploy() {
  const [searchParams] = useSearchParams();
  const urlParam = searchParams.get("url");
  const ownerParam = searchParams.get("owner");
  const repoParam = searchParams.get("repo");
  const navigate = useNavigate();
  const { fetchRepoDetails } = useGitHubStore();
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
  const [submitting, setSubmitting] = useState(false);
  const [repoLabel, setRepoLabel] = useState("");
  const { createDeployment, error } = useDeploy();

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
  }, [urlParam, ownerParam, repoParam, navigate, fetchRepoDetails]);

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
            ? `Deploying ${repoLabel} — auto-redeploy on push is enabled via GitHub.`
            : "Set install and build commands for your project."
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
