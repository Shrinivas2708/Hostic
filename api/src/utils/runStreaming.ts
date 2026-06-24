import { spawn } from "child_process";
import type { BuildLogger } from "./logger";

export function runStreamingDocker(
  argv: string[],
  logger: BuildLogger
): Promise<void> {
  logger.log("Running build container");

  return new Promise((resolve, reject) => {
    const child = spawn("docker", argv, { stdio: ["ignore", "pipe", "pipe"] });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      chunk.split(/\r?\n/).forEach((line) => {
        if (line.trim().length) logger.stdout(line);
      });
    });

    child.stderr.on("data", (chunk: string) => {
      chunk.split(/\r?\n/).forEach((line) => {
        if (line.trim().length) logger.stderr(line);
      });
    });

    child.on("error", (err) => {
      logger.error(`Docker spawn error: ${err.message}`);
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        logger.success("Install and build completed");
        resolve();
      } else {
        logger.error(`Build failed with exit code ${code}`);
        reject(new Error(`docker exit ${code}`));
      }
    });
  });
}
