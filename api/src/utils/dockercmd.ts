// src/utils/dockerCmd.ts
import { IS_WINDOWS } from "./dockerFs";

export type DockerVolume = {
  host: string;
  container: string;
  readOnly?: boolean;
};

/** Optional caps so local Docker builds do not hog the whole machine (see api/.env). */
function dockerResourceArgs(): string[] {
  const args: string[] = [];
  const cpus = process.env.BUILD_DOCKER_CPUS?.trim();
  const memory = process.env.BUILD_DOCKER_MEMORY?.trim();
  if (cpus) args.push("--cpus", cpus);
  if (memory) args.push("--memory", memory);
  return args;
}

export function dockerCmd(
  hostPath: string,
  shellCommand: string,
  name?: string,
  extraVolumes?: DockerVolume[]
): string[] {
  const volPath = hostPath.replace(/\\/g, "/");

  const args = ["run", "--rm", ...dockerResourceArgs(), "-v", `${volPath}:/app`, "-w", "/app"];

  for (const vol of extraVolumes ?? []) {
    const host = vol.host.replace(/\\/g, "/");
    const ro = vol.readOnly ? ":ro" : "";
    args.push("-v", `${host}:${vol.container}${ro}`);
  }

  // On Windows, --user breaks bind-mount permissions for node_modules/.bin symlinks.
  if (!IS_WINDOWS) {
    args.push(
      "--user",
      `${process.getuid?.() || 1000}:${process.getgid?.() || 1000}`
    );
  }

  if (name) {
    args.push("--name", name);
  }

  args.push("node:20");
  args.push("sh", "-c", shellCommand);

  return args;
}