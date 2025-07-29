import { createClient } from "redis";
import { BuildStatus } from "../model/Builds.model";

const pubClient = createClient({
  url: process.env.REDIS_URL,
});
pubClient.on("error", (err) => console.error("❌ Redis Pub Error:", err));
pubClient.on("end", () => console.log("Redis Pub connection ended, attempting reconnect..."));
pubClient.on("reconnecting", () => console.log("Redis Pub reconnecting..."));

(async () => {
  try {
    await pubClient.connect();
    console.log("✅ Connected to Redis (Publisher)");
  } catch (err) {
    console.error("❌ Failed to connect to Redis (Publisher):", err);
  }
})();

export async function publishLog(buildId: string, message: string) {
  try {
    await pubClient.publish(`logs:${buildId}`, JSON.stringify(message));
  } catch (err : any) {
    console.error(`Failed to publish to logs:${buildId}: ${err.message}`);
    throw err; // Allow caller to handle or retry
  }
}
// pub.ts
export async function publishStatus(buildId: string, status: BuildStatus.Queued | BuildStatus.Building |BuildStatus.Success| BuildStatus.Failed) {
  try {
    await pubClient.publish(`status:${buildId}`, status);
  } catch (err: any) {
    console.error(`Failed to publish status to status:${buildId}: ${err.message}`);
  }
}

