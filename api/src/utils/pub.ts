import { createClient } from "redis";
import { BuildStatus } from "../model/Builds.model";

export type LogLevel = "info" | "error" | "stdout" | "stderr" | "success";

export type LogEntry = {
  level: LogLevel;
  message: string;
  at: number;
};

const pubClient = createClient({
  url: process.env.REDIS_URL,
});
pubClient.on("error", (err) => console.error("Redis Pub Error:", err));

let redisReady: Promise<void>;
(async () => {
  try {
    await pubClient.connect();
    console.log("Connected to Redis (Publisher)");
    redisReady = Promise.resolve();
  } catch (err) {
    console.error("Failed to connect to Redis (Publisher):", err);
    redisReady = Promise.reject(err);
  }
})();

export { pubClient, redisReady };

export async function publishLog(buildId: string, entry: LogEntry) {
  try {
    await pubClient.publish(`logs:${buildId}`, JSON.stringify(entry));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to publish to logs:${buildId}: ${message}`);
    throw err;
  }
}

export async function publishStatus(buildId: string, status: BuildStatus) {
  try {
    await pubClient.publish(`status:${buildId}`, status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to publish status to status:${buildId}: ${message}`);
  }
}
