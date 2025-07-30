import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeploy } from '../hooks/useDeploy';
import { useEffect } from 'react';
import { addToast } from '@heroui/toast';
// import { toast } from 'sonner'; // Or your toast library

function Deploy() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const navigate = useNavigate();

  const { createDeployment,  error } = useDeploy();

  const data = {
    repo_url: url!,
    project_type: "vite",
    buildCommands: "npm run build",
    installCommands: "npm i"
  };

  const handleDeploy = async () => {
  const result = await createDeployment(data);
console.log("🚀 Result from createDeployment:", result);
console.log(error)
  if (!result) {
    addToast({
      title: "Error",
      description: error || "Deployment failed",
      color: "danger",
    });
    return;
  }

  // ✅ Use `result` directly — it's the deployed object
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
      navigate("/");
    }
  }, [url, navigate]);

  return (
    <div className="p-4 flex flex-col gap-4 items-center justify-center first-line:">
      <p className="text-gray-200">Repo: <span className="font-mono text-green-300">{url}</span></p>

      <button
        onClick={handleDeploy}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        Deploy
      </button>
    </div>
  );
}

export default Deploy;
