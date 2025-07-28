import { useParams } from "react-router-dom";
import { useDeploy } from "../hooks/useDeploy";
import { formatDate } from "../exports";
import  { useEffect, useState } from "react";
import url from "../lib/socket";
import { io } from "socket.io-client";
const statusStyles: Record<string, string> = {
  queued: "text-yellow-300 border border-yellow-300",
  building: "text-blue-300 border border-blue-300",
  failed: "text-red-500 border border-red-500",
  success: "text-green-300 border border-green-300",
};

function BuildPage() {
  const { buildName,id } = useParams();
  const { build, deployment,fetchDeployment,fetchBuild } = useDeploy();
 
//   console.log(currentBuild)
  console.log(build)
   useEffect(() => {
    if (buildName && id) {
      fetchDeployment(id);
      fetchBuild(buildName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const [logs, setLogs] = useState<string[]>([]);
  // const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!build || build.status !== "building" || !buildName) return;

     const socket = io(url, {
    query: {
      buildId: buildName,
    },
    transports: ["websocket"], // enforce WebSocket transport
  });
   

     socket.on("log", (data) => {
    setLogs((prev) => [...prev, data]);
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket logs");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket logs");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });


    return () => {
      socket.disconnect();
    };
  }, [build, buildName]);

  return (
    <div className="flex items-center flex-col p-5  space-y-10">
      <p className="text-xl text-center font-bold">{deployment?.slug}</p>

      <div className="flex justify-evenly  w-full">
        <div className="flex flex-col gap-3 p-5 text-lg font-medium border border-white/10 rounded-lg">
          <p>
            <span className="text-lg text-[#918f8f]">Build name: </span>
            {build?.build_name}
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Status: </span>
            <span
              className={`text-xs px-2 py-1 rounded-full capitalize ${statusStyles[build?.status || ""] || "bg-gray-100 text-gray-700"}`}
            >
              {build?.status}
            </span>
          </p>

          <p>
            <span className="text-lg text-[#918f8f]">Started at : </span>
            {formatDate(build?.startedAt || "N/A")}
          </p>
          <p>
            <span className="text-lg text-[#918f8f]">Finished at : </span>
            {formatDate(build?.finishedAt || "N/A")}
          </p>

          <p>
            <span className="text-lg text-[#918f8f]">Duration : </span>
            Took {Number(build?.duration || 0) / 1000}s to build
          </p>
        </div>

        <div className="border w-1/2 p-4 rounded-lg bg-black text-green-300 font-mono text-sm overflow-y-auto max-h-[400px]">
          <p className="font-bold text-white mb-2">Logs</p>
          {build?.status === "building" ? (
            logs.length > 0 ? (
              <pre>{logs.join("\n")}</pre>
            ) : (
              <p className="text-gray-500">Waiting for logs...</p>
            )
          ) : (
            <p className="text-gray-500">Logs only available while building.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuildPage;