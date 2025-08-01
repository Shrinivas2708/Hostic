import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import type { Data } from "../store/deployStore";
// import { toast } from 'sonner'; // Or your toast library

function Deploy() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");

  const navigate = useNavigate();
  const [data, setData] = useState<Data>({
    repo_url: "",
    project_type: "",
    buildCommands: "",
    installCommands: "",
    buildDir : "./"
  });
  const { createDeployment, error } = useDeploy();
  const handleDeploy = async () => {
    const result = await createDeployment(data);
    console.log("🚀 Result from createDeployment:", result);
    console.log(error);
    
    if(!data.buildCommands) {
      addToast({
        title: "Error",
        description:  "Build command  is required!",
        color: "danger",
      });
      return;
    } 
    if(!data.installCommands) {
      addToast({
        title: "Error",
        description:  "install command  is required!",
        color: "danger",
      });
      return;
    } 
    if (!result) {
      addToast({
        title: "Error",
        description: error || "Deployment failed",
        color: "danger",
      });
      return;
    }

    // ✅ Use result directly — it's the deployed object
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
      navigate("/");
      return;
    }

    // set repo_url when url is available
    setData((prev) => ({
      ...prev,
      repo_url: url,
    }));
  }, [url, navigate]);

  return (
    <div className="flex   justify-center px-5">
      <div className=" w-[500px] p-5 flex flex-col gap-4 ">
        <div>
          <Label className="text-gray-200">Repo:</Label>
          <Input
            className="font-mono text-green-300"
            value={data.repo_url}
            onChange={(e) => {
              const value = e.target.value;
              setData((prev) => ({
                ...prev,
                repo_url: value,
              }));
            }}
          />
        </div>
        <div>
          <Label>Select project type</Label>
          <select
          
  value={data.project_type}
  onChange={(e) =>
    setData((prev) => ({
      ...prev,
      project_type: e.target.value,
    }))
  }
  className="b text-white border px-2 py-1  block w-full h-10 rounded-md border-none bg-zinc-800"
>
  <option value="">None</option>
  <option value="react">React</option>
  <option value="vite">Vite</option>
</select>
        </div>
        <div>
          <Label className="text-gray-200">{"Directory (by default ./ if it's frontend then add frontend) "} <span className="text-red-600 block">*case sensitive</span></Label>
          <Input
            className="font-mono text-green-300"
            placeholder="./"
            onChange={(e) => {
              const value = e.target.value;
              setData((prev) => ({
                ...prev,
                buildDir: value,
              }));
            }}
          />
        </div>
        <div>
          <Label className="text-gray-200">Install commands:</Label>
          <Input
            className="font-mono text-green-300"
            placeholder="ex: npm install"
            onChange={(e) => {
              const value = e.target.value;
              setData((prev) => ({
                ...prev,
                installCommands: value,
              }));
            }}
          />
        </div>
        <div>
          <Label className="text-gray-200">Build commands:</Label>
          <Input
            className="font-mono text-green-300"
            placeholder="ex: npm run build"
            onChange={(e) => {
              const value = e.target.value;
              setData((prev) => ({
                ...prev,
                buildCommands: value,
              }));
            }}
          />
        </div>
        <button
          onClick={handleDeploy}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}

export default Deploy;