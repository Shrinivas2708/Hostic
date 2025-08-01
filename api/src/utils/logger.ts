import { publishLog } from "./pub";

export type BuildLogger = {
  log: (msg: string) => void;
  error: (msg: string) => void;
  getLogs: () => string[];
};
export  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
export function makeBuildLogger(buildId: string): BuildLogger {
  const lines: string[] = [];
  const ts = () => new Date().toISOString();

  const emit = (prefix: string, msg: string) => {
    const line = `[${formatDate(ts())}] ${prefix}${msg}`;
    lines.push(line);
    console.log(line);
    publishLog(buildId, line).catch((err) => {
      console.error(`Failed to publish log for buildId ${buildId}: ${err.message}`);
    });
  };

  return {
    log: (msg) => emit("", msg),
    error: (msg) => emit("ERROR: ", msg),
    getLogs: () => [...lines],
  };
}