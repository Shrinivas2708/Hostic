import { useNavigate, useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { BuildStatus, formatDate } from "../exports";
import { useEffect, useState } from "react";
import url from "../lib/socket";
import { io } from "socket.io-client";

const statusStyles: Record<string, string> = {
  queued: "text-yellow-300 border border-yellow-300",
  building: "text-blue-300 border border-blue-300",
  failed: "text-red-500 border border-red-500",
  success: "text-green-300 border border-green-300",
};

function BuildPage() {
  const { buildName, id } = useParams();
  const navigate = useNavigate();
  const { build, deployment, fetchDeployment, fetchBuild } = useDeploy();

  const [logs, setLogs] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  console.log(build)

  // Fetch deployment and build data
 useEffect(() => {
    if (buildName && id) {
      fetchDeployment(id);
      fetchBuild(buildName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  // WebSocket connection for real-time logs
 useEffect(() => {
  if (!buildName) return;
 if (build?.status === BuildStatus.Success || build?.status === BuildStatus.Failed) {
  console.log(build)
    console.log("Skipping WebSocket — build already complete.");
    return;
  }
  if(build===null){
    setLiveStatus(BuildStatus.Building)
  }
  const socket = io(url, {
    query: { buildId: buildName },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket logs");

    // fallback to existing build status if liveStatus isn't set
    if (!liveStatus && build?.status) {
      setLiveStatus(build.status);
    }
  });

  socket.on("status", (status: string) => {
    console.log("Received status update:", status);
    setLiveStatus(status);

    if (status === "success") {
      setTimeout(() => navigate(`/deployed/${id}/${buildName}`), 2000);
    }

    if (status === "queued") {
      setLogs(["Build is queued..."]);
    }
  });

  socket.on("log", (data) => {
    const newLog = typeof data === "string" ? data : JSON.stringify(data);
    setLogs((prev) => [...prev, newLog]);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket logs");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  return () => {
    console.log("Cleaning up WebSocket for buildId:", buildName);
    socket.disconnect();
  };
}, [buildName]); // ✅ only depends on buildName

  return (
    <div className="flex items-center flex-col p-5 space-y-10">
      <p className="text-xl text-center font-bold">{deployment?.slug}</p>

      <div className="flex justify-evenly w-full">
        <div className="flex flex-col gap-3 p-5 text-lg font-medium border border-white/10 rounded-lg">
          <p>
            <span className="text-lg text-[#918f8f]">Build name: </span>
            {build?.build_name}
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Status: </span>
            <span
              className={`text-xs px-2 py-1 rounded-full capitalize ${
                statusStyles[liveStatus || build?.status || ""]
              }`}
            >
              {liveStatus || build?.status}
            </span>
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Started at: </span>
            {formatDate(build?.startedAt || "N/A")}
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Finished at: </span>
            {formatDate(build?.finishedAt || "N/A")}
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Duration: </span>
            Took {Number(build?.duration || 0) / 1000}s to build
          </p>
        </div>

        <div className="border w-1/2 p-4 rounded-lg bg-black text-green-300 font-mono text-sm overflow-y-auto max-h-[400px]">
          <p className="font-bold text-white mb-2">Logs</p>
          {liveStatus === "building" ? (
            logs.length > 0 ? (
              <pre>{logs.join("\n")}</pre>
            ) : (
              <p className="text-gray-500">Waiting for logs...</p>
            )
          ) : liveStatus === "queued" ? (
            <p className="text-gray-500">Build is queued...</p>
          ) : (
            <p className="text-gray-500">Logs only available while building.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuildPage;