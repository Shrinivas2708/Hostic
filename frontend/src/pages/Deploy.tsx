import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import type { Data } from "../store/deployStore";

function Deploy() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const navigate = useNavigate();
  const [data, setData] = useState<Data>({
    repo_url: "",
    project_type: "",
    buildCommands: "",
    installCommands: "",
    buildDir: "./",
  });
  const [submitting, setSubmitting] = useState(false);
  const { createDeployment, error } = useDeploy();

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
        description: "Deployment started successfully!",
        color: "success",
      });
      navigate(`/deployments/${result.deployment_id}/${result.build_name}`);
    } else {
      addToast({
        title: "Error",
        description: "Deployment started, but no build info received.",
        color: "danger",
      });
    }
  };

  useEffect(() => {
    if (!url) {
      addToast({
        title: "Error",
        description: "GitHub URL is required!",
        color: "danger",
      });
      navigate("/deployments");
      return;
    }
    setData((prev) => ({ ...prev, repo_url: url }));
  }, [url, navigate]);

  return (
    <PageContainer narrow>
      <PageHeader
        badge="New deployment"
        title="Configure build"
        description="Set install and build commands for your project."
      />

      <Card padding="md" className="space-y-4">
        <div>
          <Label htmlFor="repo">Repository</Label>
          <Input
            id="repo"
            className="mt-2 font-mono text-sm"
            value={data.repo_url}
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
          <p className="mt-1 text-xs text-muted">Case sensitive</p>
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

        <Button
          onClick={handleDeploy}
          loading={submitting}
          className="w-full"
        >
          Deploy
        </Button>
      </Card>
    </PageContainer>
  );
}

export default Deploy;
