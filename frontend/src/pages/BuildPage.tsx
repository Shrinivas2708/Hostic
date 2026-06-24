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
import { BuildLogViewer } from "../components/BuildLogViewer";
import { parseBuildLog, type BuildLogEntry } from "../lib/buildLogs";

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m ${rem.toString().padStart(2, "0")}s`;
}

function BuildPage() {
  const { buildName, id } = useParams();
  const navigate = useNavigate();
  const { build, deployment, fetchDeployment, fetchBuild } = useDeploy();
  const [loadingBuild, setLoadingBuild] = useState(true);
  const [logs, setLogs] = useState<BuildLogEntry[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const queuedAtRef = useRef<number>(Date.now());

  // Reset UI when switching to a different build
  useEffect(() => {
    if (!buildName) return;
    setLogs([]);
    setLiveStatus(null);
    setElapsedSec(0);
    queuedAtRef.current = Date.now();
  }, [buildName]);

  useEffect(() => {
    if (buildName && id) {
      setLoadingBuild(true);
      Promise.all([fetchDeployment(id), fetchBuild(buildName)]).finally(() =>
        setLoadingBuild(false)
      );
    }
  }, [id, buildName, fetchDeployment, fetchBuild]);

  // Load persisted logs after fetch (completed builds + page refresh mid-build)
  useEffect(() => {
    if (loadingBuild || !build || build.build_name !== buildName) return;
    if (build.logs?.length) {
      setLogs(build.logs);
    }
  }, [loadingBuild, build, buildName]);

  useEffect(() => {
    if (loadingBuild || !buildName || !build || build.build_name !== buildName) {
      return;
    }

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
      setLiveStatus((prev) => prev ?? build.status);
    });

    socket.on("status", (status: string) => {
      setLiveStatus(status);
      if (status === "success") {
        fetchBuild(buildName);
        setTimeout(() => navigate(`/deployed/${id}/${buildName}`), 2000);
      }
      if (status === "failed") {
        fetchBuild(buildName);
      }
      if (status === "queued") {
        setLogs([
          {
            level: "info",
            message: "Build queued — waiting for a worker...",
            at: Date.now(),
          },
        ]);
      }
    });

    socket.on("log", (data) => {
      const entry = parseBuildLog(data);
      if (!entry.message.trim()) return;
      setLogs((prev) => [...prev, entry]);
    });

    return () => {
      socket.disconnect();
    };
  }, [buildName, build, loadingBuild, id, navigate, fetchBuild]);

  // Auto-scroll logs to bottom as new lines arrive
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const status = liveStatus || build?.status || "queued";
  const isActive =
    status === BuildStatus.Queued || status === BuildStatus.Building;

  useEffect(() => {
    if (!isActive) return;

    const startMs = build?.startedAt
      ? new Date(build.startedAt).getTime()
      : queuedAtRef.current;

    const tick = () => {
      setElapsedSec(Math.floor((Date.now() - startMs) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, build?.startedAt]);

  const durationLabel = isActive
    ? formatElapsed(elapsedSec)
    : build?.duration
      ? formatElapsed(build.duration / 1000)
      : build?.startedAt && build?.finishedAt
        ? formatElapsed(
            (new Date(build.finishedAt).getTime() -
              new Date(build.startedAt).getTime()) /
              1000
          )
        : "—";

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
            <div className="flex justify-between items-center">
              <span className="text-muted">Duration</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  isActive && "text-brand"
                )}
              >
                {durationLabel}
                {isActive && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand align-middle" />
                )}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex max-h-[min(520px,70vh)] flex-col overflow-hidden rounded-lg border border-hairline bg-[#0d0d0f] font-mono text-sm shadow-inner">
          <div className="flex shrink-0 items-center gap-2 border-b border-hairline/80 bg-surface-card px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Build logs
            </span>
            {isActive && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                Live
              </span>
            )}
          </div>

          <div
            ref={logContainerRef}
            className="scrollbar-simple min-h-0 flex-1 overflow-y-auto overflow-x-auto p-3"
          >
            <BuildLogViewer
              logs={logs}
              emptyMessage={
                status === "queued"
                  ? "Build is queued..."
                  : status === "building"
                    ? "Waiting for logs..."
                    : "No logs captured for this build."
              }
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default BuildPage;
