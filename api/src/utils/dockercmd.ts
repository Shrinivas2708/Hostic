// src/utils/dockerCmd.ts
import { IS_WINDOWS } from "./dockerFs";

export function dockerCmd(hostPath: string, shellCommand: string, name?: string): string[] {
  const volPath = hostPath.replace(/\\/g, "/");

  const args = ["run", "--rm", "-v", `${volPath}:/app`, "-w", "/app"];

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