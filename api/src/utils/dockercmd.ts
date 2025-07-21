// src/utils/dockerCmd.ts
export function dockerCmd(hostPath: string, shellCommand: string, name?: string): string[] {
  const volPath = hostPath.replace(/\\/g, "/");

  const args = [
    "run",
    "--rm",
    "-v", `${volPath}:/app`,
    "-w", "/app",
  ];

  if (name) {
    args.push("--name", name);
  }

  // Use Node.js 20 instead of 18
  args.push("node:20");

  args.push("sh", "-c", shellCommand);

  return args;
}