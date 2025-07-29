import { createClient } from "redis";
import { BuildStatus } from "../model/Builds.model";

const pubClient = createClient({
  url: process.env.REDIS_URL,
});
pubClient.on("error", (err) => console.error("❌ Redis Pub Error:", err));
pubClient.on("end", () => console.log("Redis Pub connection ended, attempting reconnect..."));
pubClient.on("reconnecting", () => console.log("Redis Pub reconnecting..."));

let redisReady: Promise<void>;
(async () => {
  try {
    await pubClient.connect();
    console.log("✅ Connected to Redis (Publisher)");
    redisReady = Promise.resolve(); // Mark as ready
  } catch (err) {
    console.error("❌ Failed to connect to Redis (Publisher):", err);
    redisReady = Promise.reject(err); // Ensure rejection if connection fails
  }
})();

// Export redisReady for use in processJob
export { pubClient, redisReady };

export async function publishLog(buildId: string, message: string) {
  try {
    await pubClient.publish(`logs:${buildId}`, JSON.stringify(message));
  } catch (err: any) {
    console.error(`Failed to publish to logs:${buildId}: ${err.message}`);
    throw err;
  }
}

export async function publishStatus(buildId: string, status: BuildStatus) {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} - Attempting to publish status ${status} for buildId ${buildId}`);
  try {
    await pubClient.publish(`status:${buildId}`, status);
    console.log(`[DEBUG] ${timestamp} - Successfully published status ${status} for buildId ${buildId}`);
  } catch (err: any) {
    console.error(`[ERROR] ${timestamp} - Failed to publish status to status:${buildId}: ${err.message}`);
  }
}