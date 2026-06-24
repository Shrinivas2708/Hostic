import type { HosticConfig } from "./config";
import { getDeploymentUrl } from "./config";
import { waitForBuild } from "./poll";
import { BuildLogStream, type BuildLogEntry } from "./buildLogs";
import { fail } from "./ui";

function buildDurationMs(
  startedAt?: string,
  finishedAt?: string
): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms > 0 ? ms : undefined;
}

export async function watchDeploymentBuild(
  config: HosticConfig,
  buildName: string,
  slug: string
): Promise<void> {
  const stream = new BuildLogStream();
  const siteUrl = getDeploymentUrl(slug, config.deployUrlTemplate);
  let lastStatus: string | null = null;

  stream.printHeader(buildName, slug);

  const build = await waitForBuild(config, buildName, {
    intervalMs: 1500,
    onStatusChange: (status) => {
      if (status === lastStatus) return;
      lastStatus = status;
      stream.printStatus(status);
    },
    onLogEntry: (entry) => {
      stream.printEntry(entry);
    },
  });

  const duration = buildDurationMs(build.startedAt, build.finishedAt);

  if (build.status === "success") {
    stream.printFooter("success", siteUrl, duration);
    return;
  }

  stream.printFooter("failed", siteUrl, duration);
  fail(`Build ${buildName} failed`);
}
