import { isAxiosError } from "axios";
import { useState } from "react";
import { useDeployStore } from "../store/deployStore";
import type { Deployed } from "../store/deployStore";

export const useDeploy = () => {
  const {
    deployments,
    builds,
    selectedDeployment,
    fetchDeployments,
    fetchBuilds,
    selectDeployment,
    createDeployment,
    redeploy,
    deleteDeployment,
    fetchDeployment,
    deployment,
    build,
    fetchBuild,
    deployed
  } = useDeployStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const safeCall = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await fn();
      setSuccess("Success");
      return result;
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Something went wrong");
      } else {
        setError("An unexpected error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    deployments,
    builds,
    build,
    selectedDeployment,
    deployment,
    loading,
    error,
    success,
    deployed,
    selectDeployment,
    fetchDeployment: (id: string) => safeCall(() => fetchDeployment(id)),
    fetchDeployments: () => safeCall(fetchDeployments),
    fetchBuilds: (id: string) => safeCall(() => fetchBuilds(id)),
    createDeployment: (data: Parameters<typeof createDeployment>[0]) =>
      safeCall<Deployed>(() => createDeployment(data)), // ✅ Typed return
    redeploy: (id: string) => safeCall(() => redeploy(id)),
    deleteDeployment: (slug: string) => safeCall(() => deleteDeployment(slug)),
    fetchBuild: (build_name: string) => safeCall(() => fetchBuild(build_name))
  };
};
