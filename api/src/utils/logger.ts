import { publishLog, type LogEntry, type LogLevel } from "./pub";
import { queuePersistLog } from "./persistBuildLogs";

export type { LogEntry, LogLevel };

export type BuildLogger = {
  log: (msg: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  stdout: (msg: string) => void;
  stderr: (msg: string) => void;
  getLogs: () => LogEntry[];
};

function emit(
  buildId: string,
  lines: LogEntry[],
  level: LogLevel,
  message: string
) {
  const entry: LogEntry = {
    level,
    message: message.trim(),
    at: Date.now(),
  };
  if (!entry.message) return;

  lines.push(entry);
  const prefix = level === "error" ? "ERR" : level === "stderr" ? "WRN" : "LOG";
  console.log(`[build ${buildId}] ${prefix} ${entry.message}`);
  queuePersistLog(buildId, entry);
  publishLog(buildId, entry).catch((err) => {
    console.error(`Failed to publish log for buildId ${buildId}: ${err.message}`);
  });
}

export function makeBuildLogger(buildId: string): BuildLogger {
  const lines: LogEntry[] = [];

  return {
    log: (msg) => emit(buildId, lines, "info", msg),
    success: (msg) => emit(buildId, lines, "success", msg),
    error: (msg) => emit(buildId, lines, "error", msg),
    stdout: (msg) => emit(buildId, lines, "stdout", msg),
    stderr: (msg) => emit(buildId, lines, "stderr", msg),
    getLogs: () => [...lines],
  };
}
