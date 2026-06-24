import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const IS_WINDOWS = process.platform === "win32";

export function toDockerVolumePath(hostPath: string): string {
  return path.resolve(hostPath).replace(/\\/g, "/");
}

export function runDockerQuiet(argv: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", argv, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker exit ${code}`));
    });
  });
}

/** Copy a directory tree using Linux inside Docker (avoids Windows bind-mount permission issues). */
export async function dockerCopyDir(
  srcHost: string,
  destHost: string
): Promise<void> {
  const src = toDockerVolumePath(srcHost);
  const dest = toDockerVolumePath(destHost);
  await fs.promises.mkdir(path.dirname(destHost), { recursive: true });

  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${src}:/from:ro`,
    "-v",
    `${path.dirname(dest)}:/parent`,
    "node:20",
    "sh",
    "-c",
    `rm -rf "/parent/${path.basename(dest)}" && cp -a /from "/parent/${path.basename(dest)}"`,
  ]);
}

export async function safeRemoveDir(dir: string): Promise<void> {
  try {
    await fs.promises.rm(dir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
    return;
  } catch {
    /* fall through to docker cleanup on Windows */
  }

  if (!IS_WINDOWS || !fs.existsSync(dir)) return;

  const vol = toDockerVolumePath(dir);
  await runDockerQuiet([
    "run",
    "--rm",
    "-v",
    `${vol}:/work`,
    "alpine",
    "sh",
    "-c",
    "find /work -mindepth 1 -delete 2>/dev/null || rm -rf /work/*",
  ]);
}
