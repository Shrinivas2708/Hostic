import { publishLog } from "./pub";

export type BuildLogger = {
  log: (msg: string) => void;
  error: (msg: string) => void;
  getLogs: () => string[];
};

export function makeBuildLogger(buildId: string): BuildLogger {
  const lines: string[] = [];
  const ts = () => new Date().toISOString();

  const emit = (prefix: string, msg: string) => {
    const line = `[${ts()}][Build:${buildId}] ${prefix}${msg}`;
    lines.push(line);
    console.log(line);
    publishLog(buildId, line).catch((err) => {
      console.error(`Failed to publish log for buildId ${buildId}: ${err.message}`);
      // Optionally re-queue the log or notify the system (e.g., via a fallback mechanism)
    });
  };

  return {
    log: (msg) => emit("", msg),
    error: (msg) => emit("ERROR: ", msg),
    getLogs: () => [...lines],
  };
}