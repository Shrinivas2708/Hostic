import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { BuildStatus, formatDate } from "../exports";
import { useEffect, useRef, useState } from "react";
import url from "../lib/socket";
import { io } from "socket.io-client";
import { StatusBadge } from "../components/StatusBadge";
import { Card } from "../components/ui/card";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { cn } from "../lib/utils";

function BuildPage() {
  const { buildName, id } = useParams();
  const navigate = useNavigate();
  const { build, deployment, fetchDeployment, fetchBuild } = useDeploy();
  const [loadingBuild, setLoadingBuild] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll logs to bottom as new lines arrive
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const status = liveStatus || build?.status || "queued";

  const formatFinished = (date?: string) => {
    if (!date) return "—";
    const formatted = formatDate(date);
    return formatted.includes("Invalid") ? "—" : formatted;
  };

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
            {build?.triggeredBy && (
              <div className="flex justify-between">
                <span className="text-muted">Triggered by</span>
                <span className="capitalize">{build.triggeredBy}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Started</span>
              <span>{formatDate(build?.startedAt || "N/A")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Finished</span>
              <span>{formatFinished(build?.finishedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Duration</span>
              <span>{Number(build?.duration || 0) / 1000}s</span>
            </div>
          </div>
        </Card>

        <div className="flex max-h-[420px] flex-col overflow-hidden rounded-lg border border-hairline bg-surface-card font-mono text-sm">
          <div className="flex shrink-0 items-center gap-2 border-b border-hairline px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Build logs
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="scrollbar-simple min-h-0 flex-1 overflow-y-auto overflow-x-auto p-4"
          >
            {logs.length > 0 ? (
              <pre className="whitespace-pre-wrap break-words text-copy">
                {logs.map((line, i) => (
                  <span
                    key={i}
                    className={cn(
                      "block",
                      line.toLowerCase().includes("error") && "text-error"
                    )}
                  >
                    {line}
                  </span>
                ))}
              </pre>
            ) : status === "queued" ? (
              <p className="text-muted">Build is queued...</p>
            ) : status === "building" ? (
              <p className="text-muted">Waiting for logs...</p>
            ) : (
              <p className="text-muted">No logs captured for this build.</p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default BuildPage;
