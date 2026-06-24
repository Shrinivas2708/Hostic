import { getBuild, type BuildRecord } from "./api";
import type { HosticConfig } from "./config";
import type { BuildLogEntry } from "./buildLogs";

const TERMINAL = ["queued", "building", "success", "failed"] as const;

export async function waitForBuild(
  config: HosticConfig,
  buildName: string,
  options: {
    intervalMs?: number;
    onStatusChange?: (status: string, build: BuildRecord) => void;
    onLogEntry?: (entry: BuildLogEntry) => void;
  } = {}
): Promise<BuildRecord> {
  const intervalMs = options.intervalMs ?? 2000;
  let lastLogCount = 0;
  let lastStatus: string | null = null;

  for (;;) {
    const { build } = await getBuild(config, buildName);

    if (build.status !== lastStatus) {
      lastStatus = build.status;
      options.onStatusChange?.(build.status, build);
    }

    if (build.logs?.length) {
      const newLogs = build.logs.slice(lastLogCount);
      for (const entry of newLogs) {
        options.onLogEntry?.({
          level: (entry.level as BuildLogEntry["level"]) || "info",
          message: entry.message,
          at: entry.at,
        });
      }
      lastLogCount = build.logs.length;
    }

    if (build.status === "success" || build.status === "failed") {
      return build;
    }

    if (!TERMINAL.includes(build.status as (typeof TERMINAL)[number])) {
      // queued | building — keep polling
    }

    await sleep(intervalMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
