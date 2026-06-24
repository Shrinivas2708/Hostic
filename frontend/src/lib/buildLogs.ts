export type BuildLogLevel = "info" | "error" | "stdout" | "stderr" | "success";

export type BuildLogEntry = {
  level: BuildLogLevel;
  message: string;
  at: number;
};

export function parseBuildLog(data: unknown): BuildLogEntry {
  if (data && typeof data === "object" && "message" in data) {
    const entry = data as Partial<BuildLogEntry>;
    return {
      level: (entry.level as BuildLogLevel) ?? "info",
      message: String(entry.message ?? ""),
      at: typeof entry.at === "number" ? entry.at : Date.now(),
    };
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as Partial<BuildLogEntry>;
      if (parsed?.message) {
        return {
          level: (parsed.level as BuildLogLevel) ?? "info",
          message: String(parsed.message),
          at: typeof parsed.at === "number" ? parsed.at : Date.now(),
        };
      }
    } catch {
      const cleaned = data.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
      return {
        level: cleaned.toLowerCase().includes("error") ? "error" : "info",
        message: cleaned,
        at: Date.now(),
      };
    }
  }

  return {
    level: "info",
    message: String(data ?? ""),
    at: Date.now(),
  };
}

export function formatLogTime(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const logLevelStyles: Record<BuildLogLevel, string> = {
  info: "text-muted",
  stdout: "text-on-dark",
  stderr: "text-warning",
  error: "text-error",
  success: "text-success",
};

export const logLevelLabels: Record<BuildLogLevel, string> = {
  info: "INFO",
  stdout: "OUT",
  stderr: "ERR",
  error: "FAIL",
  success: " OK",
};
