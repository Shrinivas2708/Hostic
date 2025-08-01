// src/utils/runStreaming.ts
import { spawn } from "child_process";
import type { BuildLogger } from "./logger";

/*
 * Spawn docker (argv form) and stream stdout/stderr chunks to logger.
 * We split on newlines but also emit partial lines so progress bars show.
 */
export function runStreamingDocker(argv: string[], logger: BuildLogger): Promise<void> {
  logger.log(`Running container`);

  return new Promise((resolve, reject) => {
    const child = spawn("docker", argv, { stdio: ["ignore", "pipe", "pipe"] });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      chunk.split(/\r?\n/).forEach((line) => {
        if (line.trim().length) logger.log(`📜 ${line}`);
      });
    });

    child.stderr.on("data", (chunk: string) => {
      chunk.split(/\r?\n/).forEach((line) => {
        if (line.trim().length) logger.error(`⚠️ ${line}`);
      });
    });

    child.on("error", (err) => {
      logger.error(`spawn error: ${err.message}`);
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        logger.log("✅  step exited 0");
        resolve();
      } else {
        logger.error(`❌  step failed (exit ${code})`);
        reject(new Error(`docker exit ${code}`));
      }
    });
  });
}
