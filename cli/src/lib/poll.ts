import { getBuild, type BuildRecord } from "./api";
import type { HosticConfig } from "./config";

const TERMINAL = ["queued", "building", "success", "failed"] as const;

export async function waitForBuild(
  config: HosticConfig,
  buildName: string,
  options: {
    intervalMs?: number;
    onStatus?: (build: BuildRecord) => void;
    onLogLine?: (line: string) => void;
  } = {}
): Promise<BuildRecord> {
  const intervalMs = options.intervalMs ?? 2000;
  let lastLogCount = 0;

  for (;;) {
    const { build } = await getBuild(config, buildName);
    options.onStatus?.(build);

    if (build.logs?.length) {
      const newLogs = build.logs.slice(lastLogCount);
      for (const entry of newLogs) {
        options.onLogLine?.(entry.message);
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
