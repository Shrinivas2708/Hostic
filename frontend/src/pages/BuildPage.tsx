import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { BuildStatus, formatDate } from "../exports";
import { useEffect, useState } from "react";
import url from "../lib/socket";
import { io } from "socket.io-client";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CodeWindow } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";

function BuildPage() {
  const { buildName, id } = useParams();
  const navigate = useNavigate();
  const { build, deployment, fetchDeployment, fetchBuild } = useDeploy();
  const [loadingBuild, setLoadingBuild] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (buildName && id) {
      setLoadingBuild(true);
      Promise.all([fetchDeployment(id), fetchBuild(buildName)]).finally(() =>
        setLoadingBuild(false)
      );
    }
  }, [id, buildName]);

  useEffect(() => {
    if (loadingBuild || !buildName || !build) return;

    if (
      build.status === BuildStatus.Success ||
      build.status === BuildStatus.Failed
    ) {
      return;
    }

    const socket = io(url, {
      query: { buildId: buildName },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      if (!liveStatus && build?.status) setLiveStatus(build.status);
    });

    socket.on("status", (status: string) => {
      setLiveStatus(status);
      if (status === "success") {
        setTimeout(() => navigate(`/deployed/${id}/${buildName}`), 2000);
      }
      if (status === "queued") setLogs(["Build is queued..."]);
    });

    socket.on("log", (data) => {
      const newLog = typeof data === "string" ? data : JSON.stringify(data);
      setLogs((prev) => [...prev, newLog]);
    });

    return () => {
      socket.disconnect();
    };
  }, [buildName, build, loadingBuild, id, navigate]);

  const status = liveStatus || build?.status || "queued";

  return (
    <PageContainer>
      <PageHeader
        badge="Build"
        title={deployment?.slug ?? "Building..."}
        description={`Build ${buildName}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Status</span>
            <StatusBadge status={status} />
          </div>
          <div className="space-y-3 border-t border-hairline pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Build ID</span>
              <span className="font-mono text-on-dark">{build?.build_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Started</span>
              <span>{formatDate(build?.startedAt || "N/A")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Finished</span>
              <span>{formatDate(build?.finishedAt || "N/A")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Duration</span>
              <span>{Number(build?.duration || 0) / 1000}s</span>
            </div>
          </div>
        </Card>

        <CodeWindow className="max-h-[420px] overflow-y-auto">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Build logs
          </p>
          {status === "building" || logs.length > 0 ? (
            logs.length > 0 ? (
              <pre className="whitespace-pre-wrap text-success/90">{logs.join("\n")}</pre>
            ) : (
              <p className="text-muted">Waiting for logs...</p>
            )
          ) : status === "queued" ? (
            <p className="text-muted">Build is queued...</p>
          ) : (
            <p className="text-muted">Logs available during active builds.</p>
          )}
        </CodeWindow>
      </div>
    </PageContainer>
  );
}

export default BuildPage;
